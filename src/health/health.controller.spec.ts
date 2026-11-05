import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const config = {
    getOrThrow: jest.fn((name: string) =>
      name === 'SUPABASE_URL'
        ? 'https://example.supabase.co'
        : 'test-publishable-key',
    ),
  } as unknown as ConfigService;
  const controller = new HealthController(config);

  afterEach(() => jest.restoreAllMocks());

  it('reports the Supabase auth service health', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ name: 'auth' }), { status: 200 }),
      );

    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      supabase: 'connected',
      authService: 'auth',
    });
  });

  it('reports upstream failures without exposing provider details', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('private response', { status: 503 }));

    await expect(controller.check()).rejects.toMatchObject({ status: 503 });
  });
});
