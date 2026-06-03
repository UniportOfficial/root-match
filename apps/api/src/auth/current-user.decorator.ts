import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthSession } from './auth.config';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSession['user'] | undefined => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthSession['user'] }>();
    return req.user;
  },
);
