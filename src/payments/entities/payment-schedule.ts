import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { PurchaseInvoice }          from 'src/Purchases/entities/purchase-invoice.entity';
import { PaymentScheduleInstallment } from './payment-schedule-installment';


@Entity('payment_schedules')
export class PaymentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @Column({ type: 'uuid' })
  purchase_invoice_id: string;

  @ManyToOne(() => PurchaseInvoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_invoice_id' })
  purchase_invoice: PurchaseInvoice;

  /** Total amount covered by this schedule */
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  total_amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @OneToMany(
    () => PaymentScheduleInstallment,
    (i) => i.schedule,
    { cascade: true, eager: true },
  )
  installments: PaymentScheduleInstallment[];

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
