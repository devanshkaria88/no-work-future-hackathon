import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaudeService } from '../../common/llm/claude.service';
import { BlackboardGateway } from '../blackboard/blackboard.gateway';
import { BlackboardService } from '../blackboard/blackboard.service';
import { BlackboardSection } from '../blackboard/blackboard.types';
import { buildBuyerPrompt } from './buyer-negotiator.prompt';
import { buildSellerPrompt } from './seller-negotiator.prompt';
import {
  NegotiationMessage,
  NegotiationResult,
  DealTerms,
} from '../../common/types';
import { Negotiation } from '../../matches/entities/negotiation.entity';
import { Booking } from '../../matches/entities/booking.entity';

const DEAL_EXTRACTION_PROMPT = `Extract the agreed deal terms from this negotiation transcript.
Output ONLY valid JSON with this structure:
{
  "price_per_person_pence": 2600,
  "quantity": 2,
  "total_pence": 5200,
  "special_conditions": ["Group rate for 2 people"],
  "agreed_time": "Saturday 2pm"
}`;

@Injectable()
export class NegotiatorService {
  private readonly logger = new Logger(NegotiatorService.name);

  constructor(
    private readonly claude: ClaudeService,
    private readonly gateway: BlackboardGateway,
    private readonly blackboard: BlackboardService,
    @InjectRepository(Negotiation)
    private readonly negotiationRepo: Repository<Negotiation>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async runNegotiation(match: any): Promise<NegotiationResult> {
    const MAX_ROUNDS = 6;
    const MESSAGE_DELAY_MS = 1500;
    const messages: NegotiationMessage[] = [];

    const listing = match.listing;
    const demand = match.demand;

    // Create negotiation record
    const negotiation = this.negotiationRepo.create({
      matchId: match.id,
      transcript: [],
      outcome: 'in_progress',
    });
    const saved = await this.negotiationRepo.save(negotiation);
    const negotiationId = saved.id;

    const budgetMax = demand.budgetMaxPence || 4000;
    const budgetPreferred = Math.round(budgetMax * 0.75);
    const partySize = demand.user?.preferences?.partySize || 1;
    const buyerFlexibility =
      demand.user?.preferences?.flexibility || 'medium';

    const buyerSystemPrompt = buildBuyerPrompt({
      buyer_max_budget: `£${(budgetMax / 100).toFixed(0)} per person`,
      buyer_preferred_price: `£${(budgetPreferred / 100).toFixed(0)} per person`,
      buyer_party_size: `${partySize} people`,
      buyer_flexibility: buyerFlexibility,
    });

    const sellerMinPrice =
      listing.minimumPricePence || Math.round(listing.pricePence * 0.7);
    const remainingCapacity = listing.capacity - (listing.booked || 0);

    const sellerSystemPrompt = buildSellerPrompt({
      listing_title: listing.title,
      listing_description:
        listing.description || listing.title,
      listing_includes: (listing.included || []).join(', ') || 'Full session',
      listing_price: `£${(listing.pricePence / 100).toFixed(0)} per person`,
      seller_minimum_price: `£${(sellerMinPrice / 100).toFixed(0)} per person`,
      remaining_capacity: `${remainingCapacity}`,
      seller_flexibility: 'medium',
    });

    // Emit negotiation start
    this.gateway.emit('negotiation:started', {
      negotiationId,
      buyerLocation: { lat: demand.lat, lng: demand.lng },
      sellerLocation: { lat: listing.lat, lng: listing.lng },
    });

    this.blackboard.write(BlackboardSection.NEGOTIATIONS, {
      id: negotiationId,
      matchId: match.id,
      status: 'in_progress',
      messages: [],
    });

    // Buyer opens the negotiation
    const buyerOpening = await this.claude.chat({
      system: buyerSystemPrompt,
      messages: [
        {
          role: 'user',
          content: `You've found a listing: "${listing.title}" priced at £${(listing.pricePence / 100).toFixed(0)} per person. Your human wants to book ${partySize} spots. Open the negotiation with the seller's agent.`,
        },
      ],
    });

    messages.push({
      from: 'buyer',
      text: buyerOpening,
      timestamp: new Date(),
    });
    this.gateway.emit('negotiation:message', {
      negotiationId,
      from: 'buyer',
      message: buyerOpening,
      agentName: 'Buyer Agent',
      agentColor: '#378ADD',
    });

    // Turn-based conversation loop
    let lastMessage = buyerOpening;
    let currentTurn: 'seller' | 'buyer' = 'seller';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      await this.delay(MESSAGE_DELAY_MS);

      const systemPrompt =
        currentTurn === 'seller' ? sellerSystemPrompt : buyerSystemPrompt;

      const conversationHistory = this.buildConversationHistory(
        messages,
        currentTurn,
      );

      const response = await this.claude.chat({
        system: systemPrompt,
        messages: conversationHistory,
      });

      messages.push({
        from: currentTurn,
        text: response,
        timestamp: new Date(),
      });

      this.gateway.emit('negotiation:message', {
        negotiationId,
        from: currentTurn,
        message: response,
        agentName:
          currentTurn === 'seller' ? 'Seller Agent' : 'Buyer Agent',
        agentColor: currentTurn === 'seller' ? '#EF9F27' : '#378ADD',
      });

      // Check if deal was reached
      if (this.detectAgreement(response, lastMessage)) {
        const terms = await this.extractDealTerms(messages);

        // Update negotiation record
        await this.negotiationRepo.update(negotiationId, {
          transcript: messages.map((m) => ({
            from: m.from,
            text: m.text,
            timestamp: m.timestamp.toISOString(),
          })),
          finalPricePence: terms.price_per_person_pence,
          quantity: terms.quantity,
          outcome: 'deal',
        });

        this.gateway.emit('negotiation:deal-reached', {
          negotiationId,
          terms,
        });

        this.blackboard.update(
          BlackboardSection.NEGOTIATIONS,
          negotiationId,
          { status: 'deal', terms },
        );

        return { outcome: 'deal', terms, transcript: messages };
      }

      lastMessage = response;
      currentTurn = currentTurn === 'seller' ? 'buyer' : 'seller';
    }

    // Max rounds reached without deal
    await this.negotiationRepo.update(negotiationId, {
      transcript: messages.map((m) => ({
        from: m.from,
        text: m.text,
        timestamp: m.timestamp.toISOString(),
      })),
      outcome: 'abandoned',
    });

    this.gateway.emit('negotiation:abandoned', {
      negotiationId,
      reason: 'Could not reach agreement within 6 rounds',
    });

    this.blackboard.update(BlackboardSection.NEGOTIATIONS, negotiationId, {
      status: 'abandoned',
    });

    return { outcome: 'abandoned', transcript: messages };
  }

