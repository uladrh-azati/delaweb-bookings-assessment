import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { createPool, type DatabasePool } from 'slonik';
import { DATABASE_POOL, DbService } from './db.service.js';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: async (config: ConfigService): Promise<DatabasePool> => {
        const pool = await createPool(
          config.getOrThrow<string>('DATABASE_URL'),
          {
            driverFactory: createPgDriverFactory(),
            maximumPoolSize: 1,
          },
        );
        return pool;
      },
      inject: [ConfigService],
    },
    DbService,
  ],
  exports: [DATABASE_POOL, DbService],
})
export class DatabaseModule {}
