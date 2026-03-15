import { Controller, Post, Query } from '@nestjs/common';
import { SeedService } from './seed.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listings/entities/listing.entity';
import { DemandSignal } from '../demand/entities/demand-signal.entity';
import { MatchmakerService } from '../agents/matchmaker/matchmaker.service';
import { BlackboardService } from '../agents/blackboard/blackboard.service';
import { BlackboardSection } from '../agents/blackboard/blackboard.types';

@Controller('api/demo')
export class SeedController {
  constructor(
    private readonly seedService: SeedService,
    private readonly matchmaker: MatchmakerService,
    private readonly blackboard: BlackboardService,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(DemandSignal)
    private readonly demandRepo: Repository<DemandSignal>,
  ) {}

  @Post('seed')
  async seed() {
    return this.seedService.seed();
  }

  @Post('reset')
  async reset() {
    await this.seedService.reset();
    const result = await this.seedService.seed();
    return { message: 'Database reset and re-seeded', ...result };
  }

  @Post('trigger-match')
  async triggerMatch(@Query('listingId') listingId: string) {
    if (!listingId) {
      // Use first listing if none specified
      const listings = await this.listingRepo.find({
        where: { status: 'active' },
        relations: ['user'],
        take: 1,
      });
      if (listings.length === 0) {
        return { error: 'No listings found. Run /api/demo/seed first.' };
      }
      listingId = listings[0].id;
    }

    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
      relations: ['user'],
    });
    if (!listing) {
      return { error: 'Listing not found' };
    }

    const demands = await this.demandRepo.find({
      where: { status: 'active' },
      relations: ['user'],
    });
    if (demands.length === 0) {
      return { error: 'No demand signals found' };
    }

    const match = await this.matchmaker.forceScan(listing, demands);

    return {
      message: 'Match triggered',
      listingId: listing.id,
      listingTitle: listing.title,
      match: match
        ? { id: match.id, confidence: match.confidence }
        : null,
    };
  }

  @Post('snapshot')
  async getSnapshot() {
    return this.blackboard.getSnapshot();
  }
}
