// src/platform-admin/services/tenant-management.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, Not } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantApproval } from '../entities/tenant-approval.entity';
import { Subscription } from '../entities/subscription.entity';
import { ImpersonationLog } from '../entities/impersonation-log.entity';
import { User } from '../../users/entities/user.entity';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { Business } from '../../businesses/entities/business.entity';
import { EmailService } from '../../email/email.service';
import { TenantQueryDto } from '../dto/tenant-query.dto';
import { RejectTenantDto } from '../dto/reject-tenant.dto';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

@Injectable()
export class TenantManagementService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantApproval)
    private readonly approvalRepo: Repository<TenantApproval>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(ImpersonationLog)
    private readonly impersonationLogRepo: Repository<ImpersonationLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(BusinessMember)
    private readonly businessMemberRepo: Repository<BusinessMember>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── List Tenants ────────────────────────────────────────────────────────
  async listTenants(query: TenantQueryDto) {
    try {
      const { page = 1, limit = 20, search, status, planSlug } = query;

      // Get all tenants with owner
      let allTenants = await this.tenantRepo.find({
        where: { deleted_at: IsNull() },
        relations: ['owner'],
        order: {
          createdAt: 'DESC',
        },
      });

      // Apply search filter in memory
      if (search) {
        const searchLower = search.toLowerCase();
        allTenants = allTenants.filter(tenant => 
          tenant.name?.toLowerCase().includes(searchLower) ||
          tenant.owner?.email?.toLowerCase().includes(searchLower) ||
          tenant.owner?.firstName?.toLowerCase().includes(searchLower) ||
          tenant.owner?.lastName?.toLowerCase().includes(searchLower)
        );
      }

      // Get additional data for each tenant
      const tenantsWithData = await Promise.all(
        allTenants.map(async (tenant) => {
          // Get approval
          const approval = await this.approvalRepo.findOne({
            where: { tenant_id: tenant.id },
          });

          // Get subscription
          const subscription = await this.subscriptionRepo.findOne({
            where: { tenant_id: tenant.id },
            relations: ['plan'],
          });

          // Get counts
          const businessCount = await this.businessRepo.count({
            where: { tenant_id: tenant.id },
          });

          let memberCount = 0;
          try {
            const businesses = await this.businessRepo.find({
              where: { tenant_id: tenant.id },
              select: ['id'],
            });
            
            if (businesses.length > 0) {
              const businessIds = businesses.map(b => b.id);
              for (const businessId of businessIds) {
                const count = await this.businessMemberRepo.count({
                  where: { business_id: businessId },
                });
                memberCount += count;
              }
            }
          } catch (err) {
            console.error('Error counting members:', err);
          }

          // Determine overall status
          let overallStatus = 'inactive';
          if (approval?.status === ApprovalStatus.PENDING) {
            overallStatus = 'pending';
          } else if (approval?.status === ApprovalStatus.REJECTED) {
            overallStatus = 'rejected';
          } else if (approval?.status === ApprovalStatus.APPROVED) {
            if (subscription?.status === SubscriptionStatus.SUSPENDED) {
              overallStatus = 'suspended';
            } else if (subscription?.status === SubscriptionStatus.ACTIVE || subscription?.status === SubscriptionStatus.TRIAL) {
              overallStatus = 'active';
            }
          }

          return {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
            owner: tenant.owner,
            approval,
            subscription,
            memberCount,
            businessCount,
            status: overallStatus,
            billingPlan: subscription?.plan?.name || 'Free',
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
          };
        })
      );

      // Apply status filter
      let filteredTenants = tenantsWithData;
      if (status) {
        filteredTenants = filteredTenants.filter(t => t.status === status);
      }

      // Apply plan filter
      if (planSlug) {
        filteredTenants = filteredTenants.filter(t => t.subscription?.plan?.slug === planSlug);
      }

      // Pagination
      const total = filteredTenants.length;
      const skip = (page - 1) * limit;
      const paginatedTenants = filteredTenants.slice(skip, skip + limit);

      return {
        data: paginatedTenants,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in listTenants:', error);
      throw error;
    }
  }

  // ─── Get Tenant Detail ───────────────────────────────────────────────────
  async getTenantDetail(id: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['owner'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const approval = await this.approvalRepo.findOne({
      where: { tenant_id: id },
      relations: ['reviewed_by'],
    });

    const subscription = await this.subscriptionRepo.findOne({
      where: { tenant_id: id },
      relations: ['plan'],
    });

    const businesses = await this.businessRepo.find({
      where: { tenant_id: id },
    });

    const memberCount = await this.businessMemberRepo.count({
      where: { business: { tenant_id: id } },
    });

    // Determine overall status (same logic as listTenants)
    let overallStatus = 'inactive';
    if (approval?.status === ApprovalStatus.PENDING) {
      overallStatus = 'pending';
    } else if (approval?.status === ApprovalStatus.REJECTED) {
      overallStatus = 'rejected';
    } else if (approval?.status === ApprovalStatus.APPROVED) {
      if (subscription?.status === SubscriptionStatus.SUSPENDED) {
        overallStatus = 'suspended';
      } else if (subscription?.status === SubscriptionStatus.ACTIVE || subscription?.status === SubscriptionStatus.TRIAL) {
        overallStatus = 'active';
      }
    }

    return {
      ...tenant,
      approval,
      subscription,
      businesses,
      memberCount,
      status: overallStatus, // Add the calculated status
    };
  }

  // ─── Approve Tenant ──────────────────────────────────────────────────────
  async approveTenant(tenantId: string, adminId: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['owner'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const approval = await this.approvalRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!approval) {
      throw new NotFoundException('Tenant approval record not found');
    }

    if (approval.status === ApprovalStatus.APPROVED) {
      throw new BadRequestException('Tenant is already approved');
    }

    approval.status = ApprovalStatus.APPROVED;
    approval.reviewed_by_id = adminId;
    approval.reviewed_at = new Date();
    await this.approvalRepo.save(approval);

    // Send welcome email
    const fullName = `${tenant.owner.firstName} ${tenant.owner.lastName}`;
    await this.emailService.sendWelcomeEmail(tenant.owner.email, fullName);

    return { message: 'Tenant approved successfully' };
  }

  // ─── Reject Tenant ───────────────────────────────────────────────────────
  async rejectTenant(tenantId: string, adminId: string, dto: RejectTenantDto) {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['owner'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const approval = await this.approvalRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!approval) {
      throw new NotFoundException('Tenant approval record not found');
    }

    approval.status = ApprovalStatus.REJECTED;
    approval.reviewed_by_id = adminId;
    approval.reviewed_at = new Date();
    approval.rejection_reason = dto.reason;
    await this.approvalRepo.save(approval);

    // Send rejection email
    const fullName = `${tenant.owner.firstName} ${tenant.owner.lastName}`;
    await this.emailService.sendTenantRejectionEmail(tenant.owner.email, fullName, dto.reason);

    return { message: 'Tenant rejected successfully' };
  }

  // ─── Suspend Tenant ──────────────────────────────────────────────────────
  async suspendTenant(tenantId: string, reason?: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Suspend subscription
    subscription.status = SubscriptionStatus.SUSPENDED;
    subscription.suspended_at = new Date();
    if (reason) {
      subscription.notes = reason;
    }
    await this.subscriptionRepo.save(subscription);

    // Suspend all businesses under this tenant
    await this.businessRepo
      .createQueryBuilder()
      .update(Business)
      .set({
        is_suspended: true,
        suspended_at: new Date(),
        suspension_reason: reason || 'Tenant suspended by platform admin',
      })
      .where('tenant_id = :tenantId', { tenantId })
      .execute();

    // Suspend all business members under this tenant (in business_members table)
    await this.businessMemberRepo
      .createQueryBuilder('bm')
      .update(BusinessMember)
      .set({ is_active: false })
      .where('business_id IN (SELECT id FROM businesses WHERE tenant_id = :tenantId)', { tenantId })
      .execute();

    // Suspend all users who are members of businesses under this tenant (in users table)
    await this.userRepo
      .createQueryBuilder('u')
      .update(User)
      .set({ is_suspended: true })
      .where('id IN (SELECT user_id FROM business_members WHERE business_id IN (SELECT id FROM businesses WHERE tenant_id = :tenantId))', { tenantId })
      .execute();

    return { message: 'Tenant, all businesses, and all business members suspended successfully' };
  }

  // ─── Unsuspend Tenant ────────────────────────────────────────────────────
  async unsuspendTenant(tenantId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Unsuspend subscription
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.suspended_at = undefined;
    await this.subscriptionRepo.save(subscription);

    // Unsuspend all businesses under this tenant
    await this.businessRepo
      .createQueryBuilder()
      .update(Business)
      .set({
        is_suspended: false,
        suspended_at: undefined,
        suspension_reason: undefined,
      })
      .where('tenant_id = :tenantId', { tenantId })
      .execute();

    // Reactivate all business members under this tenant (in business_members table)
    await this.businessMemberRepo
      .createQueryBuilder('bm')
      .update(BusinessMember)
      .set({ is_active: true })
      .where('business_id IN (SELECT id FROM businesses WHERE tenant_id = :tenantId)', { tenantId })
      .execute();

    // Unsuspend all users who are members of businesses under this tenant (in users table)
    await this.userRepo
      .createQueryBuilder('u')
      .update(User)
      .set({ is_suspended: false })
      .where('id IN (SELECT user_id FROM business_members WHERE business_id IN (SELECT id FROM businesses WHERE tenant_id = :tenantId))', { tenantId })
      .execute();

    return { message: 'Tenant, all businesses, and all business members unsuspended successfully' };
  }

  // ─── Delete Tenant (Soft Delete) ─────────────────────────────────────────
  async deleteTenant(tenantId: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft delete
    tenant.deleted_at = new Date();
    await this.tenantRepo.save(tenant);

    // Also soft delete related businesses
    await this.businessRepo
      .createQueryBuilder()
      .update(Business)
      .set({ deleted_at: new Date() })
      .where('tenant_id = :tenantId', { tenantId })
      .execute();

    return { message: 'Tenant deleted successfully' };
  }

  // ─── Impersonate Tenant ──────────────────────────────────────────────────
  async impersonateTenant(tenantId: string, adminId: string, ip: string, userAgent?: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['owner'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Find the business owner user
    const owner = tenant.owner;

    if (!owner) {
      throw new NotFoundException('Tenant owner not found');
    }

    // Find business_id for the owner
    const business = await this.businessRepo.findOne({
      where: { tenant_id: tenantId },
      order: { created_at: 'ASC' },
    });

    // Generate short-lived impersonation token (1 hour)
    const payload = {
      sub: owner.id,
      email: owner.email,
      role: owner.role,
      business_id: business?.id || null,
      impersonated_by: adminId,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '1h',
    });

    // Log impersonation
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.impersonationLogRepo.save({
      admin_id: adminId,
      tenant_id: tenantId,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: expiresAt,
    });

    return {
      token,
      user: {
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: owner.role,
      },
      expiresAt,
    };
  }
}
