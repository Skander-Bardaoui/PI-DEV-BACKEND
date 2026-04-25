// src/collaboration/guards/collaboration-permission.guard.ts
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
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { Task } from '../entities/task.entity';
import { PermissionType, PermissionUtil } from '../../businesses/utils/permission.util';

export const PERMISSION_KEY = 'permission';

@Injectable()
export class CollaborationPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(BusinessMember)
    private businessMemberRepository: Repository<BusinessMember>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
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

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Platform admin has all permissions
    if (user.role === Role.PLATFORM_ADMIN) {
      return true;
    }

    // Extract businessId from different sources
    let businessId: string | null = null;

    // 1. Try to get from route params (e.g., /checkins/business/:businessId/today)
    if (request.params.businessId) {
      businessId = request.params.businessId;
    }

    // 2. Try to get from request body (e.g., POST /tasks with { businessId: '...' })
    if (!businessId && request.body?.businessId) {
      businessId = request.body.businessId;
    }

    // 3. For update/delete operations, fetch businessId from the task
    if (!businessId && request.params.id) {
      const task = await this.taskRepository.findOne({
        where: { id: request.params.id },
      });

      if (task) {
        businessId = task.businessId;
      }
    }

    if (!businessId) {
      throw new ForbiddenException('Business context required');
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
