// src/expenses/dto/create-expense.dto.ts
import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  category_id: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  date: Date;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}