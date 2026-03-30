import { IsEnum, IsInt, Min } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsInt()
  @Min(0)
  order: number;
}
