import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { messages } from '../common/messages';
import type { TaskRow } from '../supabase/database.types';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from './task.dto';
import { TaskRepository } from './task.repository';

@Injectable()
export class TaskService {
  constructor(private readonly tasks: TaskRepository) {}

  async list(
    user: AuthenticatedUser,
    accessToken: string,
    query: ListTasksQuery,
  ) {
    const { rows, total } = await this.tasks.list(user.id, accessToken, query);
    return {
      items: rows.map((row) => this.toTask(row)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async get(user: AuthenticatedUser, accessToken: string, taskId: string) {
    const task = await this.tasks.findById(user.id, accessToken, taskId);
    if (!task) throw new NotFoundException(messages.tasks.notFound);
    return this.toTask(task);
  }

  async create(
    user: AuthenticatedUser,
    accessToken: string,
    input: CreateTaskInput,
  ) {
    return this.toTask(await this.tasks.create(user.id, accessToken, input));
  }

  async update(
    user: AuthenticatedUser,
    accessToken: string,
    taskId: string,
    input: UpdateTaskInput,
  ) {
    const task = await this.tasks.update(user.id, accessToken, taskId, input);
    if (!task) throw new NotFoundException(messages.tasks.notFound);
    return this.toTask(task);
  }

  async delete(user: AuthenticatedUser, accessToken: string, taskId: string) {
    const deleted = await this.tasks.delete(user.id, accessToken, taskId);
    if (!deleted) throw new NotFoundException(messages.tasks.notFound);
  }

  private toTask(task: TaskRow) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }
}
