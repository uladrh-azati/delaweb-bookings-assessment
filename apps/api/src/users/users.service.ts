import { Injectable } from '@nestjs/common';
import type { User } from './users.entity.js';
import { UsersRepo } from './users.repo.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepo) {}

  async findByName(name: string): Promise<readonly User[]> {
    return this.usersRepo.findByName({ name });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findById({ id });
  }

  async create(name: string): Promise<User> {
    return this.usersRepo.create({ name });
  }
}
