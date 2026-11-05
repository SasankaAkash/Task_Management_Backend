import { BadGatewayException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { TaskRow } from '../supabase/database.types';
import { messages } from '../common/messages';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from './task.dto';

@Injectable()
export class TaskRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async list(
    userId: string,
    accessToken: string,
    query: ListTasksQuery,
  ): Promise<{ rows: TaskRow[]; total: number }> {
    let request = this.supabase
      .getClient(accessToken)
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (query.status) request = request.eq('status', query.status);
    if (query.search) request = request.ilike('title', `%${query.search}%`);

    const start = (query.page - 1) * query.limit;
    const { data, error, count } = await request
      .order('created_at', { ascending: query.sort === 'asc' })
      .order('id', { ascending: query.sort === 'asc' })
      .range(start, start + query.limit - 1);
    if (error) this.throwDatabaseError();

    return { rows: data ?? [], total: count ?? 0 };
  }

  async findById(
    userId: string,
    accessToken: string,
    taskId: string,
  ): Promise<TaskRow | null> {
    const { data, error } = await this.supabase
      .getClient(accessToken)
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('id', taskId)
      .maybeSingle();
    if (error) this.throwDatabaseError();
    return data;
  }

  async create(
    userId: string,
    accessToken: string,
    input: CreateTaskInput,
  ): Promise<TaskRow> {
    const { data, error } = await this.supabase
      .getClient(accessToken)
      .from('tasks')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
      })
      .select('*')
      .single();
    if (error || !data) this.throwDatabaseError();
    return data;
  }

  async update(
    userId: string,
    accessToken: string,
    taskId: string,
    input: UpdateTaskInput,
  ): Promise<TaskRow | null> {
    const { data, error } = await this.supabase
      .getClient(accessToken)
      .from('tasks')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', taskId)
      .select('*')
      .maybeSingle();
    if (error) this.throwDatabaseError();
    return data;
  }

  async delete(
    userId: string,
    accessToken: string,
    taskId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .getClient(accessToken)
      .from('tasks')
      .delete()
      .eq('user_id', userId)
      .eq('id', taskId)
      .select('id')
      .maybeSingle();
    if (error) this.throwDatabaseError();
    return data !== null;
  }

  private throwDatabaseError(): never {
    throw new BadGatewayException(messages.errors.upstreamError);
  }
}
