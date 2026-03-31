import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { GenerateSubtasksDto } from './dto/generate-subtasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../users/enums/role.enum';

@Controller('subtasks')
@UseGuards(JwtAuthGuard)
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  // Tout le monde peut voir les subtasks
  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.subtasksService.findByTask(taskId);
  }

  // Obtenir la progression d'une tâche
  @Get('task/:taskId/progress')
  getTaskProgress(@Param('taskId') taskId: string) {
    return this.subtasksService.getTaskProgress(taskId);
  }

  // Seuls BUSINESS_OWNER et BUSINESS_ADMIN peuvent créer manuellement
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  create(@Body() createSubtaskDto: CreateSubtaskDto) {
    return this.subtasksService.create(createSubtaskDto);
  }

  // Seuls BUSINESS_OWNER et BUSINESS_ADMIN peuvent générer avec AI
  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async generateSubtasks(@Body() generateDto: GenerateSubtasksDto) {
    console.log('📥 Received generate request:', generateDto);
    return this.subtasksService.generateSubtasks(generateDto);
  }

  @Get('test-groq')
  async testGroq() {
    // Simple test endpoint to verify Groq API key
    return {
      message: 'Groq API test endpoint',
      hasApiKey: !!process.env.GROQ_API_KEY_NOUHA,
      keyPrefix: process.env.GROQ_API_KEY_NOUHA?.substring(0, 10),
    };
  }

  // TEAM_MEMBER peut cocher (isCompleted), mais seuls OWNER/ADMIN peuvent renommer
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubtaskDto: UpdateSubtaskDto) {
    return this.subtasksService.update(id, updateSubtaskDto);
  }

  // Endpoint spécifique pour TEAM_MEMBER - marque comme complété ET compte pour la progression
  @Post(':id/mark-complete')
  async markCompleteByTeamMember(@Param('id') id: string) {
    return this.subtasksService.markCompleteByTeamMember(id);
  }

  // Seuls BUSINESS_OWNER et BUSINESS_ADMIN peuvent supprimer
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  remove(@Param('id') id: string) {
    return this.subtasksService.remove(id);
  }
}
