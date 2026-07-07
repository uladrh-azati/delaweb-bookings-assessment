import type { Request } from 'express';

export type AuthenticatedUser = {
  userId: string;
  name: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export type LoginResult = {
  token: string;
  user: {
    id: string;
    name: string;
  };
};
