import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const testDbConfig = (): TypeOrmModuleOptions => ({
  type: 'better-sqlite3',
  database: ':memory:',
  autoLoadEntities: true,
  synchronize: true,
  dropSchema: true,
});
