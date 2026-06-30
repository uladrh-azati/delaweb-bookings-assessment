import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import type { RoomDto } from './dto/index.js';
import { RoomsService } from './rooms.service.js';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  list(): Promise<readonly RoomDto[]> {
    return this.rooms.list();
  }
}
