import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TaskModule } from './task/task.module';
import { SupabaseModule } from './supabase/supabase.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule, TaskModule, SupabaseModule, HealthModule],
  
})
export class AppModule {}
