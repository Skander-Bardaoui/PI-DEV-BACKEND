import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecurringInvoicePaymentsService } from './recurring-invoice-payments.service';
import { RecurringInvoice } from '../../sales/entities/recurring-invoice.entity';
import { Account } from '../entities/account.entity';
import { TransactionsService } from './transactions.service';
import { EmailService } from '../../email/email.service';

describe('RecurringInvoicePaymentsService', () => {
  let service: RecurringInvoicePaymentsService;
  let recurringInvoiceRepo: Repository<RecurringInvoice>;
  let accountRepo: Repository<Account>;
  let transactionsService: TransactionsService;
  let dataSource: DataSource;
  let emailService: EmailService;

  const mockRecurringInvoice = {
    id: 'invoice-1',
    business_id: 'business-1',
    client_id: 'client-1',
    description: 'Monthly subscription',
    amount: 1000,
    tax_rate: 19,
    frequency: 'MONTHLY',
    invoices_generated: 5,
    last_generated_date: new Date('2024-01-01'),
    next_invoice_date: new Date('2024-02-01'),
    discount_type: null,
    discount_value: null,
    notes: null,
    client: {
      id: 'client-1',
      name: 'Test Client',
      email: 'client@test.com',
    },
  };

  const mockAccount = {
    id: 'account-1',
    business_id: 'business-1',
    name: 'Main Account',
    current_balance: 5000,
    currency: 'TND',
    is_active: true,
  };

  beforeEach(async () => {
    const mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringInvoicePaymentsService,
        {
          provide: getRepositoryToken(RecurringInvoice),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            transporter: mockTransporter,
          },
        },
      ],
    }).compile();

    service = module.get<RecurringInvoicePaymentsService>(RecurringInvoicePaymentsService);
    recurringInvoiceRepo = module.get(getRepositoryToken(RecurringInvoice));
    accountRepo = module.get(getRepositoryToken(Account));
    transactionsService = module.get(TransactionsService);
    dataSource = module.get(DataSource);
    emailService = module.get(EmailService);
  });

  describe('findAll', () => {
    it('should return all recurring invoices for business', async () => {
      jest.spyOn(recurringInvoiceRepo, 'find').mockResolvedValue([mockRecurringInvoice] as any);

      const result = await service.findAll('business-1');

      expect(result).toEqual([mockRecurringInvoice]);
      expect(recurringInvoiceRepo.find).toHaveBeenCalledWith({
        where: { business_id: 'business-1' },
        relations: ['client'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return single recurring invoice', async () => {
      jest.spyOn(recurringInvoiceRepo, 'findOne').mockResolvedValue(mockRecurringInvoice as any);

      const result = await service.findOne('business-1', 'invoice-1');

      expect(result).toEqual(mockRecurringInvoice);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(recurringInvoiceRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('business-1', 'invoice-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePayment', () => {
    it('should validate payment successfully', async () => {
      const invoice = { ...mockRecurringInvoice };
      const account = { ...mockAccount };
      const transaction = { id: 'tx-1', amount: 1190 };

      jest.spyOn(dataSource, 'transaction').mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(invoice)
            .mockResolvedValueOnce(account),
          save: jest.fn()
            .mockResolvedValueOnce(account)
            .mockResolvedValueOnce(invoice),
        };
        jest.spyOn(transactionsService, 'create').mockResolvedValue(transaction as any);
        return cb(manager);
      });

      const result = await service.validatePayment('business-1', 'user-1', 'invoice-1', {
        account_id: 'account-1',
        payment_date: '2024-01-15',
      });

      expect(result.message).toBe('Payment validated successfully');
      expect(result.amount).toBe(1190); // 1000 + 19% tax
    });

    it('should throw NotFoundException if invoice not found', async () => {
      jest.spyOn(dataSource, 'transaction').mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return cb(manager);
      });

      await expect(
        service.validatePayment('business-1', 'user-1', 'invoice-1', {
          account_id: 'account-1',
          payment_date: '2024-01-15',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should apply percentage discount correctly', async () => {
      const invoice = {
        ...mockRecurringInvoice,
        discount_type: 'PERCENTAGE',
        discount_value: 10,
      };
      const account = { ...mockAccount };
      const transaction = { id: 'tx-1', amount: 1071 };

      jest.spyOn(dataSource, 'transaction').mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(invoice)
            .mockResolvedValueOnce(account),
          save: jest.fn()
            .mockResolvedValueOnce(account)
            .mockResolvedValueOnce(invoice),
        };
        jest.spyOn(transactionsService, 'create').mockResolvedValue(transaction as any);
        return cb(manager);
      });

      const result = await service.validatePayment('business-1', 'user-1', 'invoice-1', {
        account_id: 'account-1',
        payment_date: '2024-01-15',
      });

      expect(result.amount).toBe(1071); // (1000 * 0.9) + 19% tax
    });

    it('should apply fixed discount correctly', async () => {
      const invoice = {
        ...mockRecurringInvoice,
        discount_type: 'FIXED',
        discount_value: 100,
      };
      const account = { ...mockAccount };
      const transaction = { id: 'tx-1', amount: 1071 };

      jest.spyOn(dataSource, 'transaction').mockImplementation(async (cb: any) => {
        const manager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(invoice)
            .mockResolvedValueOnce(account),
          save: jest.fn()
            .mockResolvedValueOnce(account)
            .mockResolvedValueOnce(invoice),
        };
        jest.spyOn(transactionsService, 'create').mockResolvedValue(transaction as any);
        return cb(manager);
      });

      const result = await service.validatePayment('business-1', 'user-1', 'invoice-1', {
        account_id: 'account-1',
        payment_date: '2024-01-15',
      });

      expect(result.amount).toBe(1071); // (1000 - 100) + 19% tax
    });
  });

  describe('sendReminder', () => {
    it('should send reminder email successfully', async () => {
      jest.spyOn(recurringInvoiceRepo, 'findOne').mockResolvedValue(mockRecurringInvoice as any);

      const result = await service.sendReminder('business-1', 'invoice-1');

      expect(result.message).toBe('Reminder email sent successfully');
      expect(result.sentTo).toBe('client@test.com');
      expect(emailService['transporter'].sendMail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if client not found', async () => {
      const invoice = { ...mockRecurringInvoice, client: null };
      jest.spyOn(recurringInvoiceRepo, 'findOne').mockResolvedValue(invoice as any);

      await expect(service.sendReminder('business-1', 'invoice-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if client email not found', async () => {
      const invoice = { ...mockRecurringInvoice, client: { ...mockRecurringInvoice.client, email: null } };
      jest.spyOn(recurringInvoiceRepo, 'findOne').mockResolvedValue(invoice as any);

      await expect(service.sendReminder('business-1', 'invoice-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
