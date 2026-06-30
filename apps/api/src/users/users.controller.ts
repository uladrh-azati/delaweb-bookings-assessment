import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  @Get('me')
  me(@Req() req: Request) {
    return req.user;
  }
}
