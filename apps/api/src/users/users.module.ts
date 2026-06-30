import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersRepo } from './users.repo.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepo],
  exports: [UsersService],
})
export class UsersModule {}
