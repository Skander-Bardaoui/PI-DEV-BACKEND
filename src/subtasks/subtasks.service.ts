import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Subtask } from './entities/subtask.entity';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { GenerateSubtasksDto } from './dto/generate-subtasks.dto';

@Injectable()
export class SubtasksService {
  constructor(
    @InjectRepository(Subtask)
    private subtaskRepository: Repository<Subtask>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async findByTask(taskId: string): Promise<Subtask[]> {
    return this.subtaskRepository.find({
      where: { taskId },
      order: { order: 'ASC' },
    });
  }

  async getTaskProgress(taskId: string): Promise<{ completed: number; total: number; percentage: number }> {
    const subtasks = await this.findByTask(taskId);
    const total = subtasks.length;
    // Progression basée UNIQUEMENT sur les actions des TEAM_MEMBER
    const completed = subtasks.filter(s => s.isCompletedByTeamMember).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }

  async create(createSubtaskDto: CreateSubtaskDto): Promise<Subtask> {
    const subtask = this.subtaskRepository.create(createSubtaskDto);
    return this.subtaskRepository.save(subtask);
  }

  async update(id: string, updateSubtaskDto: UpdateSubtaskDto): Promise<Subtask> {
    const subtask = await this.subtaskRepository.findOne({ where: { id } });
    if (!subtask) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }

    Object.assign(subtask, updateSubtaskDto);
    return this.subtaskRepository.save(subtask);
  }

  async markCompleteByTeamMember(id: string): Promise<Subtask> {
    const subtask = await this.subtaskRepository.findOne({ where: { id } });
    if (!subtask) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }

    // Marque comme complété ET compte pour la progression
    subtask.isCompleted = true;
    subtask.isCompletedByTeamMember = true;
    
    return this.subtaskRepository.save(subtask);
  }

  async remove(id: string): Promise<void> {
    const result = await this.subtaskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }
  }

  async generateSubtasks(generateDto: GenerateSubtasksDto): Promise<string[]> {
    const { taskTitle, taskDescription } = generateDto;

    console.log('🤖 Generate Subtasks Request:', {
      taskTitle,
      taskDescription: taskDescription.substring(0, 100),
    });

    const groqApiKey = this.configService.get<string>('GROQ_API_KEY_NOUHA');
    if (!groqApiKey) {
      console.error('❌ GROQ_API_KEY_NOUHA is not configured in environment');
      throw new BadRequestException('GROQ_API_KEY_NOUHA is not configured');
    }

    console.log('✅ Groq API Key found:', groqApiKey.substring(0, 10) + '...');

    const prompt = `You are a task management assistant. Based on the following task, generate between 5 to 8 short, actionable subtasks.

Task Title: ${taskTitle}
Task Description: ${taskDescription}

Return ONLY a valid JSON array of strings, with no additional text or explanation. Each string should be a concise subtask title (max 60 characters).

Example format: ["Subtask 1", "Subtask 2", "Subtask 3"]`;

    try {
      console.log('📡 Calling Groq API...');
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          },
          {
            headers: {
              'Authorization': `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      console.log('✅ Groq API Response received');
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('No response from AI');
      }

      console.log('📝 AI Response:', content);

      // Parse the JSON array from the response
      const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
      const subtasks = JSON.parse(cleanedContent);

      if (!Array.isArray(subtasks)) {
        throw new BadRequestException('AI response is not a valid array');
      }

      const filtered = subtasks.filter((s) => typeof s === 'string' && s.trim() !== '');
      console.log(`✅ Generated ${filtered.length} subtasks`);
      return filtered;
    } catch (error: any) {
      console.error('❌ Groq API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new BadRequestException(
        `Failed to generate subtasks: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
}
