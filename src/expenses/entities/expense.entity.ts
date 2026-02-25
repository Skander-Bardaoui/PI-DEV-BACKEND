// src/expenses/entities/expense.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}




@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column()
  user_id: string; // Person who submitted the expense

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  category_id: string;

  @ManyToOne(() => ExpenseCategory, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column({ nullable: true })
  vendor: string;

@Column({ type: 'varchar', nullable: true })
receipt_url: string | null;


  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.DRAFT,
  })
  status: ExpenseStatus;

  @Column({ type: 'text', nullable: true })
  approval_notes: string; // Notes from approver

  @Column({ nullable: true })
  approved_by: string; // User ID who approved/rejected

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}