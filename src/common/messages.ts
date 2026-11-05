import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const messageSchema = z.object({
  errors: z.object({
    badRequest: z.string(),
    unauthorized: z.string(),
    rateLimited: z.string(),
    upstreamError: z.string(),
    validationFailed: z.string(),
  }),
  auth: z.object({
    invalidCredentials: z.string(),
    invalidToken: z.string(),
    emailAlreadyRegistered: z.string(),
    passwordResetRequested: z.string(),
    passwordUpdated: z.string(),
  }),
  validation: z.object({ invalidInput: z.string() }),
  tasks: z.object({ notFound: z.string() }),
});

export const messages = messageSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'locales/en.json'), 'utf8')),
);
