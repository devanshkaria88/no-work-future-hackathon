import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listings/entities/listing.entity';
import { DemandSignal } from '../demand/entities/demand-signal.entity';
import { Negotiation } from '../matches/entities/negotiation.entity';
import { Match } from '../matches/entities/match.entity';
import { MapBubble } from '../common/types';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(DemandSignal)
    private readonly demandRepo: Repository<DemandSignal>,
    @InjectRepository(Negotiation)
    private readonly negotiationRepo: Repository<Negotiation>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async getBubbles(): Promise<{ supply: MapBubble[]; demand: MapBubble[] }> {
    const listings = await this.listingRepo.find({
      where: { status: 'active' },
      relations: ['user'],
    });

    const demands = await this.demandRepo.find({
      where: { status: 'active' },
      relations: ['user'],
    });

    const supply: MapBubble[] = listings.map((l) => ({
      id: l.id,
      type: 'supply' as const,
      lat: Number(l.lat),
      lng: Number(l.lng),
      title: l.title,
      category: l.category,
      pricePence: l.pricePence,
      capacity: l.capacity,
      booked: l.booked,
      userId: l.userId,
      userName: l.user?.name,
      status: l.status,
    }));

    const demand: MapBubble[] = demands.map((d) => ({
      id: d.id,
      type: 'demand' as const,
      lat: Number(d.lat),
      lng: Number(d.lng),
      title: d.query,
      budgetMaxPence: d.budgetMaxPence,
      radiusMeters: d.radiusMeters,
      userId: d.userId,
      userName: d.user?.name,
    }));

    return { supply, demand };
  }

  async getActivityHeatmap(borough?: string) {
    const listings = await this.listingRepo.find({
      where: { status: 'active' },
    });

    const cells = listings.map((l) => ({
      lat: Number(l.lat),
      lng: Number(l.lng),
      intensity: Math.random() * 0.5 + 0.5,
    }));

    return { cells };
  }

  async getActiveNegotiations() {
    const negotiations = await this.negotiationRepo.find({
      where: { outcome: 'in_progress' },
    });

    const results = [];
    for (const neg of negotiations) {
      const match = await this.matchRepo.findOne({
        where: { id: neg.matchId },
        relations: ['listing', 'demand'],
      });
      if (match?.listing && match?.demand) {
        results.push({
          id: neg.id,
          buyerLat: Number(match.demand.lat),
          buyerLng: Number(match.demand.lng),
          sellerLat: Number(match.listing.lat),
          sellerLng: Number(match.listing.lng),
          status: neg.outcome,
        });
      }
    }

    return { negotiations: results };
  }
}
