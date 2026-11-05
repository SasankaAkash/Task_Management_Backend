import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';
import { messages } from '../common/messages';
import { IS_PUBLIC } from './auth.decorators';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
    if (!token) throw new UnauthorizedException(messages.errors.unauthorized);

    const result = await this.lookupUser(token);
    const { data, error } = result;
    if (error || !data.user) {
      if (error?.status === 429) {
        throw new HttpException(
          messages.errors.rateLimited,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (error && (!error.status || error.status >= 500)) {
        throw new ServiceUnavailableException(messages.errors.upstreamError);
      }
      throw new UnauthorizedException(messages.auth.invalidToken);
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
    };
    request.accessToken = token;
    return true;
  }

  private async lookupUser(token: string) {
    try {
      return await this.supabase.getClient().auth.getUser(token);
    } catch {
      throw new ServiceUnavailableException(messages.errors.upstreamError);
    }
  }
}
