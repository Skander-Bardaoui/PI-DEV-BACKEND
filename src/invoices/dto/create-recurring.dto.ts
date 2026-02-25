// src/invoices/dto/create-recurring.dto.ts
import { IsEnum, IsDateString, IsOptional } from 'class-validator';
import { RecurringFrequency } from '../entities/recurring-invoice.entity';

export class CreateRecurringDto {
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @IsDateString()
  start_date: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;
}