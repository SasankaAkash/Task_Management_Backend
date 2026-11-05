import { jest } from '@jest/globals';
import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.types';

function createContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createGuard(getUser: object, isPublic = false) {
  const reflector = {
    getAllAndOverride: jest.fn(() => isPublic),
  } as unknown as Reflector;
  const supabase = {
    getClient: jest.fn(
      () => ({ auth: { getUser } }) as unknown as SupabaseClient,
    ),
  } as unknown as SupabaseService;
  return new AuthGuard(reflector, supabase);
}

describe('AuthGuard', () => {
  it('allows public routes without validating a token', async () => {
    const lookupUser = jest.fn();
    const guard = createGuard(lookupUser, true);

    await expect(
      guard.canActivate(createContext({ headers: {} } as AuthenticatedRequest)),
    ).resolves.toBe(true);
    expect(lookupUser).not.toHaveBeenCalled();
  });

  it('attaches the authenticated user and access token to the request', async () => {
    const getUser = jest.fn(async () => ({
      data: { user: { id: 'user-1', email: 'person@example.com' } },
      error: null,
    }));
    const guard = createGuard(getUser);
    const request = {
      headers: { authorization: 'Bearer access-token' },
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', email: 'person@example.com' });
    expect(request.accessToken).toBe('access-token');
  });

  it('rejects missing credentials and distinguishes provider outages', async () => {
    const missingCredentialGuard = createGuard({});
    await expect(
      missingCredentialGuard.canActivate(
        createContext({ headers: {} } as AuthenticatedRequest),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const lookupUser = jest.fn(async () => ({
      data: { user: null },
      error: { status: 503 },
    }));
    const unavailableGuard = createGuard(lookupUser);
    const request = {
      headers: { authorization: 'Bearer access-token' },
    } as AuthenticatedRequest;
    await expect(
      unavailableGuard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
