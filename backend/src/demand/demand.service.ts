import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandSignal } from './entities/demand-signal.entity';

@Injectable()
export class DemandService {
  constructor(
    @InjectRepository(DemandSignal)
    private readonly demandRepo: Repository<DemandSignal>,
  ) {}

  async create(data: Partial<DemandSignal>): Promise<DemandSignal> {
    const signal = this.demandRepo.create(data);
    return this.demandRepo.save(signal);
  }

  async findAll(filters?: {
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<DemandSignal[]> {
    return this.demandRepo.find({
      where: { status: 'active' },
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<DemandSignal | null> {
    return this.demandRepo.findOne({
      where: { id },
      relations: ['user'],
    });
  }
}
