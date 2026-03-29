import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ChatColorPreference } from './entities/chat-color-preference.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(ChatColorPreference)
    private chatColorPreferenceRepository: Repository<ChatColorPreference>,
    private tasksService: TasksService,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    userId: string,
  ): Promise<Message> {
    // Verify task exists and user has access
    await this.tasksService.findOne(createMessageDto.taskId, userId);

    // Ensure mentions is always an array (not a string)
    let mentions: string[] | undefined = undefined;
    if (createMessageDto.mentions) {
      if (typeof createMessageDto.mentions === 'string') {
        try {
          mentions = JSON.parse(createMessageDto.mentions);
        } catch (e) {
          mentions = undefined;
        }
      } else {
        mentions = createMessageDto.mentions;
      }
    }

    const message = this.messageRepository.create({
      taskId: createMessageDto.taskId,
      content: createMessageDto.content,
      fileUrl: createMessageDto.fileUrl,
      fileName: createMessageDto.fileName,
      fileType: createMessageDto.fileType,
      fileSize: createMessageDto.fileSize,
      mentions: mentions,
      messageColor: createMessageDto.messageColor,
      senderId: userId,
    });

    const saved = await this.messageRepository.save(message);

    // Load sender info
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });

    if (!messageWithSender) {
      throw new Error('Failed to retrieve saved message');
    }

    return messageWithSender;
  }

  async findAllByTask(taskId: string, userId: string): Promise<Message[]> {
    // Verify task exists and user has access
    await this.tasksService.findOne(taskId, userId);

    return this.messageRepository.find({
      where: { taskId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async getChatColorPreference(
    taskId: string,
    userId: string,
  ): Promise<string> {
    const preference = await this.chatColorPreferenceRepository.findOne({
      where: { taskId, userId },
    });

    return preference?.color || '#4F46E5'; // Couleur par défaut
  }

  async setChatColorPreference(
    taskId: string,
    userId: string,
    color: string,
  ): Promise<ChatColorPreference> {
    // Vérifier que l'utilisateur a accès à la tâche
    await this.tasksService.findOne(taskId, userId);

    let preference = await this.chatColorPreferenceRepository.findOne({
      where: { taskId, userId },
    });

    if (preference) {
      preference.color = color;
    } else {
      preference = this.chatColorPreferenceRepository.create({
        taskId,
        userId,
        color,
      });
    }

    return this.chatColorPreferenceRepository.save(preference);
  }
}
