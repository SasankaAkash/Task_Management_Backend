import { z } from 'zod';
import type { SchemaObject } from '@nestjs/swagger';

export const createTaskOpenApiSchema: SchemaObject = {
  type: 'object',
  required: ['title'],
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      example: 'Plan release',
    },
    description: { type: 'string', nullable: true, maxLength: 5000 },
  },
};

export const updateTaskOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', nullable: true, maxLength: 5000 },
    status: { type: 'string', enum: ['pending', 'completed'] },
  },
  minProperties: 1,
};

const taskStatusSchema = z.enum(['pending', 'completed']);

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(5000).nullable().optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    status: taskStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const taskIdSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export const listTasksQuerySchema = z
  .object({
    status: taskStatusSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sort: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
