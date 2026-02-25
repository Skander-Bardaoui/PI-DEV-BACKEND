// src/invoices/dto/update-invoice-item.dto.ts
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateInvoiceItemDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;
}