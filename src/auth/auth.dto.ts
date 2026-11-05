import { z } from 'zod';

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
