import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

import { testDbConfig } from './test-db';
import { createMockClaudeService } from './mock-claude';

import { UsersModule } from '../../src/users/users.module';
import { ListingsModule } from '../../src/listings/listings.module';
import { DemandModule } from '../../src/demand/demand.module';
import { MatchesModule } from '../../src/matches/matches.module';
import { MapModule } from '../../src/map/map.module';
import { VoiceModule } from '../../src/voice/voice.module';
import { SeedModule } from '../../src/seed/seed.module';
import { AgentsModule } from '../../src/agents/agents.module';
import { ClaudeService } from '../../src/common/llm/claude.service';

export interface TestContext {
  app: INestApplication;
  module: TestingModule;
  mockClaude: ReturnType<typeof createMockClaudeService>;
}

export async function createTestApp(): Promise<TestContext> {
  const mockClaude = createMockClaudeService();

  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      EventEmitterModule.forRoot(),
      TypeOrmModule.forRoot(testDbConfig()),
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
    .overrideProvider(ClaudeService)
    .useValue(mockClaude)
    .compile();

  const app = module.createNestApplication();
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.init();
  await app.listen(0); // random port

  return { app, module, mockClaude };
}

export function getBaseUrl(app: INestApplication): string {
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === 'string' ? address : address?.port;
  return `http://localhost:${port}`;
}

export function getPort(app: INestApplication): number {
  const server = app.getHttpServer();
  const address = server.address();
  return typeof address === 'string' ? parseInt(address) : address?.port;
}
