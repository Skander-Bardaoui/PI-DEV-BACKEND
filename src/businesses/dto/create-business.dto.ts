// src/businesses/dto/create-business.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  tenant_id: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;

  // Matricule Fiscal validation (Tunisian tax ID)
  // Format: NNNNNNN/X/A/E/NNN (7-20 characters)
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^[0-9]{7}\/[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/, {
    message: 'tax_id must follow Tunisian Matricule Fiscal format: NNNNNNN/X/A/E/NNN',
  })
  tax_id?: string;

  @IsOptional()
  @IsString()
  currency?: string; // Defaults to TND

  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @IsOptional()
  @IsObject()
  address?: object;
}