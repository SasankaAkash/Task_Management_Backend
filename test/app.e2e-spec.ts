import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';

const mockSignUp = jest.fn(async () => ({
  data: {
    user: { id: 'user-1', email: 'person@example.com' },
    session: {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: 1_800_000_000,
      token_type: 'bearer',
    },
  },
  error: null,
}));
const mockGetUser = jest.fn();

describe('Authentication and task API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        getClient: jest.fn(() => ({
          auth: { getUser: mockGetUser, signUp: mockSignUp },
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

  it('allows registration without a bearer token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'person@example.com', password: 'strong-password' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.user.id).toBe('user-1');
      });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'strong-password',
    });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('keeps task routes private by default', async () => {
    await request(app.getHttpServer()).get('/api/v1/tasks').expect(401);
  });

  it('includes body, query and path parameters in the OpenAPI contract', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );

    expect(
      document.paths['/api/v1/auth/register']?.post?.requestBody,
    ).toMatchObject({
      content: {
        'application/json': {
          schema: {
            required: ['email', 'password'],
            properties: expect.objectContaining({
              email: expect.any(Object),
              password: expect.any(Object),
            }),
          },
        },
      },
    });
    expect(document.paths['/api/v1/tasks']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'status', in: 'query' }),
        expect.objectContaining({ name: 'search', in: 'query' }),
        expect.objectContaining({ name: 'page', in: 'query' }),
        expect.objectContaining({ name: 'limit', in: 'query' }),
      ]),
    );
    expect(document.paths['/api/v1/tasks/{id}']?.patch?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', in: 'path', required: true }),
      ]),
    );
    expect(document.paths['/api/v1/tasks']?.post?.requestBody).toBeDefined();
  });

  afterAll(async () => {
    if (app) await app.close();
  });
});
