// src/businesses/dto/update-permissions.example.ts
// This file demonstrates how to use the UpdatePermissionsDto in a controller

import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdatePermissionsDto } from './update-permissions.dto';

/**
 * Example controller method showing how to use UpdatePermissionsDto
 * This is for demonstration purposes only - the actual implementation
 * will be in the business members controller
 */
@Controller('example')
export class ExampleController {
  @Patch('businesses/:businessId/members/:userId/permissions')
  async updateMemberPermissions(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
  ) {
    // The DTO will automatically validate:
    // 1. permissions is a string
    // 2. permissions is exactly 6 characters long
    // 3. permissions matches the format: [cud-][cud-][cud-][ak-][ak-][p-]
    
    const { permissions } = updatePermissionsDto;
    
    // At this point, permissions is guaranteed to be valid
    console.log('Valid permission string received:', permissions);
    
    // Example usage:
    // - permissions[0]: Create permission ('c' or '-')
    // - permissions[1]: Update permission ('u' or '-')
    // - permissions[2]: Delete permission ('d' or '-')
    // - permissions[3]: Add member permission ('a' or '-')
    // - permissions[4]: Kick member permission ('k' or '-')
    // - permissions[5]: Promote permission ('p' or '-')
    
    return {
      businessId,
      userId,
      permissions,
      message: 'Permissions would be updated',
    };
  }
}

/**
 * Example validation scenarios:
 * 
 * ✅ Valid requests:
 * POST /example/businesses/123/members/456/permissions
 * Body: { "permissions": "cudakp" }  // All permissions
 * 
 * POST /example/businesses/123/members/456/permissions
 * Body: { "permissions": "------" }  // No permissions
 * 
 * POST /example/businesses/123/members/456/permissions
 * Body: { "permissions": "cud---" }  // Create, Update, Delete only
 * 
 * ❌ Invalid requests (will return 400 Bad Request):
 * POST /example/businesses/123/members/456/permissions
 * Body: { "permissions": "cud" }     // Too short
 * 
 * POST /example/businesses/123/members/456/permissions
 * Body: { "permissions": "CUDAKP" }  // Uppercase letters
 * 
 * POST /example/businesses/123/members/456/permissions
 * Body: { "permissions": "123456" }  // Invalid characters
 * 
 * POST /example/businesses/123/members/456/permissions
 * Body: { "permissions": "xudakp" }  // Invalid character in position 0
 */