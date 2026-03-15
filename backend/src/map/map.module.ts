import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { Listing } from '../listings/entities/listing.entity';
import { DemandSignal } from '../demand/entities/demand-signal.entity';
import { Negotiation } from '../matches/entities/negotiation.entity';
import { Match } from '../matches/entities/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, DemandSignal, Negotiation, Match]),
  ],
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService],
})
export class MapModule {}
