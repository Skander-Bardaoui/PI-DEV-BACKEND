// src/platform-admin/services/subscription-management.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../entities/plan.entity';
import { SubscriptionQueryDto } from '../dto/subscription-query.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { BillingCycle } from '../enums/billing-cycle.enum';

@Injectable()
export class SubscriptionManagementService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  // ─── List Subscriptions ──────────────────────────────────────────────────
  async listSubscriptions(query: SubscriptionQueryDto) {
    const { page = 1, limit = 20, status, planSlug, sortBy = 'created_at', sortOrder = 'DESC' } = query;

    const queryBuilder = this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.tenant', 'tenant')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('tenant.owner', 'owner');

    // Status filter
    if (status) {
      queryBuilder.andWhere('subscription.status = :status', { status });
    }

    // Plan filter
    if (planSlug) {
      queryBuilder.andWhere('plan.slug = :planSlug', { planSlug });
    }

    // Sorting
    const validSortFields = ['created_at', 'current_period_end', 'trial_ends_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    queryBuilder.orderBy(`subscription.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [subscriptions, total] = await queryBuilder.getManyAndCount();

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Get Overdue Subscriptions ───────────────────────────────────────────
  async getOverdueSubscriptions() {
    const now = new Date();

    const overdueSubscriptions = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.tenant', 'tenant')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('tenant.owner', 'owner')
      .where(
        '(subscription.status = :overdueStatus) OR ' +
        '(subscription.status = :trialStatus AND subscription.trial_ends_at < :now)',
        {
          overdueStatus: SubscriptionStatus.OVERDUE,
          trialStatus: SubscriptionStatus.TRIAL,
          now,
        }
      )
      .getMany();

    return overdueSubscriptions;
  }

  // ─── Update Subscription ─────────────────────────────────────────────────
  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // If changing plan, validate it exists
    if (dto.plan_id) {
      const plan = await this.planRepo.findOne({
        where: { id: dto.plan_id, is_active: true },
      });

      if (!plan) {
        throw new BadRequestException('Plan not found or inactive');
      }
    }

    // Update fields
    Object.assign(subscription, dto);

    // Convert date strings to Date objects
    if (dto.current_period_start) {
      subscription.current_period_start = new Date(dto.current_period_start);
    }
    if (dto.current_period_end) {
      subscription.current_period_end = new Date(dto.current_period_end);
    }
    if (dto.trial_ends_at) {
      subscription.trial_ends_at = new Date(dto.trial_ends_at);
    }
    if (dto.next_billing_at) {
      subscription.next_billing_at = new Date(dto.next_billing_at);
    }

    await this.subscriptionRepo.save(subscription);

    return await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['tenant', 'plan'],
    });
  }

  // ─── Mark Subscription as Paid ───────────────────────────────────────────
  async markAsPaid(id: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Calculate next billing period
    const now = new Date();
    const nextBilling = new Date(now);

    if (subscription.billing_cycle === BillingCycle.MONTHLY) {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.last_payment_at = now;
    subscription.current_period_start = now;
    subscription.current_period_end = nextBilling;
    subscription.next_billing_at = nextBilling;
    subscription.suspended_at = undefined;
    subscription.cancelled_at = undefined;

    await this.subscriptionRepo.save(subscription);

    return subscription;
  }

  // ─── Get Subscriptions for Scheduled Jobs ───────────────────────────────
  async getTrialExpiringSubscriptions() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    return await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.TRIAL,
        trial_ends_at: LessThan(tomorrow),
      },
      relations: ['tenant', 'tenant.owner'],
    });
  }

  async getExpiredActiveSubscriptions() {
    const now = new Date();

    return await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        current_period_end: LessThan(now),
      },
      relations: ['tenant', 'tenant.owner'],
    });
  }

  async getLongSuspendedSubscriptions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.SUSPENDED,
        suspended_at: LessThan(thirtyDaysAgo),
      },
      relations: ['tenant', 'tenant.owner'],
    });
  }

  // ─── Update Subscription Status (for scheduled jobs) ────────────────────
  async updateSubscriptionStatus(id: string, status: SubscriptionStatus) {
    await this.subscriptionRepo.update(id, { status });
  }
}