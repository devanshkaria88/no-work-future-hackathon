import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { BlackboardService } from '../agents/blackboard/blackboard.service';
import { BlackboardSection } from '../agents/blackboard/blackboard.types';
import { UsersService } from '../users/users.service';
import { ListingsService } from '../listings/listings.service';
import { DemandService } from '../demand/demand.service';
import { MatchesService } from '../matches/matches.service';
import { ScoutService } from '../agents/scout/scout.service';
import { PackagerService } from '../agents/packager/packager.service';
import { VoiceSession } from './voice.types';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  // In-memory session store (hackathon-scale — no need for DB table)
  private readonly sessions = new Map<string, VoiceSession>();

  constructor(
    @Inject(forwardRef(() => BlackboardService))
    private readonly blackboard: BlackboardService,
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
    private readonly demandService: DemandService,
    private readonly matchesService: MatchesService,
    @Inject(forwardRef(() => ScoutService))
    private readonly scout: ScoutService,
    @Inject(forwardRef(() => PackagerService))
    private readonly packager: PackagerService,
  ) {}

  // ─── Session Management (matching iterate project pattern) ──────────────────

  createSession(params: {
    id: string;
    userId?: string;
    sessionType: string;
  }): VoiceSession {
    const session: VoiceSession = {
      id: params.id,
      userId: params.userId,
      sessionType: params.sessionType,
      status: 'active',
      createdAt: new Date(),
    };
    this.sessions.set(params.id, session);
    this.logger.log(`Voice session created: ${params.id}`);
    return session;
  }

  completeSession(params: {
    sessionId?: string;
    conversationId?: string;
    userId?: string;
    transcript: string;
    messages: Array<{
      role: string;
      content: string;
      time_in_call_secs?: number;
    }>;
  }): void {
    let session: VoiceSession | undefined;

    // Find session by sessionId first, then by conversationId
    if (params.sessionId) {
      session = this.sessions.get(params.sessionId);
    }

    if (!session && params.conversationId) {
      session = Array.from(this.sessions.values()).find(
        (s) => s.elevenlabsConversationId === params.conversationId,
      );
    }

    if (session) {
      session.status = 'completed';
      session.transcript = params.transcript;
      session.messages = params.messages;
      session.endedAt = new Date();
      if (params.conversationId) {
        session.elevenlabsConversationId = params.conversationId;
      }
      if (params.userId) {
        session.userId = params.userId;
      }
      this.logger.log(`Voice session completed: ${session.id}`);
    } else {
      this.logger.warn(
        `Session not found for sessionId=${params.sessionId} conversationId=${params.conversationId}`,
      );
    }
  }

  /**
   * Process session asynchronously after returning 200 to ElevenLabs.
   * Extracts user intent from the transcript and triggers appropriate agents.
   */
  async processPostCallAsync(
    sessionId?: string,
    userId?: string,
    transcript?: string,
  ): Promise<void> {
    if (!transcript) return;

    this.logger.log(
      `Processing post-call transcript for session ${sessionId}`,
    );

    // If we have a userId, trigger Scout to find opportunities
    if (userId) {
      const user = await this.usersService.findOne(userId);
      if (user) {
        this.scout.analyze(user).catch((err) => {
          this.logger.error('Post-call scout analysis failed', err);
        });
      }
    }
  }

  // ─── Voice Tool Handlers (called by ElevenLabs during live conversation) ────

  async writeUserProfile(params: {
    name: string;
    skills: string[];
    location_area: string;
    lat: number;
    lng: number;
    previous_role?: string;
    status?: string;
  }) {
    const user = await this.usersService.create({
      name: params.name,
      skills: params.skills,
      locationArea: params.location_area,
      lat: params.lat,
      lng: params.lng,
      previousRole: params.previous_role,
      status: params.status || 'exploring',
    });

    this.blackboard.write(BlackboardSection.USER_PROFILES, user);

    return {
      user_id: user.id,
      message: `Profile created for ${user.name} in ${user.locationArea}. Scanning for opportunities now.`,
    };
  }

  async getOpportunities(params: { user_id: string }) {
    const user = await this.usersService.findOne(params.user_id);
    if (!user) return { error: 'User not found', opportunities: [] };

    const result = await this.scout.analyze(user);
    return {
      opportunities: result.opportunities.map((o) => ({
        title: o.title,
        category: o.category,
        demand_score: o.demand_score,
        suggested_price_range: o.suggested_price_range,
        reasoning: o.reasoning,
      })),
      message: `Found ${result.opportunities.length} opportunities for you.`,
    };
  }

  async getDraftListing(params: {
    user_id: string;
    opportunity_index?: number;
  }) {
    const opportunities = this.blackboard.read(
      BlackboardSection.OPPORTUNITIES,
      { userId: params.user_id },
    );

    if (!opportunities || opportunities.length === 0) {
      return {
        error: 'No opportunities found. Run get-opportunities first.',
      };
    }

    const opportunity = opportunities[params.opportunity_index || 0];
    const draft = await this.packager.draft(opportunity);

    return {
      listing_draft: draft.listing,
      message: `Here's your listing draft: "${draft.listing.title}" at £${(draft.listing.price_per_person_pence / 100).toFixed(0)} per person.`,
    };
  }

  async publishListing(params: {
    user_id: string;
    title: string;
    description: string;
    price_pence: number;
    capacity: number;
    category: string;
    lat: number;
    lng: number;
    tags?: string[];
    included?: string[];
  }) {
    const listing = await this.listingsService.create({
      userId: params.user_id,
      title: params.title,
      description: params.description,
      pricePence: params.price_pence,
      minimumPricePence: Math.round(params.price_pence * 0.7),
      capacity: params.capacity,
      category: params.category,
      lat: params.lat,
      lng: params.lng,
      tags: params.tags,
      included: params.included,
    });

    this.blackboard.write(BlackboardSection.ACTIVE_LISTINGS, listing);

    return {
      listing_id: listing.id,
      message: `Your listing "${listing.title}" is now live on the Borough map!`,
    };
  }

  async getMatches(params: { user_id: string }) {
    const matches = await this.matchesService.findMatchesByUser(
      params.user_id,
    );
    return {
      matches: matches.map((m) => ({
        id: m.id,
        listing_title: m.listing?.title,
        confidence: m.confidence,
        status: m.status,
      })),
      message: `Found ${matches.length} matches.`,
    };
  }

  async approveDeal(params: {
    negotiation_id: string;
    user_id: string;
    approved: boolean;
  }) {
    await this.matchesService.approveNegotiation(
      params.negotiation_id,
      params.user_id,
      params.approved,
    );

    return {
      message: params.approved
        ? 'Deal approved! Your booking is confirmed.'
        : 'Deal declined.',
    };
  }

  async getLocalContext(params: { lat: number; lng: number }) {
    const bubbles = this.blackboard.read(BlackboardSection.ACTIVE_LISTINGS);
    const demands = this.blackboard.read(BlackboardSection.DEMAND_SIGNALS);

    return {
      nearby_listings: (bubbles || []).length,
      nearby_demands: (demands || []).length,
      message: `There are ${(bubbles || []).length} listings and ${(demands || []).length} requests active near you.`,
    };
  }
}
