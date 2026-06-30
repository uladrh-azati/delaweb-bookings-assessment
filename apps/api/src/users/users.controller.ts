import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../auth/auth.entity.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  @Get('me')
  me(@Req() req: AuthenticatedRequest): AuthenticatedUser {
    return req.user;
  }
}
