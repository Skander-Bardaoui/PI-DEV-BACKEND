// src/businesses/services/business-members.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BusinessMember } from '../entities/business-member.entity';
import { Business } from '../entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/enums/role.enum';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { PermissionUtil } from '../utils/permission.util';

@Injectable()
export class BusinessMembersService {
  constructor(
    @InjectRepository(BusinessMember)
    private businessMemberRepository: Repository<BusinessMember>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Get all businesses accessible by a user
   */
  async getUserBusinesses(userId: string): Promise<Business[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // PLATFORM_ADMIN can see all businesses
    if (user.role === Role.PLATFORM_ADMIN) {
      return this.businessRepository.find({
        order: { created_at: 'DESC' },
      });
    }

    // BUSINESS_OWNER can see all businesses in their tenant
    if (user.role === Role.BUSINESS_OWNER) {
      const tenant = await this.tenantRepository.findOne({
        where: { ownerId: userId },
      });

      if (tenant) {
        return this.businessRepository.find({
          where: { tenant_id: tenant.id },
          order: { created_at: 'DESC' },
        });
      }
    }

    // Other roles: get businesses they're members of
    const memberships = await this.businessMemberRepository.find({
      where: { user_id: userId, is_active: true },
      relations: ['business'],
    });

    return memberships.map((m) => m.business);
  }

  /**
   * Get all members of a business
   */
  async getBusinessMembers(businessId: string): Promise<BusinessMember[]> {
    return this.businessMemberRepository.find({
      where: { business_id: businessId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Add a member to a business with enhanced validation and error handling
   */
  async addMember(
    businessId: string,
    userId: string,
    role: Role,
    invitedBy: string,
  ): Promise<BusinessMember> {
    // Verify business exists
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify inviter exists
    const inviter = await this.userRepository.findOne({
      where: { id: invitedBy },
    });

    if (!inviter) {
      throw new NotFoundException(`Inviter with ID ${invitedBy} not found`);
    }

    // Check if already a member
    const existing = await this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId },
    });

    if (existing) {
      throw new BadRequestException(
        `User ${userId} is already a member of business ${businessId}`
      );
    }

    // Validate role
    const validRoles = [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.TEAM_MEMBER, Role.ACCOUNTANT];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }

    // Get role-based default permissions
    const defaultPermissions = PermissionUtil.getRoleDefaultPermissions(role);

    // Create membership with role-based default permissions
    const member = this.businessMemberRepository.create({
      business_id: businessId,
      user_id: userId,
      role,
      permissions: defaultPermissions,
      invited_by: invitedBy,
      invited_at: new Date(),
      joined_at: new Date(),
      is_active: true,
    });

    try {
      const savedMember = await this.businessMemberRepository.save(member);
      
      console.log(`Member added successfully:`, {
        businessId,
        userId,
        role,
        permissions: defaultPermissions,
        invitedBy,
        createdAt: new Date().toISOString()
      });

      return savedMember;
    } catch (error) {
      console.error('Error adding member to business:', error);
      throw new BadRequestException('Failed to add member to business');
    }
  }

  /**
   * Create a new business member with default permissions based on role
   * This is an alias for addMember to match the task requirements
   */
  async createMember(
    businessId: string,
    userId: string,
    role: Role,
    invitedBy: string,
  ): Promise<BusinessMember> {
    return this.addMember(businessId, userId, role, invitedBy);
  }

  /**
   * Remove a member from a business
   */
  async removeMember(businessId: string, userId: string): Promise<void> {
    const result = await this.businessMemberRepository.delete({
      business_id: businessId,
      user_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Member not found');
    }
  }

  /**
   * Update member role with enhanced validation and permission consistency
   */
  async updateMemberRole(
    businessId: string,
    userId: string,
    newRole: Role,
  ): Promise<BusinessMember> {
    console.log('BusinessMembersService.updateMemberRole called:', { businessId, userId, newRole });
    
    // Verify business exists
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Find the member
    const member = await this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId },
      relations: ['user'],
    });

