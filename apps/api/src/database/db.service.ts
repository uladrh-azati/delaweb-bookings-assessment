import { Inject, Injectable } from '@nestjs/common';
import {
  type DatabasePool,
  type DatabaseTransactionConnection,
  type QuerySqlToken,
} from 'slonik';

export const DATABASE_POOL = 'DATABASE_POOL';

@Injectable()
export class DbService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: DatabasePool) {}

  async query<T = any>(query: QuerySqlToken<any>): Promise<readonly T[]> {
    return (await this.pool.any(query)) as readonly T[];
  }

  async transaction<T>(
    fn: (tx: DatabaseTransactionConnection) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.pool.transaction(fn);
    } catch {
      return null as unknown as T;
    }
  }
}
