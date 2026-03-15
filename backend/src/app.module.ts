import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { databaseConfig } from './common/config/database.config';
import { AgentsModule } from './agents/agents.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { DemandModule } from './demand/demand.module';
import { MatchesModule } from './matches/matches.module';
import { MapModule } from './map/map.module';
import { VoiceModule } from './voice/voice.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig()),
    AgentsModule,
    UsersModule,
    ListingsModule,
    DemandModule,
    MatchesModule,
    MapModule,
    VoiceModule,
    SeedModule,
  ],
})
export class AppModule {}
