import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';
import { Subtask } from './entities/subtask.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';
import { Task } from '../tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subtask, BusinessMember, Task]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [SubtasksController],
  providers: [SubtasksService],
  exports: [SubtasksService],
})
export class SubtasksModule {}
