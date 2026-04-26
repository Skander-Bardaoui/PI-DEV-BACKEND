// src/accounts/services/accounts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { Role } from '../../users/enums/role.enum';
import { PermissionUtil } from '../../businesses/utils/permission.util';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,

    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
  ) {}

  // Check if user has payment permission
  private async hasPaymentPermission(
    userId: string,
    businessId: string,
    permissionKey: string,
  ): Promise<boolean> {
    const member = await this.memberRepo.findOne({
      where: { user_id: userId, business_id: businessId, is_active: true },
      relations: ['user'],
    });

    if (!member) {
      return false;
    }

    // BUSINESS_OWNER always has full access
    if (member.role === Role.BUSINESS_OWNER) {
      return true;
    }

    // Check granular permission
    return PermissionUtil.hasGranularPermission(
      member.payment_permissions,
      permissionKey,
    );
  }

  async create(businessId: string, userId: string, dto: CreateAccountDto): Promise<Account> {
    // Check permission
    const hasPermission = await this.hasPaymentPermission(
      userId,
      businessId,
      'create_account',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create accounts',
      );
    }

    if (dto.is_default) {
      await this.accountRepo.update(
        { business_id: businessId, is_default: true },
        { is_default: false },
      );
    }

    const account = this.accountRepo.create({
      ...dto,
      business_id: businessId,
      current_balance: dto.opening_balance ?? 0,
    });

    return this.accountRepo.save(account);
  }

  async findAll(businessId: string): Promise<Account[]> {
    return this.accountRepo.find({
      where: { business_id: businessId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(businessId: string, id: string): Promise<Account> {
    const account = await this.accountRepo.findOne({
      where: { id, business_id: businessId },
    });

    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(
    businessId: string,
    userId: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<Account> {
    // Check permission
    const hasPermission = await this.hasPaymentPermission(
      userId,
      businessId,
      'update_account',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update accounts',
      );
    }

    const account = await this.findOne(businessId, id);

    if (dto.is_default) {
      await this.accountRepo.update(
        { business_id: businessId, is_default: true },
        { is_default: false },
      );
    }

    // Destructure to handle balances explicitly:
    // - opening_balance is NEVER changed after creation
    // - current_balance is updated only if explicitly provided
    const { opening_balance, current_balance, ...safeDto } = dto as any;

    Object.assign(account, safeDto);

    if (current_balance !== undefined) {
      account.current_balance = current_balance;
    }

    return this.accountRepo.save(account);
  }

  async toggleActive(businessId: string, userId: string, id: string): Promise<Account> {
    // Check permission - deleting/deactivating requires delete permission
    const hasPermission = await this.hasPaymentPermission(
      userId,
      businessId,
      'delete_account',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to deactivate accounts',
      );
    }

    const account = await this.findOne(businessId, id);

    if (account.is_default && account.is_active) {
      throw new BadRequestException('Cannot deactivate the default account');
    }

    account.is_active = !account.is_active;
    return this.accountRepo.save(account);
  }

  async getBalance(businessId: string, id: string): Promise<{
    account: Account;
    current_balance: number;
    opening_balance: number;
  }> {
    const account = await this.findOne(businessId, id);
    return {
      account,
      current_balance: Number(account.current_balance),
      opening_balance: Number(account.opening_balance),
    };
  }

  async getTotalBalance(businessId: string): Promise<{
    total: number;
    by_account: { id: string; name: string; balance: number; type: string }[];
  }> {
    const accounts = await this.accountRepo.find({
      where: { business_id: businessId, is_active: true },
    });

    const by_account = accounts.map((a) => ({
      id: a.id,
      name: a.name,
      balance: Number(a.current_balance),
      type: a.type,
    }));

    const total = by_account.reduce((sum, a) => sum + a.balance, 0);

    return { total, by_account };
  }
}
