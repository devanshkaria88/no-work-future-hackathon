import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BlackboardSection,
  BlackboardEvent,
} from '../blackboard/blackboard.types';
import { ScoutService } from '../scout/scout.service';
import { PackagerService } from '../packager/packager.service';
import { MatchmakerService } from '../matchmaker/matchmaker.service';
import { NegotiatorService } from '../negotiator/negotiator.service';
import { BlackboardGateway } from '../blackboard/blackboard.gateway';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private negotiationQueue: any[] = [];
  private isNegotiating = false;

  constructor(
    @Inject(forwardRef(() => ScoutService))
    private readonly scout: ScoutService,
    @Inject(forwardRef(() => PackagerService))
    private readonly packager: PackagerService,
    @Inject(forwardRef(() => MatchmakerService))
    private readonly matchmaker: MatchmakerService,
    @Inject(forwardRef(() => NegotiatorService))
    private readonly negotiator: NegotiatorService,
    private readonly gateway: BlackboardGateway,
  ) {}

  @OnEvent('blackboard.change')
  async handleBlackboardChange(event: BlackboardEvent): Promise<void> {
    this.logger.log(
      `Blackboard change: ${event.section} (${event.action})`,
    );

    try {
      switch (event.section) {
        case BlackboardSection.USER_PROFILES:
          if (event.action === 'write') {
            await this.onNewUserProfile(event.data);
          }
          break;

        case BlackboardSection.OPPORTUNITIES:
          if (event.action === 'write') {
            await this.onOpportunityFound(event.data);
          }
          break;

        case BlackboardSection.ACTIVE_LISTINGS:
          if (event.action === 'write') {
            await this.onListingLive(event.data);
          }
          break;

        case BlackboardSection.DEMAND_SIGNALS:
          if (event.action === 'write') {
            await this.onNewDemandSignal(event.data);
          }
          break;

        case BlackboardSection.MATCHES:
          if (event.action === 'write' && event.data.confidence > 0.8) {
            await this.onHighConfidenceMatch(event.data);
          }
          break;

        case BlackboardSection.TRANSACTIONS:
          if (event.action === 'write') {
            await this.onBookingConfirmed(event.data);
          }
          break;
      }
    } catch (error) {
      this.logger.error(
        `Orchestrator trigger failed for ${event.section}`,
        error,
      );
    }
  }

  private async onNewUserProfile(profile: any): Promise<void> {
    this.logger.log(`Triggering Scout for user: ${profile.name}`);
    this.gateway.emit('agent:scout-scanning', {
      userId: profile.id,
      area: profile.locationArea,
    });
    // Fire-and-forget: don't block the blackboard write
    this.scout.analyze(profile).catch((err) => {
      this.logger.error('Scout analysis failed', err);
    });
  }

  private async onOpportunityFound(opportunity: any): Promise<void> {
    this.logger.log(`Triggering Packager for opportunity: ${opportunity.title}`);
    this.gateway.emit('agent:packager-drafting', {
      userId: opportunity.userId,
    });
    this.packager.draft(opportunity).catch((err) => {
      this.logger.error('Packager drafting failed', err);
    });
  }

  private async onListingLive(listing: any): Promise<void> {
    this.logger.log(`Triggering Matchmaker for listing: ${listing.title}`);
    this.gateway.emit('map:bubble-added', {
      type: 'supply',
      bubble: {
        id: listing.id,
        type: 'supply',
        lat: listing.lat,
        lng: listing.lng,
        title: listing.title,
        category: listing.category,
        pricePence: listing.pricePence,
        capacity: listing.capacity,
        booked: listing.booked || 0,
        userId: listing.userId,
      },
    });
    this.matchmaker.scan(listing).catch((err) => {
      this.logger.error('Matchmaker scan failed', err);
    });
  }

  private async onNewDemandSignal(demand: any): Promise<void> {
    this.logger.log(`Triggering Matchmaker for demand: ${demand.query}`);
    this.gateway.emit('map:bubble-added', {
      type: 'demand',
      bubble: {
        id: demand.id,
        type: 'demand',
        lat: demand.lat,
        lng: demand.lng,
        title: demand.query,
        budgetMaxPence: demand.budgetMaxPence,
        radiusMeters: demand.radiusMeters,
        userId: demand.userId,
      },
    });
    this.matchmaker.scanForDemand(demand).catch((err) => {
      this.logger.error('Matchmaker demand scan failed', err);
    });
  }

  private async onHighConfidenceMatch(match: any): Promise<void> {
    this.logger.log(
      `Queueing negotiation for match: ${match.id} (confidence: ${match.confidence})`,
    );
    this.gateway.emit('agent:matchmaker-found', {
      matchId: match.id,
      buyerId: match.demand?.userId,
      sellerId: match.listing?.userId,
    });
    this.negotiationQueue.push(match);
    this.processNegotiationQueue();
  }

  private async processNegotiationQueue(): Promise<void> {
    if (this.isNegotiating || this.negotiationQueue.length === 0) return;

    this.isNegotiating = true;
    const match = this.negotiationQueue.shift();

    try {
      this.logger.log(
        `Starting negotiation for match: ${match.id} (confidence: ${match.confidence})`,
      );
      await this.negotiator.runNegotiation(match);
    } catch (err) {
      this.logger.error('Negotiation failed', err);
    } finally {
      this.isNegotiating = false;
      this.processNegotiationQueue();
    }
  }

  private async onBookingConfirmed(booking: any): Promise<void> {
    this.logger.log(`Booking confirmed: ${booking.id}`);
    this.gateway.emit('booking:confirmed', {
      booking,
      celebrationLocation: {
        lat: booking.lat,
        lng: booking.lng,
      },
    });
  }
}
