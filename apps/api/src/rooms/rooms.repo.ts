import { Injectable } from '@nestjs/common';
import { sql, type DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';
import { DbService } from '../database/db.service.js';
import type { Room } from './rooms.entity.js';

type RoomRow = {
  id: string;
  name: string;
};

type RoomIdArgs = {
  id: string;
};

const roomRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

@Injectable()
export class RoomsRepo {
  constructor(private readonly db: DbService) {}

  async list(): Promise<readonly Room[]> {
    const rows = await this.db.query<RoomRow>(
      sql.type(roomRowSchema)`select id, name from rooms order by name`,
    );

    return rows.map((row): Room => this.toEntity(row));
  }

  async findByIdTx(
    tx: DatabaseTransactionConnection,
    args: RoomIdArgs,
  ): Promise<Room | null> {
    const { id } = args;
    const rows = await tx.any(
      sql.type(roomRowSchema)`select id, name from rooms where id = ${id}`,
    );

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  private toEntity(row: RoomRow): Room {
    return {
      id: row.id,
      name: row.name,
    };
  }

  private toRow(entity: Room): RoomRow {
    return {
      id: entity.id,
      name: entity.name,
    };
  }
}
