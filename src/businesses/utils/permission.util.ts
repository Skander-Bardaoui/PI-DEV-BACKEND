// src/businesses/utils/permission.util.ts
import { Role } from '../../users/enums/role.enum';

export enum PermissionType {
  CREATE = 0,
  UPDATE = 1,
  DELETE = 2,
  ADD_MEMBER = 3,
  KICK_MEMBER = 4,
  PROMOTE = 5,
}

export class PermissionUtil {
  /**
   * Check if a permission string has a specific permission
   */
  static hasPermission(permissions: string, type: PermissionType): boolean {
    if (!permissions || permissions.length !== 6) {
      return false;
    }
    
    if (type < 0 || type > 5) {
      return false;
    }
    
    return permissions[type] !== '-';
  }

  /**
   * Validate permission string format
   */
  static validatePermissionString(permissions: string): boolean {
    if (!permissions || permissions.length !== 6) {
      return false;
    }
    
    const positions = [
      ['c', '-'], // Position 0: Create
      ['u', '-'], // Position 1: Update
      ['d', '-'], // Position 2: Delete
      ['a', '-'], // Position 3: Add member
      ['k', '-'], // Position 4: Kick member
      ['p', '-'], // Position 5: Promote
    ];
    
    for (let i = 0; i < 6; i++) {
      if (!positions[i].includes(permissions[i])) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get default permissions for a role
   */
  static getRoleDefaultPermissions(role: Role): string {
    const defaults = {
      [Role.BUSINESS_OWNER]: 'cudakp',  // All permissions
      [Role.BUSINESS_ADMIN]: 'cud---',  // Create, Update, Delete
      [Role.TEAM_MEMBER]: '-u----',     // Update only (position 1)
      [Role.ACCOUNTANT]: '-u----',      // Update only (position 1)
      [Role.CLIENT]: '------',          // No permissions
      [Role.SUPPLIER]: '------',        // No permissions
      [Role.PLATFORM_ADMIN]: 'cudakp', // All permissions (though they bypass checks)
    };
    
    return defaults[role] || '------';
  }

  /**
   * Set a specific permission in a permission string
   */
  static setPermission(
    permissions: string,
    type: PermissionType,
    granted: boolean,
  ): string {
    if (!permissions || permissions.length !== 6) {
      permissions = '------';
    }
    
    const chars = permissions.split('');
    const permissionChars = ['c', 'u', 'd', 'a', 'k', 'p'];
    chars[type] = granted ? permissionChars[type] : '-';
    return chars.join('');
  }
}