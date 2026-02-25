// src/invoices/dto/update-recurring.dto.ts
import { IsEnum, IsDateString, IsOptional } from 'class-validator';
import { RecurringFrequency } from '../entities/recurring-invoice.entity';

export class UpdateRecurringDto {
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;
}