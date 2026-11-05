import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { messages } from '../messages';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    throw new BadRequestException({
      code: 'VALIDATION_FAILED',
      message: messages.errors.validationFailed,
      details: result.error.issues.map((issue) => ({
        path: issue.path,
        message: messages.validation.invalidInput,
      })),
    });
  }
}
