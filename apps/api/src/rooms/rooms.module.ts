import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller.js';
import { RoomsRepo } from './rooms.repo.js';
import { RoomsService } from './rooms.service.js';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepo],
})
export class RoomsModule {}
