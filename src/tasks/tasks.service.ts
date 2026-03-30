import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { BusinessMembersService } from '../businesses/services/business-members.service';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private businessMembersService: BusinessMembersService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => MessagesGateway))
    private messagesGateway: MessagesGateway,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    // If businessId is not provided, get the first business the user belongs to
    let businessId = createTaskDto.businessId;
    
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    // Check if user has access to this business
    const hasAccess = await this.businessMembersService.hasAccess(userId, businessId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this business');
    }

    // Get the highest order for the status
    const taskStatus = createTaskDto.status || TaskStatus.TODO;
    const maxOrderTask = await this.taskRepository.findOne({
      where: { businessId, status: taskStatus },
      order: { order: 'DESC' },
    });
    const newOrder = maxOrderTask ? maxOrderTask.order + 1 : 0;

    // Get assigned users if provided
    let assignedUsers: User[] = [];
    if (createTaskDto.assignedToIds && createTaskDto.assignedToIds.length > 0) {
      assignedUsers = await this.userRepository.find({
        where: { id: In(createTaskDto.assignedToIds) },
      });
    }

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      status: createTaskDto.status,
      dueDate: createTaskDto.dueDate,
      businessId,
      createdById: userId,
      assignedTo: assignedUsers,
      order: newOrder,
    });

    return this.taskRepository.save(task);
  }

  async findAllByBusiness(businessId: string, userId: string): Promise<Task[]> {
    // Check if user has access to this business
    const hasAccess = await this.businessMembersService.hasAccess(userId, businessId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this business');
    }

    return this.taskRepository.find({
      where: { businessId },
      relations: ['assignedTo', 'createdBy'],
      order: { status: 'ASC', order: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'business'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this business
    const hasAccess = await this.businessMembersService.hasAccess(userId, task.businessId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);

    // Update assigned users if provided
    if (updateTaskDto.assignedToIds !== undefined) {
      if (updateTaskDto.assignedToIds.length > 0) {
        task.assignedTo = await this.userRepository.find({
          where: { id: In(updateTaskDto.assignedToIds) },
        });
      } else {
        task.assignedTo = [];
      }
    }

    // Update other fields
    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) task.description = updateTaskDto.description;
    if (updateTaskDto.priority !== undefined) task.priority = updateTaskDto.priority;
    if (updateTaskDto.status !== undefined) task.status = updateTaskDto.status;
    if (updateTaskDto.dueDate !== undefined) task.dueDate = updateTaskDto.dueDate;

    return this.taskRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.taskRepository.remove(task);
  }

  async moveTask(
    id: string,
    moveTaskDto: MoveTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);
    const { status: newStatus, order: newOrder } = moveTaskDto;
    const oldStatus = task.status;
    const oldOrder = task.order;

    // Use transaction to ensure atomicity
    const updatedTask = await this.dataSource.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);

      // If status changed
      if (oldStatus !== newStatus) {
        // Decrease order of tasks after the old position in old column
        await taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" - 1' })
          .where('businessId = :businessId', { businessId: task.businessId })
          .andWhere('status = :status', { status: oldStatus })
          .andWhere('"order" > :oldOrder', { oldOrder })
          .execute();

        // Increase order of tasks at or after the new position in new column
        await taskRepo
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" + 1' })
          .where('businessId = :businessId', { businessId: task.businessId })
          .andWhere('status = :status', { status: newStatus })
          .andWhere('"order" >= :newOrder', { newOrder })
          .execute();

        // Update the task
        task.status = newStatus;
        task.order = newOrder;
      } else {
        // Same column reordering
        if (newOrder < oldOrder) {
          // Moving up: increase order of tasks between new and old position
          await taskRepo
            .createQueryBuilder()
            .update(Task)
            .set({ order: () => '"order" + 1' })
            .where('businessId = :businessId', { businessId: task.businessId })
            .andWhere('status = :status', { status: oldStatus })
            .andWhere('"order" >= :newOrder', { newOrder })
            .andWhere('"order" < :oldOrder', { oldOrder })
            .execute();
        } else if (newOrder > oldOrder) {
          // Moving down: decrease order of tasks between old and new position
          await taskRepo
            .createQueryBuilder()
            .update(Task)
            .set({ order: () => '"order" - 1' })
            .where('businessId = :businessId', { businessId: task.businessId })
            .andWhere('status = :status', { status: oldStatus })
            .andWhere('"order" > :oldOrder', { oldOrder })
            .andWhere('"order" <= :newOrder', { newOrder })
            .execute();
        }

        task.order = newOrder;
      }

      return await taskRepo.save(task);
    });

    // Emit WebSocket event
    this.messagesGateway.emitTaskMoved(task.businessId, {
      taskId: task.id,
      newStatus: newStatus,
      newOrder: newOrder,
      movedBy: userId,
    });

    return updatedTask;
  }
}
