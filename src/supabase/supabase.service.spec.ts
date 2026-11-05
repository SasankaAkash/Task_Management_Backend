import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (name: string) =>
              name === 'SUPABASE_URL'
                ? 'https://example.supabase.co'
                : 'test-publishable-key',
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('creates an isolated client for each call', () => {
    expect(service.getClient()).not.toBe(service.getClient());
  });
});
