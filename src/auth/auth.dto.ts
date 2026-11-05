import { z } from 'zod';
import type { SchemaObject } from '@nestjs/swagger';

export const credentialsOpenApiSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 254,
      example: 'person@example.com',
    },
    password: { type: 'string', minLength: 8, maxLength: 128 },
  },
};

export const emailOpenApiSchema: SchemaObject = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 254,
      example: 'person@example.com',
    },
  },
};

export const refreshTokenOpenApiSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: { type: 'string', minLength: 1, maxLength: 4096 },
  },
};

export const confirmPasswordResetOpenApiSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken', 'newPassword'],
  properties: {
    refreshToken: { type: 'string', minLength: 1, maxLength: 4096 },
    newPassword: { type: 'string', minLength: 8, maxLength: 128 },
  },
};

const credentialsSchema = z
  .object({
    email: z.email().max(254),
    password: z.string().min(8).max(128),
  })
  .strict();

export const registerSchema = credentialsSchema;
export const loginSchema = credentialsSchema;
export const passwordResetRequestSchema = z
  .object({
    email: z.email().max(254),
  })
  .strict();
export const tokenRefreshSchema = z
  .object({
    refreshToken: z.string().min(1).max(4096),
  })
  .strict();
export const logoutSchema = tokenRefreshSchema;
export const confirmPasswordResetSchema = z
  .object({
    refreshToken: z.string().min(1).max(4096),
    newPassword: z.string().min(8).max(128),
  })
  .strict();

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type TokenRefreshInput = z.infer<typeof tokenRefreshSchema>;
export type ConfirmPasswordResetInput = z.infer<
  typeof confirmPasswordResetSchema
>;
