// src/businesses/guards/permission.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../users/enums/role.enum';
import { BusinessMember } from '../entities/business-member.entity';
import { PermissionType, PermissionUtil } from '../utils/permission.util';

export const PERMISSION_KEY = 'permission';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(BusinessMember)
    private businessMemberRepository: Repository<BusinessMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<PermissionType>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // If no permission requirement, allow access
    if (requiredPermission === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const businessId = request.params.id || request.params.businessId;

    if (!user || !businessId) {
      throw new ForbiddenException('Authentication or business context required');
    }

    // Platform admin has all permissions
    if (user.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Get business membership
    const membership = await this.businessMemberRepository.findOne({
      where: {
        business_id: businessId,
        user_id: user.id,
        is_active: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this business');
    }

    // Check permission
    const hasPermission = PermissionUtil.hasPermission(
      membership.permissions,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}