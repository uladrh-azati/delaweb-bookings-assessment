import { Injectable } from '@nestjs/common';
import { sql } from 'slonik';
import { DbService } from '../database/db.service.js';

export type User = {
  id: string;
  name: string;
  created_at: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly db: DbService) {}

  async findByName(name: string) {
    return this.db.query<User>(
      sql.unsafe`select * from users where name = ${name}`,
    );
  }

  async findById(id: string) {
    const rows = await this.db.query<User>(
      sql.unsafe`select * from users where id = ${id}`,
    );
    return rows[0] ?? null;
  }

  async create(name: string) {
    const rows = await this.db.query<User>(
      sql.unsafe`insert into users (name) values (${name}) returning *`,
    );
    return rows[0];
  }
}
