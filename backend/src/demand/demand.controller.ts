import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DemandService } from './demand.service';
import { BlackboardService } from '../agents/blackboard/blackboard.service';
import { BlackboardSection } from '../agents/blackboard/blackboard.types';

@Controller('api/demand')
export class DemandController {
  constructor(
    private readonly demandService: DemandService,
    private readonly blackboard: BlackboardService,
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      userId: string;
      query: string;
      budgetMaxPence: number;
      lat: number;
      lng: number;
      radiusMeters?: number;
    },
  ) {
    const signal = await this.demandService.create(body);
    this.blackboard.write(BlackboardSection.DEMAND_SIGNALS, signal);
    return signal;
  }

  @Get()
  async findAll(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    return this.demandService.findAll({
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
    });
  }
}
