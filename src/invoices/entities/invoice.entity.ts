// src/invoices/entities/invoice.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { Client } from '../../clients/entities/client.entity';
import { InvoiceItem } from './invoice-item.entity';


export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column()
  client_id: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ unique: true })
  invoice_number: string; // e.g., "INV-2026-001"

  @Column({ type: 'date' })
  date: Date; // Invoice issue date

  @Column({ type: 'date' })
  due_date: Date; // Payment due date

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  subtotal: number; // Sum of all items before tax

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tax_rate: number; // Tax rate applied (e.g., 19.00)

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  tax: number; // Calculated tax amount

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  total: number; // subtotal + tax

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  pdf_url: string; // URL to generated PDF

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 