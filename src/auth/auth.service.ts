import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { messages } from '../common/messages';
import type {
  ConfirmPasswordResetInput,
  CredentialsInput,
  PasswordResetRequestInput,
  TokenRefreshInput,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(input: CredentialsInput) {
    const { data, error } = await this.supabase.getClient().auth.signUp({
      email: input.email,
      password: input.password,
    });
    if (error) {
      if (error.code === 'user_already_exists') {
        throw new ConflictException(messages.auth.emailAlreadyRegistered);
      }
      this.throwAuthError(error, messages.errors.upstreamError);
    }
    if (!data.user)
      throw new BadGatewayException(messages.errors.upstreamError);
    return this.toSession(data.user, data.session);
  }

  async login(input: CredentialsInput) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
    if (error) this.throwAuthError(error, messages.auth.invalidCredentials);
    if (!data.user) {
      throw new UnauthorizedException(messages.auth.invalidCredentials);
    }
    return this.toSession(data.user, data.session);
  }

  async refresh(input: TokenRefreshInput) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.refreshSession({ refresh_token: input.refreshToken });
    if (error) this.throwAuthError(error, messages.auth.invalidToken);
    if (!data.user) throw new UnauthorizedException(messages.auth.invalidToken);
    return this.toSession(data.user, data.session);
  }

  async logout(accessToken: string, refreshToken: string) {
    const auth = this.supabase.getClient().auth;
    const { error: sessionError } = await auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError)
      this.throwAuthError(sessionError, messages.auth.invalidToken);

    const { error } = await auth.signOut({ scope: 'local' });
    if (error) this.throwAuthError(error, messages.auth.invalidToken);
    return { success: true };
  }

  async requestPasswordReset(input: PasswordResetRequestInput) {
    const { error } = await this.supabase
      .getClient()
      .auth.resetPasswordForEmail(input.email);
    if (error) throw new BadGatewayException(messages.errors.upstreamError);
    return { message: messages.auth.passwordResetRequested };
  }

  async confirmPasswordReset(
    accessToken: string,
    input: ConfirmPasswordResetInput,
  ) {
    const auth = this.supabase.getClient().auth;
    const { error: sessionError } = await auth.setSession({
      access_token: accessToken,
      refresh_token: input.refreshToken,
    });
    if (sessionError)
      this.throwAuthError(sessionError, messages.auth.invalidToken);

    const { error } = await auth.updateUser({ password: input.newPassword });
    if (error) {
      if (error.status && error.status >= 500) {
        throw new BadGatewayException(messages.errors.upstreamError);
      }
      throw new BadRequestException(messages.errors.badRequest);
    }
    return { message: messages.auth.passwordUpdated };
  }

  private toSession(user: User, session: Session | null) {
    return {
      user: { id: user.id, email: user.email ?? null },
      session: session
        ? {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at ?? null,
            tokenType: session.token_type,
          }
        : null,
    };
  }

  private throwAuthError(error: AuthError, fallbackMessage: string): never {
    if (error.status === 429) {
      throw new HttpException(
        messages.errors.rateLimited,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!error.status || error.status >= 500) {
      throw new BadGatewayException(messages.errors.upstreamError);
    }
    throw new UnauthorizedException(fallbackMessage);
  }
}
