import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // Enable rawBody so we can verify ElevenLabs webhook signatures
    // against the exact payload bytes (matching iterate project pattern)
    rawBody: true,
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Borough backend running on http://localhost:${port}`);
  logger.log(`WebSocket gateway at ws://localhost:${port}/ws`);
  logger.log(`Auth endpoints: POST /api/auth/register, POST /api/auth/login`);
}

bootstrap();
