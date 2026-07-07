import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import type { LoginResult } from './auth.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(name: string): Promise<LoginResult> {
    const existing = await this.users.findByName(name);
    const user = existing[0] ?? (await this.users.create(name));
    const token = this.jwt.sign({ sub: user.id, name: user.name });
    return { token, user: { id: user.id, name: user.name } };
  }
}
