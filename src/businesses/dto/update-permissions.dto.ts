// src/businesses/dto/update-permissions.dto.ts
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePermissionsDto {
  @IsOptional()
  @IsObject({ message: 'Collaboration permissions must be an object' })
  collaboration_permissions?: Record<string, boolean>;

  @IsOptional()
  @IsObject({ message: 'Stock permissions must be an object' })
  stock_permissions?: Record<string, boolean>;
}