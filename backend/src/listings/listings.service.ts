import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
  ) {}

  async create(data: Partial<Listing>): Promise<Listing> {
    const listing = this.listingRepo.create(data);
    return this.listingRepo.save(listing);
  }

  async findOne(id: string): Promise<Listing | null> {
    return this.listingRepo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findAll(filters?: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
  }): Promise<Listing[]> {
    const qb = this.listingRepo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.user', 'user')
      .where('listing.status = :status', { status: 'active' });

    if (filters?.category) {
      qb.andWhere('listing.category = :category', {
        category: filters.category,
      });
    }

    return qb.getMany();
  }

  async update(id: string, data: Partial<Listing>): Promise<Listing | null> {
    await this.listingRepo.update(id, data);
    return this.findOne(id);
  }
}
