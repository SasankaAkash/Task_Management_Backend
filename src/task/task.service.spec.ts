import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { TaskRepository } from './task.repository';
import { TaskService } from './task.service';

const row = {
  id: 'e0d393e5-c857-45d7-88b6-31723dc0fcaf',
  user_id: 'user-1',
  title: 'Plan release',
  description: null,
  status: 'pending' as const,
  created_at: '2026-11-05T00:00:00Z',
  updated_at: '2026-11-05T00:00:00Z',
};
const user = { id: 'user-1', email: 'person@example.com' };

describe('TaskService', () => {
  it('lists owned tasks with pagination metadata', async () => {
    const list = jest.fn(async () => ({ rows: [row], total: 3 }));
    const repository = { list };
    const service = new TaskService(repository as unknown as TaskRepository);

    await expect(
      service.list(user, 'access-token', {
        page: 2,
        limit: 2,
        sort: 'desc',
      }),
    ).resolves.toMatchObject({
      items: [{ id: row.id, createdAt: row.created_at }],
      meta: { page: 2, limit: 2, total: 3, totalPages: 2 },
    });
    expect(list).toHaveBeenCalledWith(
      'user-1',
      'access-token',
      expect.objectContaining({ page: 2 }),
    );
  });

  it('creates a task without accepting a client-supplied owner', async () => {
    const create = jest.fn(async () => row);
    const repository = { create };
    const service = new TaskService(repository as unknown as TaskRepository);
    await service.create(user, 'access-token', { title: 'Plan release' });
    expect(create).toHaveBeenCalledWith('user-1', 'access-token', {
      title: 'Plan release',
    });
  });

  it('returns not found when the task is not owned by the user', async () => {
    const repository = {
      findById: jest.fn(async () => null),
    };
    const service = new TaskService(repository as unknown as TaskRepository);
    await expect(
      service.get(user, 'access-token', row.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates status and rejects deleting a missing task', async () => {
    const repository = {
      update: jest.fn(async () => ({ ...row, status: 'completed' as const })),
      delete: jest.fn(async () => false),
    };
    const service = new TaskService(repository as unknown as TaskRepository);
    await expect(
      service.update(user, 'access-token', row.id, { status: 'completed' }),
    ).resolves.toMatchObject({ status: 'completed' });

    await expect(
      service.delete(user, 'access-token', row.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
