
import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async check() {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL');

    const supabaseKey =
      this.configService.get<string>(
        'SUPABASE_PUBLISHABLE_KEY',
      );

    if (!supabaseUrl || !supabaseKey) {
      throw new ServiceUnavailableException(
        'Supabase configuration is missing',
      );
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/health`,
        {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Supabase returned status ${response.status}`,
        );
      }

      const result = await response.json();

      return {
        status: 'ok',
        application: 'task-management-api',
        supabase: 'connected',
        authService: result.name,
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        application: 'task-management-api',
        supabase: 'unavailable',
      });
    }
  }
}
