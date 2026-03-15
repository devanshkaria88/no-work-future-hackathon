import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/borough',
  autoLoadEntities: true,
  synchronize: true, // Fine for hackathon — auto-creates tables
  logging: process.env.NODE_ENV !== 'production',
});
