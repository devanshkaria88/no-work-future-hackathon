import { Module, forwardRef } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { ElevenLabsService } from './elevenlabs.service';
import { AgentsModule } from '../agents/agents.module';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { DemandModule } from '../demand/demand.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [
    forwardRef(() => AgentsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ListingsModule),
    forwardRef(() => DemandModule),
    MatchesModule,
  ],
  controllers: [VoiceController],
  providers: [VoiceService, ElevenLabsService],
  exports: [ElevenLabsService],
})
export class VoiceModule {}
