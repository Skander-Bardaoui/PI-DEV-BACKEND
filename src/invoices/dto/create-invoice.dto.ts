// src/invoices/dto/create-invoice.dto.ts
import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export class CreateInvoiceDto {
  @IsString()
  client_id: string;

  @IsOptional()
  @IsString()
  invoice_number?: string; // Auto-generated if not provided

  @IsDateString()
  date: Date;

  @IsDateString()
  due_date: Date;

  @IsArray()
  @ArrayMinSize(1, { message: 'Invoice must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  tax_rate?: number;
}