import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from './task.dto';

describe('task input schemas', () => {
  it('accepts a task and rejects unknown write fields', () => {
    expect(createTaskSchema.safeParse({ title: 'Plan release' }).success).toBe(
      true,
    );
    expect(
      createTaskSchema.safeParse({
        title: 'Plan release',
        user_id: 'attacker',
      }).success,
    ).toBe(false);
  });

  it('rejects empty updates and validates status values', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(updateTaskSchema.safeParse({ status: 'completed' }).success).toBe(
      true,
    );
    expect(updateTaskSchema.safeParse({ status: 'done' }).success).toBe(false);
  });

  it('applies safe pagination defaults and bounds', () => {
    expect(listTasksQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      sort: 'desc',
    });
    expect(listTasksQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
