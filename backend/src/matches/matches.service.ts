import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { Negotiation } from './entities/negotiation.entity';
import { Booking } from './entities/booking.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(Negotiation)
    private readonly negotiationRepo: Repository<Negotiation>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async findMatchesByUser(userId: string): Promise<Match[]> {
    return this.matchRepo
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.listing', 'listing')
      .leftJoinAndSelect('match.demand', 'demand')
      .where('listing.userId = :userId', { userId })
      .orWhere('demand.userId = :userId', { userId })
      .getMany();
  }

  async findNegotiation(id: string): Promise<Negotiation | null> {
    return this.negotiationRepo.findOne({ where: { id } });
  }

  async findNegotiationTranscript(
    id: string,
  ): Promise<{ from: string; text: string; timestamp: string }[]> {
    const negotiation = await this.negotiationRepo.findOne({
      where: { id },
    });
    return negotiation?.transcript || [];
  }

  async approveNegotiation(
    id: string,
    userId: string,
    approved: boolean,
  ): Promise<Negotiation | null> {
    const negotiation = await this.negotiationRepo.findOne({
      where: { id },
    });
    if (!negotiation) return null;

    // Simplified: just set approval flags
    // In production, check which side the user is on
    await this.negotiationRepo.update(id, {
      buyerApproved: approved,
      sellerApproved: approved,
    });

    if (approved) {
      const booking = this.bookingRepo.create({
        listingId: negotiation.matchId,
        buyerId: userId,
        negotiationId: id,
        pricePence: negotiation.finalPricePence || 0,
        quantity: negotiation.quantity || 1,
        status: 'confirmed',
      });
      await this.bookingRepo.save(booking);
    }

    return this.findNegotiation(id);
  }
}
