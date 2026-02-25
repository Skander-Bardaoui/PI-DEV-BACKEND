// src/invoices/dto/mark-paid.dto.ts
import { IsDateString, IsString, IsNumber, IsOptional } from 'class-validator';

export class MarkPaidDto {
  @IsOptional()
  @IsDateString()
  payment_date?: Date;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}