  private buildConversationHistory(
    messages: NegotiationMessage[],
    currentTurn: 'buyer' | 'seller',
  ): { role: 'user' | 'assistant'; content: string }[] {
    return messages.map((msg) => ({
      role: (msg.from === currentTurn ? 'assistant' : 'user') as
        | 'user'
        | 'assistant',
      content: msg.text,
    }));
  }

  private detectAgreement(latest: string, previous: string): boolean {
    const agreementPatterns = [
      /\bdeal\b/i,
      /\bagreed\b/i,
      /\baccept/i,
      /\bsound[s]? good\b/i,
      /\bworks for me\b/i,
      /\blet'?s do it\b/i,
      /\bconfirm/i,
      /\byou'?ve got a deal\b/i,
      /\bdone\b/i,
      /\bthat works\b/i,
      /\bperfect\b/i,
      /\bsold\b/i,
    ];
    return (
      agreementPatterns.some((p) => p.test(latest)) &&
      agreementPatterns.some((p) => p.test(previous))
    );
  }

  private async extractDealTerms(
    messages: NegotiationMessage[],
  ): Promise<DealTerms> {
    const transcript = messages
      .map((m) => `[${m.from.toUpperCase()} AGENT]: ${m.text}`)
      .join('\n\n');

    try {
      return await this.claude.chatJSON<DealTerms>({
        system: DEAL_EXTRACTION_PROMPT,
        messages: [{ role: 'user', content: transcript }],
      });
    } catch {
      this.logger.warn('Deal term extraction failed, using defaults');
      return {
        price_per_person_pence: 0,
        quantity: 1,
        total_pence: 0,
        special_conditions: [],
        agreed_time: 'TBD',
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
