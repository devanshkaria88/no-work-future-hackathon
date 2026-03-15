import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlackboardService } from './blackboard/blackboard.service';
import { BlackboardGateway } from './blackboard/blackboard.gateway';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { ScoutService } from './scout/scout.service';
import { PackagerService } from './packager/packager.service';
import { MatchmakerService } from './matchmaker/matchmaker.service';
import { NegotiatorService } from './negotiator/negotiator.service';
import { ClaudeService } from '../common/llm/claude.service';
import { Listing } from '../listings/entities/listing.entity';
import { DemandSignal } from '../demand/entities/demand-signal.entity';
import { Match } from '../matches/entities/match.entity';
import { Negotiation } from '../matches/entities/negotiation.entity';
import { Booking } from '../matches/entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      DemandSignal,
      Match,
      Negotiation,
      Booking,
    ]),
  ],
  providers: [
    BlackboardGateway,
    BlackboardService,
    OrchestratorService,
    ScoutService,
    PackagerService,
    MatchmakerService,
    NegotiatorService,
    ClaudeService,
  ],
  exports: [
    BlackboardService,
    BlackboardGateway,
    ScoutService,
    PackagerService,
    MatchmakerService,
    NegotiatorService,
    ClaudeService,
  ],
})
export class AgentsModule {}
