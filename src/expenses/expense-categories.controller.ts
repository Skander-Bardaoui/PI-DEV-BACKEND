// src/expenses/expense-categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles} from '../auth/decorators/roles.decorators';
import { Role } from '../users/enums/role.enum';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Controller('businesses/:businessId/expense-categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ─── POST /businesses/:businessId/expense-categories ─────────────────────
  @Post()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async create(@Param('businessId') businessId: string, @Body() dto: CreateExpenseCategoryDto) {
    return this.expensesService.createCategory(businessId, dto);
  }

  // ─── GET /businesses/:businessId/expense-categories ──────────────────────
  @Get()
  async findAll(@Param('businessId') businessId: string) {
    return this.expensesService.getCategories(businessId);
  }

  // ─── PATCH /businesses/:businessId/expense-categories/:id ────────────────
  @Patch(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async update(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return this.expensesService.updateCategory(businessId, id, dto);
  }

  // ─── DELETE /businesses/:businessId/expense-categories/:id ───────────────
  @Delete(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('businessId') businessId: string, @Param('id') id: string) {
    await this.expensesService.deleteCategory(businessId, id);
    return { message: 'Category deleted successfully' };
  }
}