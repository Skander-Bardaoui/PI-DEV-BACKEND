// src/expenses/dto/update-expense.dto.ts
import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}