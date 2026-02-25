// src/invoices/dto/update-invoice.dto.ts
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

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsDateString()
  due_date?: Date;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  tax_rate?: number;
}