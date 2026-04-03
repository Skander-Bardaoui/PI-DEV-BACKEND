import {
  Injectable, NotFoundException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account }                    from '../entities/account.entity';
import { SupplierPayment }            from '../entities/supplier-payment.entity';
import { TransactionType }            from '../enums/transaction-type.enum';
import { InvoiceStatus }              from 'src/Purchases/enum/invoice-status.enum';
import { PurchaseInvoice }            from 'src/Purchases/entities/purchase-invoice.entity';

import { Transaction }                from '../entities/transaction.entity';
import { PaymentSchedule } from '../entities/payment-schedule';
import { PaymentScheduleInstallment } from '../entities/payment-schedule-installment';
import { CreatePaymentScheduleDto, PayInstallmentDto } from '../dto/payment-schedule';
import { InstallmentStatus } from '../enums/installment-status';

@Injectable()
export class PaymentScheduleService {
  constructor(
    @InjectRepository(PaymentSchedule)
    private readonly scheduleRepo: Repository<PaymentSchedule>,

    @InjectRepository(PaymentScheduleInstallment)
    private readonly installmentRepo: Repository<PaymentScheduleInstallment>,

    @InjectRepository(PurchaseInvoice)
    private readonly invoiceRepo: Repository<PurchaseInvoice>,

    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,

    private readonly dataSource: DataSource,
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // CREATE SCHEDULE
  // ──────────────────────────────────────────────────────────────────
  async createSchedule(
    businessId: string,
    userId: string,
    dto: CreatePaymentScheduleDto,
  ): Promise<PaymentSchedule> {
    return this.dataSource.transaction(async (manager) => {

      const invoice = await manager.findOne(PurchaseInvoice, {
        where: { id: dto.purchase_invoice_id, business_id: businessId },
      });
      if (!invoice) throw new NotFoundException('Purchase invoice not found');

      const payable = [
        InvoiceStatus.APPROVED,
        InvoiceStatus.PARTIALLY_PAID,
        InvoiceStatus.OVERDUE,
      ];
      if (!payable.includes(invoice.status)) {
        throw new BadRequestException(
          `Invoice status "${invoice.status}" is not payable`,
        );
      }

      const existing = await manager.findOne(PaymentSchedule, {
        where: { purchase_invoice_id: dto.purchase_invoice_id, business_id: businessId },
      });
      if (existing) {
        throw new ConflictException(
          'A payment schedule already exists for this invoice',
        );
      }

      const remaining = this.round(
        Number(invoice.net_amount) - Number(invoice.paid_amount),
      );
      const scheduleTotal = this.round(
        dto.installments.reduce((s, i) => s + i.amount, 0),
      );
      if (scheduleTotal > remaining + 0.005) {
        throw new BadRequestException(
          `Installment total (${scheduleTotal}) exceeds remaining balance (${remaining})`,
        );
      }

      const schedule = manager.create(PaymentSchedule, {
        business_id:         businessId,
        purchase_invoice_id: dto.purchase_invoice_id,
        total_amount:        scheduleTotal,
        notes:               dto.notes ?? null,
        created_by:          userId,
      });
      const savedSchedule = await manager.save(PaymentSchedule, schedule);

      const lines = dto.installments.map((line, idx) =>
        manager.create(PaymentScheduleInstallment, {
          schedule_id:        savedSchedule.id,
          installment_number: idx + 1,
          due_date:           new Date(line.due_date),
          amount:             line.amount,
          payment_method:     line.payment_method,
          reference:          line.reference ?? null,
          notes:              line.notes ?? null,
          status:             InstallmentStatus.PENDING,
        }),
      );
      await manager.save(PaymentScheduleInstallment, lines);

      return manager.findOne(PaymentSchedule, {
        where: { id: savedSchedule.id },
        relations: ['installments', 'purchase_invoice'],
      }) as Promise<PaymentSchedule>;
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // PAY ONE INSTALLMENT
  // ──────────────────────────────────────────────────────────────────
  async payInstallment(
    businessId: string,
    userId: string,
    scheduleId: string,
    installmentId: string,
    dto: PayInstallmentDto,
  ): Promise<PaymentScheduleInstallment> {
    return this.dataSource.transaction(async (manager) => {

      const installment = await manager.findOne(PaymentScheduleInstallment, {
        where: { id: installmentId, schedule_id: scheduleId },
        relations: ['schedule', 'schedule.purchase_invoice'],
      });
      if (!installment) throw new NotFoundException('Installment not found');
      if (installment.schedule.business_id !== businessId) {
        throw new NotFoundException('Schedule not found in this business');
      }
      if (installment.status === InstallmentStatus.PAID) {
        throw new BadRequestException('Installment already paid');
      }
      if (installment.status === InstallmentStatus.CANCELLED) {
        throw new BadRequestException('Installment is cancelled');
      }

      const previous = await manager.find(PaymentScheduleInstallment, {
        where: { schedule_id: scheduleId },
        order: { installment_number: 'ASC' },
      });
      const unpaidBefore = previous.filter(
        (i) =>
          i.installment_number < installment.installment_number &&
          i.status !== InstallmentStatus.PAID &&
          i.status !== InstallmentStatus.CANCELLED,
      );
      if (unpaidBefore.length > 0) {
        throw new BadRequestException(
          `Installment #${unpaidBefore[0].installment_number} must be paid first`,
        );
      }

      const account = await manager.findOne(Account, {
        where: { id: dto.account_id, business_id: businessId, is_active: true },
      });
      if (!account) throw new NotFoundException('Account not found or inactive');
      if (Number(account.current_balance) < Number(installment.amount)) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${account.current_balance}`,
        );
      }

      const paymentNumber = await this.generatePaymentNumber(businessId, manager);

      const invoice = installment.schedule.purchase_invoice;
      const supplierPayment = manager.create(SupplierPayment, {
        business_id:         businessId,
        supplier_id:         invoice.supplier_id,
        purchase_invoice_id: invoice.id,
        account_id:          dto.account_id,
        payment_number:      paymentNumber,
        payment_date:        new Date(dto.paid_at ?? new Date().toISOString().slice(0, 10)),
        amount:              installment.amount,
        payment_method:      dto.payment_method,
        reference:           dto.reference ?? null,
        notes:               dto.notes ?? `Installment #${installment.installment_number}`,
        created_by:          userId,
      });
      const savedPayment = await manager.save(SupplierPayment, supplierPayment);

      installment.status              = InstallmentStatus.PAID;
      installment.account_id          = dto.account_id;
      installment.payment_method      = dto.payment_method;
      installment.paid_at             = new Date(dto.paid_at ?? new Date().toISOString().slice(0, 10));
      installment.reference           = dto.reference ?? null;
      installment.notes               = dto.notes ?? installment.notes;
      installment.supplier_payment_id = savedPayment.id;
      await manager.save(PaymentScheduleInstallment, installment);

      account.current_balance = this.round(
        Number(account.current_balance) - Number(installment.amount),
      );
      await manager.save(Account, account);

      // ✅ FIX: separated create and save to avoid overload error
      const transaction = manager.create(Transaction, {
      business_id:         businessId,
      account_id:          dto.account_id,
      type:                TransactionType.DECAISSEMENT,
      amount:              installment.amount,
      transaction_date:    dto.paid_at ?? new Date().toISOString().slice(0, 10),
      description:         `Installment #${installment.installment_number} — ${invoice.invoice_number_supplier}`,
      reference:           dto.reference ?? null,
      notes:               dto.notes ?? null,
      related_entity_type: 'PaymentScheduleInstallment',
      related_entity_id:   installment.id,
      is_reconciled:       false,
      created_by:          userId,
    } as unknown as Transaction);
    await manager.save(Transaction, transaction);

      const newPaid = this.round(
        Number(invoice.paid_amount) + Number(installment.amount),
      );
      invoice.paid_amount = newPaid;
      if (newPaid >= Number(invoice.net_amount) - 0.005) {
        invoice.status = InvoiceStatus.PAID;
      } else {
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      }
      await manager.save(PurchaseInvoice, invoice);

      return installment;
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // READ
  // ──────────────────────────────────────────────────────────────────
  async findByInvoice(businessId: string, invoiceId: string): Promise<PaymentSchedule | null> {
    return this.scheduleRepo.findOne({
      where: { business_id: businessId, purchase_invoice_id: invoiceId },
      relations: ['installments', 'purchase_invoice'],
      order: { installments: { installment_number: 'ASC' } } as any,
    });
  }

  async findOne(businessId: string, scheduleId: string): Promise<PaymentSchedule> {
    const s = await this.scheduleRepo.findOne({
      where: { id: scheduleId, business_id: businessId },
      relations: ['installments', 'purchase_invoice'],
      order: { installments: { installment_number: 'ASC' } } as any,
    });
    if (!s) throw new NotFoundException('Payment schedule not found');
    return s;
  }

  // ──────────────────────────────────────────────────────────────────
  // MARK OVERDUE
  // ──────────────────────────────────────────────────────────────────
  async markOverdue(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.installmentRepo
      .createQueryBuilder()
      .update(PaymentScheduleInstallment)
      .set({ status: InstallmentStatus.OVERDUE })
      .where('status = :s AND due_date < :today', {
        s: InstallmentStatus.PENDING,
        today,
      })
      .execute();
  }

  // ──────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────
  private async generatePaymentNumber(businessId: string, manager: any): Promise<string> {
    const year   = new Date().getFullYear();
    const prefix = `PAY-${year}-`;
    const result = await manager.query(
      `SELECT COALESCE(
         MAX(CAST(SUBSTRING(payment_number FROM ${prefix.length + 1}) AS INTEGER)), 0
       ) + 1 AS next_seq
       FROM supplier_payments
       WHERE business_id = $1 AND payment_number LIKE $2`,
      [businessId, `${prefix}%`],
    );
    return `${prefix}${String(result[0]?.next_seq ?? 1).padStart(4, '0')}`;
  }

  private round(v: number): number {
    return Math.round(v * 1000) / 1000;
  }
}
