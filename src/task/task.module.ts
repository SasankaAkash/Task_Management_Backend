import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { TaskController } from './task.controller';
import { TaskRepository } from './task.repository';
import { TaskService } from './task.service';

@Module({
  imports: [SupabaseModule],
  controllers: [TaskController],
  providers: [TaskRepository, TaskService],
})
export class TaskModule {}
