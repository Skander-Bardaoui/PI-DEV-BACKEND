// src/expenses/expenses.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ExpensesService } from './expenses.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles} from '../auth/decorators/roles.decorators';
import { Role } from '../users/enums/role.enum';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { ApproveExpenseDto } from './dto/approve-expense.dto';
import { RejectExpenseDto } from './dto/reject-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import * as fs from 'fs';

@Controller('businesses/:businessId/expenses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ─── POST /businesses/:businessId/expenses ───────────────────────────────
  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Request() req,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(businessId, req.user.id, dto);
  }

  // ─── GET /businesses/:businessId/expenses ────────────────────────────────
  @Get()
  async findAll(
    @Param('businessId') businessId: string,
    @Request() req,
    @Query() query: QueryExpensesDto,
  ) {
    const { expenses, total } = await this.expensesService.findAll(
      businessId,
      req.user.id,
      req.user.role,
      query.page,
      query.limit,
      query.status,
      query.category_id,
      query.user_id,
    );

    return { expenses, total, page: query.page, limit: query.limit };
  }

  // ─── GET /businesses/:businessId/expenses/:id ────────────────────────────
  @Get(':id')
  async findOne(@Param('businessId') businessId: string, @Param('id') id: string, @Request() req) {
    return this.expensesService.findById(businessId, id, req.user.id, req.user.role);
  }

  // ─── PATCH /businesses/:businessId/expenses/:id ──────────────────────────
  @Patch(':id')
  async update(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(businessId, id, req.user.id, req.user.role, dto);
  }

  // ─── DELETE /businesses/:businessId/expenses/:id ─────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('businessId') businessId: string, @Param('id') id: string, @Request() req) {
    await this.expensesService.delete(businessId, id, req.user.id, req.user.role);
    return { message: 'Expense deleted successfully' };
  }

  // ─── POST /businesses/:businessId/expenses/:id/submit ────────────────────
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submit(@Param('businessId') businessId: string, @Param('id') id: string, @Request() req) {
    const expense = await this.expensesService.submit(businessId, id, req.user.id);
    return { message: 'Expense submitted for approval', expense };
  }

  // ─── POST /businesses/:businessId/expenses/:id/approve ───────────────────
  @Post(':id/approve')
  @Roles(Role.ACCOUNTANT, Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Request() req,
    @Body() dto: ApproveExpenseDto,
  ) {
    const expense = await this.expensesService.approve(businessId, id, req.user.id, dto.notes);
    return { message: 'Expense approved', expense };
  }

  // ─── POST /businesses/:businessId/expenses/:id/reject ────────────────────
  @Post(':id/reject')
  @Roles(Role.ACCOUNTANT, Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Request() req,
    @Body() dto: RejectExpenseDto,
  ) {
    const expense = await this.expensesService.reject(businessId, id, req.user.id, dto.reason);
    return { message: 'Expense rejected', expense };
  }

  // ─── POST /businesses/:businessId/expenses/:id/receipt ───────────────────
 @Post(':id/receipt')
@UseInterceptors(FileInterceptor('receipt'))
async uploadReceipt(
  @Param('businessId') businessId: string,
  @Param('id') id: string,
  @Request() req,
 @UploadedFile() file: any,

) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  return this.expensesService.uploadReceipt(
    businessId,
    id,
    req.user.id,
    req.user.role,
    file,
  );
}


  // ─── DELETE /businesses/:businessId/expenses/:id/receipt ─────────────────
  @Delete(':id/receipt')
  @HttpCode(HttpStatus.OK)
  async deleteReceipt(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    await this.expensesService.deleteReceipt(businessId, id, req.user.id, req.user.role);
    return { message: 'Receipt deleted successfully' };
  }

  // ─── GET /businesses/:businessId/expenses/:id/receipt ────────────────────
  @Get(':id/receipt')
  async getReceipt(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const expense = await this.expensesService.findById(businessId, id, req.user.id, req.user.role);

    if (!expense.receipt_url) {
      throw new NotFoundException('No receipt found for this expense');
    }

    const filepath = this.expensesService.getReceiptPath(expense.receipt_url);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Receipt file not found');
    }

    res.sendFile(filepath);
  }
}