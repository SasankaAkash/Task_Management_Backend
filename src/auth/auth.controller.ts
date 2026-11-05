import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import type {
  CredentialsInput,
  ConfirmPasswordResetInput,
  PasswordResetRequestInput,
  TokenRefreshInput,
} from './auth.dto';
import {
  confirmPasswordResetSchema,
  loginSchema,
  logoutSchema,
  passwordResetRequestSchema,
  registerSchema,
  tokenRefreshSchema,
} from './auth.dto';
import { CurrentAccessToken, Public } from './auth.decorators';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register an account' })
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: CredentialsInput,
  ) {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and create a session' })
  login(@Body(new ZodValidationPipe(loginSchema)) body: CredentialsInput) {
    return this.auth.login(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh an authenticated session' })
  refresh(
    @Body(new ZodValidationPipe(tokenRefreshSchema)) body: TokenRefreshInput,
  ) {
    return this.auth.refresh(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session' })
  logout(
    @CurrentAccessToken() accessToken: string,
    @Body(new ZodValidationPipe(logoutSchema)) body: TokenRefreshInput,
  ) {
    return this.auth.logout(accessToken, body.refreshToken);
  }

  @Public()
  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset instructions' })
  requestPasswordReset(
    @Body(new ZodValidationPipe(passwordResetRequestSchema))
    body: PasswordResetRequestInput,
  ) {
    return this.auth.requestPasswordReset(body);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a new password from a recovery session' })
  confirmPasswordReset(
    @CurrentAccessToken() accessToken: string,
    @Body(new ZodValidationPipe(confirmPasswordResetSchema))
    body: ConfirmPasswordResetInput,
  ) {
    return this.auth.confirmPasswordReset(accessToken, body);
  }
}
