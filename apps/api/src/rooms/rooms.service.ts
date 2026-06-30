import { Injectable } from '@nestjs/common';
import { RoomsRepo } from './rooms.repo.js';
import type { Room } from './rooms.entity.js';

@Injectable()
export class RoomsService {
  constructor(private readonly roomsRepo: RoomsRepo) {}

  async list(): Promise<readonly Room[]> {
    return this.roomsRepo.list();
  }
}
