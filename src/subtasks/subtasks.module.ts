import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';
import { Subtask } from './entities/subtask.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subtask]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [SubtasksController],
  providers: [SubtasksService],
  exports: [SubtasksService],
})
export class SubtasksModule {}
