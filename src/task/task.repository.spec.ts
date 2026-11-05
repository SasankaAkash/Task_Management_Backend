import { jest } from '@jest/globals';
import { BadGatewayException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import type { Database, TaskRow } from '../supabase/database.types';
import { TaskRepository } from './task.repository';

const row: TaskRow = {
  id: 'e0d393e5-c857-45d7-88b6-31723dc0fcaf',
  user_id: 'user-1',
  title: 'Plan release',
  description: null,
  status: 'pending',
  created_at: '2026-11-05T00:00:00Z',
  updated_at: '2026-11-05T00:00:00Z',
};

function createRepository(result: {
  data: unknown;
  error: unknown;
  count?: number;
}) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    ilike: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    order: jest.fn(),
    range: jest.fn(async () => result),
    maybeSingle: jest.fn(async () => result),
    single: jest.fn(async () => result),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.order.mockReturnValue(query);
  const client = {
    from: jest.fn(() => query),
  } as unknown as SupabaseClient<Database>;
  const supabase = {
    getClient: jest.fn(() => client),
  } as unknown as SupabaseService;
  return { repository: new TaskRepository(supabase), query, supabase };
}

describe('TaskRepository', () => {
  it('scopes, filters, searches, sorts and paginates task queries', async () => {
    const { repository, query, supabase } = createRepository({
      data: [row],
      error: null,
      count: 21,
    });

    await expect(
      repository.list('user-1', 'access-token', {
        status: 'pending',
        search: 'release',
        sort: 'asc',
        page: 2,
        limit: 10,
      }),
    ).resolves.toEqual({ rows: [row], total: 21 });
    expect(supabase.getClient).toHaveBeenCalledWith('access-token');
    expect(query.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'status', 'pending');
    expect(query.ilike).toHaveBeenCalledWith('title', '%release%');
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(query.range).toHaveBeenCalledWith(10, 19);
  });

  it('uses the owner filter for item lookups and returns missing tasks as null', async () => {
    const { repository, query } = createRepository({
      data: null,
      error: null,
    });

    await expect(
      repository.findById(
        'user-1',
        'access-token',
        'e0d393e5-c857-45d7-88b6-31723dc0fcaf',
      ),
    ).resolves.toBeNull();
    expect(query.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-1');
    expect(query.eq).toHaveBeenNthCalledWith(
      2,
      'id',
      'e0d393e5-c857-45d7-88b6-31723dc0fcaf',
    );
  });

  it('sets the owner from the authenticated user and fails closed on query errors', async () => {
    const created = createRepository({ data: row, error: null });
    created.query.insert.mockReturnValue(created.query);
    await created.repository.create('user-1', 'access-token', {
      title: 'Plan release',
    });
    expect(created.query.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: 'Plan release',
      description: null,
    });

    const failed = createRepository({
      data: null,
      error: { message: 'database details must not be exposed' },
    });
    await expect(
      failed.repository.list('user-1', 'access-token', {
        sort: 'desc',
        page: 1,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('scopes updates and deletes to the owner', async () => {
    const updated = createRepository({ data: row, error: null });
    await updated.repository.update('user-1', 'access-token', row.id, {
      status: 'completed',
    });
    expect(updated.query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(updated.query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        updated_at: expect.any(String),
      }),
    );

    const deleted = createRepository({ data: { id: row.id }, error: null });
    await expect(
      deleted.repository.delete('user-1', 'access-token', row.id),
    ).resolves.toBe(true);
    expect(deleted.query.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
