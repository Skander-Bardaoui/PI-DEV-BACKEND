// src/businesses/dto/update-permissions.dto.ts
import { IsString, Length, Matches } from 'class-validator';

export class UpdatePermissionsDto {
  @IsString({ message: 'Permissions must be a string' })
  @Length(6, 6, { message: 'Permission string must be exactly 6 characters long' })
  @Matches(/^[cud\-][cud\-][cud\-][ak\-][ak\-][p\-]$/, {
    message: 'Invalid permission string format. Expected format: cudakp where each position can be the permission letter or dash (-)',
  })
  permissions: string;
}