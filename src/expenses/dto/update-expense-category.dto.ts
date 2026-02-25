// src/expenses/dto/update-expense-category.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateExpenseCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}