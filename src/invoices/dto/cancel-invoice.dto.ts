// src/invoices/dto/cancel-invoice.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CancelInvoiceDto {
  @IsOptional()
  @IsString()
  reason?: string;
}