// src/expenses/expenses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, ExpenseCategory])],
  providers: [ExpensesService],
  controllers: [ExpensesController, ExpenseCategoriesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}