// src/expenses/dto/reject-expense.dto.ts
import { IsString } from 'class-validator';

export class RejectExpenseDto {
  @IsString()
  reason: string;
}