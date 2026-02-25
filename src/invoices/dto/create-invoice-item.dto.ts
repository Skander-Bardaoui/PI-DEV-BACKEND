// src/invoices/dto/create-invoice-item.dto.ts
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;
}