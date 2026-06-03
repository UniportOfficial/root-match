import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth, type AuthSession } from './auth.config';

interface RequestWithSession extends Request {
  session?: AuthSession['session'];
  user?: AuthSession['user'];
}

@Injectable()
export class BetterAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithSession>();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      throw new UnauthorizedException('No active session');
    }
    req.session = session.session;
    req.user = session.user;
    return true;
  }
}
