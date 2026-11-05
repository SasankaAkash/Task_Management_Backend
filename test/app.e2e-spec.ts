import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';

describe('Authentication and task API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        getClient: jest.fn(() => ({
          auth: { getUser: jest.fn() },
        })),
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  it('rejects invalid registration payloads before calling Supabase', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('keeps task routes private by default', async () => {
    await request(app.getHttpServer()).get('/api/v1/tasks').expect(401);
  });

  afterAll(async () => {
    if (app) await app.close();
  });
});
