
import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL');

    const supabaseKey =
      this.configService.get<string>(
        'SUPABASE_PUBLISHABLE_KEY',
      );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase environment variables are missing',
      );
    }

    this.supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  onModuleInit() {
    console.log('Supabase client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
