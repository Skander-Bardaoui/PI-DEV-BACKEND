


// src/auth/dto/register.dto.ts
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  IsObject, 
  ValidateNested, 
  IsNumber, 
  Min, 
  Max, 
  Matches,
  IsBoolean 
} from 'class-validator';
import { Type } from 'class-transformer';

// Nested DTOs for structured data
class TenantInfoDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

class BusinessInfoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^[0-9]{7}\/[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/, {
    message: 'tax_id must follow Tunisian Matricule Fiscal format: NNNNNNN/X/A/E/NNN',
  })
  tax_id?: string;

  @IsString()
  currency: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

class TaxRateInfoDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @IsBoolean()
  is_default: boolean;
}

// Main Register DTO
export class RegisterDto {
  // User Info
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password!: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  // Tenant Info
  @IsObject()
  @ValidateNested()
  @Type(() => TenantInfoDto)
  tenant!: TenantInfoDto;

  // Business Info
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessInfoDto)
  business!: BusinessInfoDto;

  // Tax Rate Info
  @IsObject()
  @ValidateNested()
  @Type(() => TaxRateInfoDto)
  taxRate!: TaxRateInfoDto;
}





