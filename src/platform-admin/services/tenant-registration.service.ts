// src/platform-admin/services/tenant-registration.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantApproval } from '../entities/tenant-approval.entity';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../entities/plan.entity';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { BillingCycle } from '../enums/billing-cycle.enum';

@Injectable()
export class TenantRegistrationService {
  constructor(
    @InjectRepository(TenantApproval)
    private readonly approvalRepo: Repository<TenantApproval>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  // ─── Create Approval and Subscription for New Tenant ────────────────────
  async createTenantApprovalAndSubscription(tenantId: string) {
    // Create tenant approval with pending status
    const approval = this.approvalRepo.create({
      tenant_id: tenantId,
      status: ApprovalStatus.PENDING,
    });
    await this.approvalRepo.save(approval);

    // Find the free plan
    const freePlan = await this.planRepo.findOne({
      where: { slug: 'free', is_active: true },
    });

    if (!freePlan) {
      throw new Error('Free plan not found. Please create a free plan first.');
    }

    // Create trial subscription
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    const subscription = this.subscriptionRepo.create({
      tenant_id: tenantId,
      plan_id: freePlan.id,
      status: SubscriptionStatus.TRIAL,
      billing_cycle: BillingCycle.MONTHLY,
      current_period_start: now,
      current_period_end: trialEnd,
      trial_ends_at: trialEnd,
      next_billing_at: trialEnd,
    });

    await this.subscriptionRepo.save(subscription);

    return { approval, subscription };
  }

  // ─── Check if Tenant Can Login ───────────────────────────────────────────
  async checkTenantLoginPermission(tenantId: string): Promise<{ canLogin: boolean; message?: string }> {
    // Check approval status
    const approval = await this.approvalRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!approval || approval.status !== ApprovalStatus.APPROVED) {
      return {
        canLogin: false,
        message: 'Account pending approval',
      };
    }

    // Check subscription status
    const subscription = await this.subscriptionRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (!subscription) {
      return {
        canLogin: false,
        message: 'No active subscription found',
      };
    }

    if (subscription.status === SubscriptionStatus.SUSPENDED) {
      return {
        canLogin: false,
        message: 'Account suspended. Contact support.',
      };
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      return {
        canLogin: false,
        message: 'Subscription cancelled.',
      };
    }

    return { canLogin: true };
  }
}