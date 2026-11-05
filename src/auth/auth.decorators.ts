import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { messages } from '../common/messages';
import type { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new UnauthorizedException(messages.errors.unauthorized);
    return user;
  },
);

export const CurrentAccessToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const token = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().accessToken;
    if (!token) throw new UnauthorizedException(messages.auth.invalidToken);
    return token;
  },
);
