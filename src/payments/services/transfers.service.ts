import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account }         from '../entities/account.entity';
import { Transaction }     from '../entities/transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { Role } from '../../users/enums/role.enum';
import { PermissionUtil } from '../../businesses/utils/permission.util';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,

    private readonly dataSource: DataSource,
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

  async create(businessId: string, userId: string, dto: any): Promise<{
    debit: Transaction;
    credit: Transaction;
  }> {
    // Check permission
    const hasPermission = await this.hasPaymentPermission(
      userId,
      businessId,
      'create_transfer',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create transfers',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Vérifier compte source
      const fromAccount = await manager.findOne(Account, {
        where: { id: dto.from_account_id, business_id: businessId, is_active: true },
      });
      if (!fromAccount) throw new NotFoundException('Source account not found or inactive');

      // 2. Vérifier compte destination
      const toAccount = await manager.findOne(Account, {
        where: { id: dto.to_account_id, business_id: businessId, is_active: true },
      });
      if (!toAccount) throw new NotFoundException('Destination account not found or inactive');

      // 3. Vérifier solde suffisant
      if (Number(fromAccount.current_balance) < dto.amount) {
        throw new BadRequestException(
          `Solde insuffisant. Disponible: ${fromAccount.current_balance}`,
        );
      }

      // 4. Débiter le compte source
      fromAccount.current_balance = Number(fromAccount.current_balance) - dto.amount;
      await manager.save(Account, fromAccount);

      // 5. Créditer le compte destination
      toAccount.current_balance = Number(toAccount.current_balance) + dto.amount;
      await manager.save(Account, toAccount);

      const description = `Virement de ${fromAccount.name} vers ${toAccount.name}`;

      // 6. Créer transaction DECAISSEMENT sur compte source
      const debit = manager.create(Transaction, {
        business_id: businessId,
        account_id: dto.from_account_id,
        type: TransactionType.DECAISSEMENT,
        amount: dto.amount,
        transaction_date: dto.transfer_date,
        description,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
        related_entity_type: 'Transfer',
        related_entity_id: dto.to_account_id,
        is_reconciled: false,
        created_by: userId,
      });
      await manager.save(Transaction, debit);

      // 7. Créer transaction ENCAISSEMENT sur compte destination
      const credit = manager.create(Transaction, {
        business_id: businessId,
        account_id: dto.to_account_id,
        type: TransactionType.ENCAISSEMENT,
        amount: dto.amount,
        transaction_date: dto.transfer_date,
        description,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
        related_entity_type: 'Transfer',
        related_entity_id: dto.from_account_id,
        is_reconciled: false,
        created_by: userId,
      });
      await manager.save(Transaction, credit);

      return { debit, credit };
    });
  }
}
