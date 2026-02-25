// src/expenses/dto/approve-expense.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class ApproveExpenseDto {
  @IsOptional()
  @IsString()
  notes?: string;
}