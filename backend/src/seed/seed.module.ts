import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { User } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';
import { DemandSignal } from '../demand/entities/demand-signal.entity';
import { Match } from '../matches/entities/match.entity';
import { Negotiation } from '../matches/entities/negotiation.entity';
import { Booking } from '../matches/entities/booking.entity';
import { AgentsModule } from '../agents/agents.module';
import { ListingsModule } from '../listings/listings.module';
import { DemandModule } from '../demand/demand.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Listing,
      DemandSignal,
      Match,
      Negotiation,
      Booking,
    ]),
    forwardRef(() => AgentsModule),
    forwardRef(() => ListingsModule),
    forwardRef(() => DemandModule),
  ],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
