import { Injectable } from '@nestjs/common';
import { sql } from 'slonik';
import { z } from 'zod';
import { DbService } from '../database/db.service.js';
import type { User } from './users.entity.js';

type UserRow = {
  id: string;
  name: string;
  created_at: Date | string;
};

type UserNameArgs = {
  name: string;
};

type UserIdArgs = {
  id: string;
};

const userRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.union([z.date(), z.string()]),
});

@Injectable()
export class UsersRepo {
  constructor(private readonly db: DbService) {}

  async findByName(args: UserNameArgs): Promise<readonly User[]> {
    const { name } = args;
    const rows = await this.db.query<UserRow>(
      sql.type(
        userRowSchema,
      )`select id, name, created_at from users where name = ${name}`,
    );

    return rows.map((row): User => this.toEntity(row));
  }

  async findById(args: UserIdArgs): Promise<User | null> {
    const { id } = args;
    const rows = await this.db.query<UserRow>(
      sql.type(
        userRowSchema,
      )`select id, name, created_at from users where id = ${id}`,
    );

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async create(args: UserNameArgs): Promise<User> {
    const { name } = args;
    const rows = await this.db.query<UserRow>(
      sql.type(
        userRowSchema,
      )`insert into users (name) values (${name}) returning id, name, created_at`,
    );

    if (!rows[0]) {
      throw new Error('User could not be created');
    }

    return this.toEntity(rows[0]);
  }

  private toEntity(row: UserRow): User {
    const createdAt =
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString();

    return {
      id: row.id,
      name: row.name,
      createdAt,
    };
  }

  private toRow(entity: User): UserRow {
    return {
      id: entity.id,
      name: entity.name,
      created_at: entity.createdAt,
    };
  }
}
