import { jest } from '@jest/globals';
import type {
  AuthError,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase/supabase.service';

const user = { id: 'user-1', email: 'person@example.com' } as User;
const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_at: 123,
  token_type: 'bearer',
} as Session;

function createService(auth: object) {
  const supabase = {
    getClient: jest.fn(() => ({ auth }) as unknown as SupabaseClient),
  } as unknown as SupabaseService;
  return new AuthService(supabase);
}

describe('AuthService', () => {
  it('registers a user and returns an optional session', async () => {
    const auth = {
      signUp: jest.fn(async () => ({
        data: { user, session: null },
        error: null,
      })),
    };

    await expect(
      createService(auth).register({
        email: 'person@example.com',
        password: 'strong-password',
      }),
    ).resolves.toEqual({
      user: { id: 'user-1', email: 'person@example.com' },
      session: null,
    });
  });

  it('returns session tokens after login', async () => {
    const auth = {
      signInWithPassword: jest.fn(async () => ({
        data: { user, session },
        error: null,
      })),
    };

    await expect(
      createService(auth).login({
        email: 'person@example.com',
        password: 'strong-password',
      }),
    ).resolves.toMatchObject({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: 123,
      },
    });
  });

  it('does not expose provider details for invalid credentials', async () => {
    const error = Object.assign(new Error('private provider detail'), {
      status: 400,
    }) as AuthError;
    const auth = {
      signInWithPassword: jest.fn(async () => ({
        data: { user: null, session: null },
        error,
      })),
    };

    await expect(
      createService(auth).login({
        email: 'person@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('treats a Supabase signup authorization failure as an upstream error', async () => {
    const error = Object.assign(new Error('Invalid API key'), {
      status: 401,
      code: 'invalid_api_key',
    }) as AuthError;
    const auth = {
      signUp: jest.fn(async () => ({
        data: { user: null, session: null },
        error,
      })),
    };

    await expect(
      createService(auth).register({
        email: 'person@example.com',
        password: 'strong-password',
      }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it('returns the same password-reset response for registered addresses', async () => {
    const auth = {
      resetPasswordForEmail: jest.fn(async () => ({ error: null })),
    };

    await expect(
      createService(auth).requestPasswordReset({
        email: 'person@example.com',
      }),
    ).resolves.toHaveProperty('message');
  });

  it('rotates sessions and revokes sessions on logout', async () => {
    const auth = {
      refreshSession: jest.fn(async () => ({
        data: { user, session },
        error: null,
      })),
      setSession: jest.fn(async () => ({
        data: { user, session },
        error: null,
      })),
      signOut: jest.fn(async () => ({ error: null })),
    };
    const service = createService(auth);

    await expect(
      service.refresh({ refreshToken: 'old-refresh-token' }),
    ).resolves.toHaveProperty('session.accessToken', 'access-token');
    await expect(
      service.logout('access-token', 'refresh-token'),
    ).resolves.toEqual({ success: true });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('updates passwords with a recovery session', async () => {
    const auth = {
      setSession: jest.fn(async () => ({
        data: { user, session },
        error: null,
      })),
      updateUser: jest.fn(async () => ({ data: { user }, error: null })),
    };
    const result = await createService(auth).confirmPasswordReset(
      'access-token',
      { refreshToken: 'refresh-token', newPassword: 'new-strong-password' },
    );

    expect(result).toHaveProperty('message');
    expect(auth.updateUser).toHaveBeenCalledWith({
      password: 'new-strong-password',
    });
  });
});