    if (!member) {
      console.log('Member not found:', { businessId, userId });
      throw new NotFoundException(`Member not found for user ${userId} in business ${businessId}`);
    }

    // Validate that the member is active
    if (!member.is_active) {
      throw new BadRequestException('Cannot update role for inactive member');
    }

    // Validate new role
    const validRoles = [Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.TEAM_MEMBER, Role.ACCOUNTANT];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(', ')}`);
    }

    console.log('Found member:', { id: member.id, currentRole: member.role, newRole });
    
    const previousRole = member.role;
    const previousPermissions = member.permissions;
    
    // Update role in business_members table
    member.role = newRole;
    
    // If promoting to BUSINESS_OWNER, set full permissions (requirement 7.5)
    if (newRole === Role.BUSINESS_OWNER) {
      member.permissions = PermissionUtil.getRoleDefaultPermissions(newRole);
      console.log('Promoting to BUSINESS_OWNER, setting full permissions:', member.permissions);
    }
    // Note: When demoting from BUSINESS_OWNER, permissions are preserved (requirement 7.6)
    // This is a security consideration - permissions must be manually adjusted if needed
    
    try {
      const saved = await this.businessMemberRepository.save(member);
      
      // Also update role in users table
      await this.userRepository.update(userId, { role: newRole });
      
      console.log('Member role updated successfully:', {
        businessId,
        userId,
        previousRole,
        newRole,
        previousPermissions,
        newPermissions: saved.permissions,
        updatedAt: new Date().toISOString()
      });
      
      return saved;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw new BadRequestException('Failed to update member role');
    }
  }

  /**
   * Seed existing business members with role-based default permissions
   * This method updates all business members that have default '------' permissions
   * with appropriate permissions based on their role
   */
  async seedExistingMembersWithDefaultPermissions(): Promise<{ updated: number; skipped: number }> {
    console.log('Starting to seed existing business members with default permissions...');
    
    // Find all business members with default permissions ('------') or null/empty permissions
    const membersWithDefaultPermissions = await this.businessMemberRepository.find({
      where: [
        { permissions: '------' },
        { permissions: null as any },
        { permissions: '' },
      ],
      relations: ['user'],
    });

    console.log(`Found ${membersWithDefaultPermissions.length} members with default permissions`);

    let updated = 0;
    let skipped = 0;

    for (const member of membersWithDefaultPermissions) {
      try {
        const defaultPermissions = PermissionUtil.getRoleDefaultPermissions(member.role);
        
        // Update permissions regardless of current value since we're seeding
        member.permissions = defaultPermissions;
        await this.businessMemberRepository.save(member);
        updated++;
        
        console.log(`Updated member ${member.user_id} (${member.role}) with permissions: ${defaultPermissions}`);
      } catch (error) {
        console.error(`Error updating member ${member.id}:`, error);
        skipped++;
      }
    }

    console.log(`Permission seeding completed. Updated: ${updated}, Skipped: ${skipped}`);
    
    return { updated, skipped };
  }

  /**
   * Update member permissions with enhanced validation and error handling
   */
  async updateMemberPermissions(
    businessId: string,
    userId: string,
    permissions: string,
  ): Promise<BusinessMember> {
    // Validate permission string format
    if (!PermissionUtil.validatePermissionString(permissions)) {
      throw new BadRequestException(
        'Invalid permission string format. Expected 6 characters with valid permission letters (c,u,d,a,k,p) or dashes (-)'
      );
    }

    // Verify business exists
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Find the member with business and user relations
    const member = await this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId },
      relations: ['user', 'business'],
    });

    if (!member) {
      throw new NotFoundException(
        `Business member not found for user ${userId} in business ${businessId}`
      );
    }

    // Validate that the member is active
    if (!member.is_active) {
      throw new BadRequestException('Cannot update permissions for inactive member');
    }

    // Store previous permissions for logging
    const previousPermissions = member.permissions;

    // Update permissions
    member.permissions = permissions;
    
    try {
      const updatedMember = await this.businessMemberRepository.save(member);
      
      console.log(`Permission update successful:`, {
        businessId,
        userId,
        memberRole: member.role,
        previousPermissions,
        newPermissions: permissions,
        updatedAt: new Date().toISOString()
      });

      return updatedMember;
    } catch (error) {
      console.error('Error updating member permissions:', error);
      throw new BadRequestException('Failed to update member permissions');
    }
  }

  /**
   * Check if user has access to a business
   */
  async hasAccess(userId: string, businessId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return false;
    }

    // PLATFORM_ADMIN has access to everything
    if (user.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Check if BUSINESS_OWNER owns the tenant
    if (user.role === Role.BUSINESS_OWNER) {
      const tenant = await this.tenantRepository.findOne({
        where: { ownerId: userId },
      });

      if (tenant) {
        const business = await this.businessRepository.findOne({
          where: { id: businessId },
        });

        return business?.tenant_id === tenant.id;
      }
    }

    // Check membership
    const member = await this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId, is_active: true },
    });

    return !!member;
  }

  /**
   * Get user's role in a specific business
   */
  async getUserRoleInBusiness(
    userId: string,
    businessId: string,
  ): Promise<Role | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    // PLATFORM_ADMIN
    if (user.role === Role.PLATFORM_ADMIN) {
      return Role.PLATFORM_ADMIN;
    }

    // BUSINESS_OWNER
    if (user.role === Role.BUSINESS_OWNER) {
      const tenant = await this.tenantRepository.findOne({
        where: { ownerId: userId },
      });

      if (tenant) {
        const business = await this.businessRepository.findOne({
          where: { id: businessId },
        });

        if (business?.tenant_id === tenant.id) {
          return Role.BUSINESS_OWNER;
        }
      }
    }

    // Check membership
    const member = await this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId, is_active: true },
    });

    return member?.role || null;
  }

  /**
   * Get user's permissions in a specific business
   */
  async getUserPermissionsInBusiness(
    userId: string,
    businessId: string,
  ): Promise<string | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    // PLATFORM_ADMIN has all permissions
    if (user.role === Role.PLATFORM_ADMIN) {
      return 'cudakp';
    }

    // Check membership for permissions
    const member = await this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId, is_active: true },
    });

    return member?.permissions || null;
  }

  /**
   * Validate if a user can perform a specific action in a business
   */
  async validateUserPermission(
    userId: string,
    businessId: string,
    requiredPermission: number, // PermissionType enum value
  ): Promise<boolean> {
    const permissions = await this.getUserPermissionsInBusiness(userId, businessId);
    
    if (!permissions) {
      return false;
    }

    return PermissionUtil.hasPermission(permissions, requiredPermission);
  }

  /**
   * Get business member with full details including permissions
   */
  async getBusinessMemberDetails(
    businessId: string,
    userId: string,
  ): Promise<BusinessMember | null> {
    return this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId },
      relations: ['user', 'business'],
    });
  }

  /**
   * Bulk update permissions for multiple members (admin utility)
   */
  async bulkUpdatePermissions(
    businessId: string,
    updates: Array<{ userId: string; permissions: string }>,
  ): Promise<{ updated: number; failed: number; errors: string[] }> {
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    // Verify business exists
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    for (const update of updates) {
      try {
        // Validate permission string
        if (!PermissionUtil.validatePermissionString(update.permissions)) {
          errors.push(`Invalid permission string for user ${update.userId}: ${update.permissions}`);
          failed++;
          continue;
        }

        // Find and update member
        const member = await this.businessMemberRepository.findOne({
          where: { business_id: businessId, user_id: update.userId },
        });

        if (!member) {
          errors.push(`Member not found: ${update.userId}`);
          failed++;
          continue;
        }

        member.permissions = update.permissions;
        await this.businessMemberRepository.save(member);
        updated++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Error updating user ${update.userId}: ${errorMessage}`);
        failed++;
      }
    }

    console.log(`Bulk permission update completed:`, {
      businessId,
      totalRequests: updates.length,
      updated,
      failed,
      errors: errors.length
    });

    return { updated, failed, errors };
  }
}
