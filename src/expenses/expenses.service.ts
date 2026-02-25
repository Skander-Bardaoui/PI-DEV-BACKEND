// src/expenses/expenses.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import type { Multer } from 'multer';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExpensesService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepository: Repository<ExpenseCategory>,
  ) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // ─── Create Expense ──────────────────────────────────────────────────────
  async create(business_id: string, user_id: string, dto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepository.create({
      business_id,
      user_id,
      ...dto,
      status: ExpenseStatus.DRAFT,
    });

    return this.expenseRepository.save(expense);
  }

  // ─── List Expenses (filtered by role) ───────────────────────────────────
  async findAll(
    business_id: string,
    user_id: string,
    user_role: string,
    page: number = 1,
    limit: number = 20,
    status?: ExpenseStatus,
    category_id?: string,
    filter_user_id?: string,
  ): Promise<{ expenses: Expense[]; total: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.business_id = :business_id', { business_id });

    // Role-based filtering: team members see only their own expenses
    const canSeeAll = ['PLATFORM_ADMIN', 'BUSINESS_OWNER', 'BUSINESS_ADMIN', 'ACCOUNTANT'].includes(
      user_role,
    );
    if (!canSeeAll) {
      queryBuilder.andWhere('expense.user_id = :user_id', { user_id });
    }

    if (status) {
      queryBuilder.andWhere('expense.status = :status', { status });
    }

    if (category_id) {
      queryBuilder.andWhere('expense.category_id = :category_id', { category_id });
    }

    if (filter_user_id) {
      queryBuilder.andWhere('expense.user_id = :filter_user_id', { filter_user_id });
    }

    const [expenses, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('expense.created_at', 'DESC')
      .getManyAndCount();

    return { expenses, total };
  }

  // ─── Get Expense by ID ───────────────────────────────────────────────────
  async findById(business_id: string, id: string, user_id: string, user_role: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, business_id },
      relations: ['user', 'category'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Check access: own expense or accountant/owner
    const canView = ['PLATFORM_ADMIN', 'BUSINESS_OWNER', 'BUSINESS_ADMIN', 'ACCOUNTANT'].includes(
      user_role,
    );
    if (!canView && expense.user_id !== user_id) {
      throw new ForbiddenException('You can only view your own expenses');
    }

    return expense;
  }

  // ─── Update Expense ──────────────────────────────────────────────────────
  async update(
    business_id: string,
    id: string,
    user_id: string,
    user_role: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findById(business_id, id, user_id, user_role);

    // Check permissions
    const isOwner = expense.user_id === user_id;
    const isApprover = ['BUSINESS_OWNER', 'ACCOUNTANT'].includes(user_role);

    if (isOwner && expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Can only update expenses in DRAFT status');
    }

    if (!isOwner && !isApprover) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.expenseRepository.update(id, dto);
    return this.findById(business_id, id, user_id, user_role);
  }

  // ─── Delete Expense ──────────────────────────────────────────────────────
  async delete(business_id: string, id: string, user_id: string, user_role: string): Promise<void> {
    const expense = await this.findById(business_id, id, user_id, user_role);

    const isOwner = expense.user_id === user_id;
    const isBusinessOwner = user_role === 'BUSINESS_OWNER';

    if (isOwner && expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Can only delete expenses in DRAFT status');
    }

    if (!isOwner && !isBusinessOwner) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Delete receipt file if exists
    if (expense.receipt_url) {
      const filepath = path.join(this.uploadsDir, path.basename(expense.receipt_url));
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await this.expenseRepository.delete({ id, business_id });
  }

  // ─── Submit Expense for Approval ─────────────────────────────────────────
  async submit(business_id: string, id: string, user_id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id, business_id } });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.user_id !== user_id) {
      throw new ForbiddenException('You can only submit your own expenses');
    }

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Can only submit expenses in DRAFT status');
    }

    await this.expenseRepository.update(id, { status: ExpenseStatus.PENDING });
    return this.findById(business_id, id, user_id, 'TEAM_MEMBER');
  }

  // ─── Approve Expense ─────────────────────────────────────────────────────
 async approve(
  business_id: string,
  id: string,
  approver_id: string,
  notes?: string,
): Promise<Expense> {
  const expense = await this.expenseRepository.findOne({ where: { id, business_id } });

  if (!expense) {
    throw new NotFoundException('Expense not found');
  }

  if (expense.status !== ExpenseStatus.PENDING) {
    throw new BadRequestException('Can only approve expenses in PENDING status');
  }

  await this.expenseRepository.update(id, {
    status: ExpenseStatus.APPROVED,
    approved_by: approver_id,
    approved_at: new Date(),
    approval_notes: notes,
  });

  const updatedExpense = await this.expenseRepository.findOne({
    where: { id },
    relations: ['user', 'category'],
  });

  if (!updatedExpense) {
    throw new NotFoundException('Expense not found');
  }

  return updatedExpense!; // ✅ FIXED
}

  // ─── Reject Expense ──────────────────────────────────────────────────────
  async reject(
    business_id: string,
    id: string,
    approver_id: string,
    reason: string,
  ): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id, business_id } });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Can only reject expenses in PENDING status');
    }

    await this.expenseRepository.update(id, {
      status: ExpenseStatus.REJECTED,
      approved_by: approver_id,
      approved_at: new Date(),
      approval_notes: reason,
    });

    const rejectedExpense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!rejectedExpense) {
      throw new NotFoundException('Expense not found');
    }

    return rejectedExpense;
  }

  // ─── Upload Receipt ──────────────────────────────────────────────────────
 async uploadReceipt(
  business_id: string,
  id: string,
  user_id: string,
  user_role: string,
  file: any,
): Promise<{ receipt_url: string }> {
  const expense = await this.findById(business_id, id, user_id, user_role);

  const isOwner = expense.user_id === user_id;
  const isAccountant = user_role === 'ACCOUNTANT';

  if (!isOwner && !isAccountant) {
    throw new ForbiddenException('Insufficient permissions');
  }

  if (expense.receipt_url) {
    const oldPath = path.join(this.uploadsDir, path.basename(expense.receipt_url));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const filename = `${id}-${Date.now()}${path.extname(file.originalname)}`;
  const filepath = path.join(this.uploadsDir, filename);

  fs.writeFileSync(filepath, file.buffer);

  const receipt_url = `/uploads/receipts/${filename}`;

  await this.expenseRepository.update(id, { receipt_url });

  return { receipt_url };
}


  // ─── Delete Receipt ──────────────────────────────────────────────────────
  async deleteReceipt(
    business_id: string,
    id: string,
    user_id: string,
    user_role: string,
  ): Promise<void> {
    const expense = await this.findById(business_id, id, user_id, user_role);

    const isOwner = expense.user_id === user_id;
    const isAccountant = user_role === 'ACCOUNTANT';

    if (!isOwner && !isAccountant) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (expense.receipt_url) {
      const filepath = path.join(this.uploadsDir, path.basename(expense.receipt_url));
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await this.expenseRepository.update(id, { receipt_url: null });
  }

  // ─── Get Receipt File Path ───────────────────────────────────────────────
  getReceiptPath(receipt_url: string): string {
    return path.join(this.uploadsDir, path.basename(receipt_url));
  }

  // ─── Category Management ─────────────────────────────────────────────────

  async createCategory(business_id: string, dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    const category = this.categoryRepository.create({ business_id, ...dto });
    return this.categoryRepository.save(category);
  }

  async getCategories(business_id: string): Promise<ExpenseCategory[]> {
    return this.categoryRepository.find({
      where: { business_id },
      order: { name: 'ASC' },
    });
  }

  async getCategoryById(business_id: string, id: string): Promise<ExpenseCategory> {
    const category = await this.categoryRepository.findOne({ where: { id, business_id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(
    business_id: string,
    id: string,
    dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategory> {
    await this.getCategoryById(business_id, id);
    await this.categoryRepository.update(id, dto);
    return this.getCategoryById(business_id, id);
  }

  async deleteCategory(business_id: string, id: string): Promise<void> {
    const result = await this.categoryRepository.delete({ id, business_id });
    if (result.affected === 0) {
      throw new NotFoundException('Category not found');
    }
  }
}