import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing } from './entities/listing.entity';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing]),
    forwardRef(() => AgentsModule),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService, TypeOrmModule],
})
export class ListingsModule {}
