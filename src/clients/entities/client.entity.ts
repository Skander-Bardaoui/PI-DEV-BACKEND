// src/clients/entities/client.entity.ts
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

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column()
  name: string;

  @Column() 
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'json', nullable: true })
  address: object; // { street, city, postal_code, country }

  @Column({ type: 'int', nullable: true })
  payment_terms: number; // Payment terms in days (e.g., 30)

  @Column({ type: 'json', nullable: true })
  billing_details: object; // { tax_id, bank_account, etc. }

  @Column({ type: 'json', nullable: true })
  communication_history: object; // Array of communication logs

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}   