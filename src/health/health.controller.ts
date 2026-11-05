import {
  Controller,
  Get,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { Public } from '../auth/auth.decorators';
import { messages } from '../common/messages';

const healthResponseSchema = z.object({ name: z.string() });

@Public()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  async check() {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const key = this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY');
    let response: Response;

    try {
      response = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: key },
      });
    } catch {
      throw new ServiceUnavailableException(messages.errors.upstreamError);
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(messages.errors.upstreamError);
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ServiceUnavailableException(messages.errors.upstreamError);
    }

    const result = healthResponseSchema.safeParse(body);
    if (!result.success) {
      throw new ServiceUnavailableException(messages.errors.upstreamError);
    }

    return {
      status: 'ok',
      application: 'task-management-api',
      supabase: 'connected',
      authService: result.data.name,
    };
  }
}
