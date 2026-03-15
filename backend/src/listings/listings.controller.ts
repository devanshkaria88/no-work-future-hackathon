import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { BlackboardService } from '../agents/blackboard/blackboard.service';
import { BlackboardSection } from '../agents/blackboard/blackboard.types';

@Controller('api/listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly blackboard: BlackboardService,
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      userId: string;
      title: string;
      description: string;
      pricePence: number;
      minimumPricePence?: number;
      capacity: number;
      category: string;
      lat: number;
      lng: number;
      tags?: string[];
      included?: string[];
      timeSlot?: string;
    },
  ) {
    const listing = await this.listingsService.create({
      ...body,
      timeSlot: body.timeSlot ? new Date(body.timeSlot) : undefined,
    });
    this.blackboard.write(BlackboardSection.ACTIVE_LISTINGS, listing);
    return listing;
  }

  @Get()
  async findAll(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('category') category?: string,
  ) {
    return this.listingsService.findAll({
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      category,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.listingsService.update(id, body);
  }
}
