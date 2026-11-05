import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

@Injectable()
export class SupabaseService {
  private readonly url: string;
  private readonly publishableKey: string;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.publishableKey = this.configService.getOrThrow<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );
  }

  getClient(accessToken?: string): SupabaseClient<Database> {
    return createClient<Database>(this.url, this.publishableKey, {
      ...(accessToken && { accessToken: async () => accessToken }),
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
}
