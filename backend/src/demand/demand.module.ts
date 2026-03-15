import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandController } from './demand.controller';
import { DemandService } from './demand.service';
import { DemandSignal } from './entities/demand-signal.entity';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DemandSignal]),
    forwardRef(() => AgentsModule),
  ],
  controllers: [DemandController],
  providers: [DemandService],
  exports: [DemandService, TypeOrmModule],
})
export class DemandModule {}
