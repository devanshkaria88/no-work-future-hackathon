import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaudeService } from '../../common/llm/claude.service';
import { BlackboardService } from '../blackboard/blackboard.service';
import { BlackboardSection } from '../blackboard/blackboard.types';
import { MATCHMAKER_SYSTEM_PROMPT } from './matchmaker.prompt';
import { MatchmakerOutput } from '../../common/types';
import { Listing } from '../../listings/entities/listing.entity';
import { DemandSignal } from '../../demand/entities/demand-signal.entity';
import { Match } from '../../matches/entities/match.entity';

@Injectable()
export class MatchmakerService {
  private readonly logger = new Logger(MatchmakerService.name);

  constructor(
    private readonly claude: ClaudeService,
    @Inject(forwardRef(() => BlackboardService))
    private readonly blackboard: BlackboardService,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(DemandSignal)
    private readonly demandRepo: Repository<DemandSignal>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async scan(listing: any): Promise<void> {
    this.logger.log(`Scanning demand signals for listing: ${listing.title}`);

    const demandSignals = await this.demandRepo.find({
      where: { status: 'active' },
      relations: ['user'],
    });

    if (demandSignals.length === 0) {
      this.logger.log('No active demand signals to match against');
      return;
    }

    await this.findMatches([listing], demandSignals, { bestOnly: true });
  }

  async scanForDemand(demand: any): Promise<void> {
    this.logger.log(`Scanning listings for demand: ${demand.query}`);

    const listings = await this.listingRepo.find({
      where: { status: 'active' },
      relations: ['user'],
    });

    if (listings.length === 0) {
      this.logger.log('No active listings to match against');
      return;
    }

    await this.findMatches(listings, [demand], { bestOnly: true });
  }

  async forceScan(
    listing: Listing,
    demandSignals: DemandSignal[],
  ): Promise<Match | null> {
    this.logger.log(`Force scanning for listing: ${listing.title}`);
    const matches = await this.findMatches([listing], demandSignals, { bestOnly: true });
    return matches.length > 0 ? matches[0] : null;
  }

  private async findMatches(
    listings: any[],
    demandSignals: any[],
    options?: { bestOnly?: boolean },
  ): Promise<Match[]> {
    const inputMessage = JSON.stringify({
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        pricePence: l.pricePence,
        category: l.category,
        lat: l.lat,
        lng: l.lng,
        capacity: l.capacity,
        booked: l.booked || 0,
        tags: l.tags,
        included: l.included,
      })),
      demand_signals: demandSignals.map((d) => ({
        id: d.id,
        query: d.query,
        budgetMaxPence: d.budgetMaxPence,
        lat: d.lat,
        lng: d.lng,
        radiusMeters: d.radiusMeters,
        userId: d.userId,
      })),
    });

    const result = await this.claude.chatJSON<MatchmakerOutput>({
      system: MATCHMAKER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: inputMessage }],
    });

    const savedMatches: Match[] = [];

    let matchResults = result.matches.filter((m: any) => m.confidence >= 0.5);

    if (options?.bestOnly && matchResults.length > 1) {
      matchResults.sort((a: any, b: any) => b.confidence - a.confidence);
      matchResults = [matchResults[0]];
    }

    for (const matchResult of matchResults) {

      const match = this.matchRepo.create({
        listingId: matchResult.listing_id,
        demandId: matchResult.demand_id,
        confidence: matchResult.confidence,
        reasoning: matchResult.reasoning,
        status: matchResult.trigger_negotiation ? 'negotiating' : 'pending',
      });

      const savedMatch = await this.matchRepo.save(match);

      // Hydrate with relations for the negotiator
      const listing = listings.find((l) => l.id === matchResult.listing_id);
      const demand = demandSignals.find(
        (d) => d.id === matchResult.demand_id,
      );

      const hydratedMatch = {
        ...savedMatch,
        listing,
        demand,
        confidence: matchResult.confidence,
        suggestedOpening: matchResult.suggested_opening,
      };

      this.blackboard.write(BlackboardSection.MATCHES, hydratedMatch);
      savedMatches.push(savedMatch);
    }

    return savedMatches;
  }
}
