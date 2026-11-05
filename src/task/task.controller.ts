import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAccessToken, CurrentUser } from '../auth/auth.decorators';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from './task.dto';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdSchema,
  updateTaskSchema,
} from './task.dto';
import { TaskService } from './task.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller({ path: 'tasks', version: '1' })
export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAccessToken() accessToken: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskInput,
  ) {
    return this.tasks.create(user, accessToken, body);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's tasks" })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAccessToken() accessToken: string,
    @Query(new ZodValidationPipe(listTasksQuerySchema)) query: ListTasksQuery,
  ) {
    return this.tasks.list(user, accessToken, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an owned task by ID' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAccessToken() accessToken: string,
    @Param(new ZodValidationPipe(taskIdSchema)) params: { id: string },
  ) {
    return this.tasks.get(user, accessToken, params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned task' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAccessToken() accessToken: string,
    @Param(new ZodValidationPipe(taskIdSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateTaskSchema)) body: UpdateTaskInput,
  ) {
    return this.tasks.update(user, accessToken, params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an owned task' })
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAccessToken() accessToken: string,
    @Param(new ZodValidationPipe(taskIdSchema)) params: { id: string },
  ) {
    return this.tasks.delete(user, accessToken, params.id);
  }
}
