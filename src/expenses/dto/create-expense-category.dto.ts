// src/expenses/dto/create-expense-category.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}