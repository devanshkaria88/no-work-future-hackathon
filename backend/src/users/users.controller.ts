import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { BlackboardService } from '../agents/blackboard/blackboard.service';
import { BlackboardSection } from '../agents/blackboard/blackboard.types';
import { ScoutService } from '../agents/scout/scout.service';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly blackboard: BlackboardService,
    private readonly scout: ScoutService,
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      skills: string[];
      locationArea: string;
      lat: number;
      lng: number;
      status?: string;
      preferences?: Record<string, any>;
      previousRole?: string;
    },
  ) {
    const user = await this.usersService.create(body);
    this.blackboard.write(BlackboardSection.USER_PROFILES, user);
    return user;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/opportunities')
  async getOpportunities(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) return { error: 'User not found' };
    const result = await this.scout.analyze(user);
    return { opportunities: result.opportunities };
  }
}
