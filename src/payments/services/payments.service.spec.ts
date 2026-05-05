import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from '../entities/payment.entity';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { Invoice, InvoiceStatus } from '../../sales/entities/invoice.entity';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TransactionsService } from './transactions.service';
import { Role } from '../../users/enums/role.enum';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: Repository<Payment>;
  let userRepo: Repository<User>;
  let dataSource: DataSource;

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAccountRepository = {
    findOne: jest.fn(),
  };

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockInvoiceRepository = {
    findOne: jest.fn(),
  };

  const mockMemberRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockBusinessRepository = {
    findOne: jest.fn(),
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
  };

  const mockTransactionsService = {
    create: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepository,
        },
        {
          provide: getRepositoryToken(BusinessMember),
          useValue: mockMemberRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment with permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        method: 'BANK_TRANSFER',
        reference: 'REF-001',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockInvoice = {
        id: 'invoice-123',
        business_id: businessId,
        invoice_number: 'INV-001',
        status: InvoiceStatus.PENDING,
        total_ttc: 2000,
        paid_amount: 0,
      };
      const mockAccount = {
        id: 'account-123',
        business_id: businessId,
        is_active: true,
        current_balance: 5000,
      };
      const mockPayment = {
        id: 'payment-123',
        ...dto,
        business_id: businessId,
        created_by: userId,
      };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockInvoice)
          .mockResolvedValueOnce(mockAccount),
        create: jest.fn().mockReturnValue(mockPayment),
        save: jest.fn().mockResolvedValue(mockPayment),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      const result = await service.create(businessId, userId, dto);

      expect(mockManager.findOne).toHaveBeenCalledWith(Invoice, {
        where: { id: dto.invoice_id, business_id: businessId },
      });
      expect(mockManager.findOne).toHaveBeenCalledWith(Account, {
        where: { id: dto.account_id, business_id: businessId, is_active: true },
      });
      expect(mockManager.create).toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });

    it('should throw ForbiddenException without permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        method: 'CASH',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: userId, role: Role.TEAM_MEMBER });
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        invoice_id: 'non-existent',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invoice is already paid', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockInvoice = {
        id: 'invoice-123',
        status: InvoiceStatus.PAID,
      };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockInvoice),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount exceeds remaining balance', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 3000,
        payment_date: '2024-01-15',
        method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockInvoice = {
        id: 'invoice-123',
        status: InvoiceStatus.PENDING,
        total_ttc: 2000,
        paid_amount: 0,
      };
      const mockAccount = {
        id: 'account-123',
        is_active: true,
      };
      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockInvoice)
          .mockResolvedValueOnce(mockAccount),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should update invoice status to PARTIALLY_PAID', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 500,
        payment_date: '2024-01-15',
        method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockInvoice = {
        id: 'invoice-123',
        status: InvoiceStatus.PENDING,
        total_ttc: 2000,
        paid_amount: 0,
      };
      const mockAccount = {
        id: 'account-123',
        is_active: true,
        current_balance: 1000,
      };
      const mockPayment = { id: 'payment-123' };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockInvoice)
          .mockResolvedValueOnce(mockAccount),
        create: jest.fn().mockReturnValue(mockPayment),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      await service.create(businessId, userId, dto);

      const savedInvoice = mockManager.save.mock.calls.find(
        (call) => call[0].id === 'invoice-123',
      )?.[0];
      expect(savedInvoice?.status).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(savedInvoice?.paid_amount).toBe(500);
    });

    it('should update invoice status to PAID when fully paid', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 2000,
        payment_date: '2024-01-15',
        method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockInvoice = {
        id: 'invoice-123',
        status: InvoiceStatus.PENDING,
        total_ttc: 2000,
        paid_amount: 0,
      };
      const mockAccount = {
        id: 'account-123',
        is_active: true,
        current_balance: 1000,
      };
      const mockPayment = { id: 'payment-123' };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockInvoice)
          .mockResolvedValueOnce(mockAccount),
        create: jest.fn().mockReturnValue(mockPayment),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      await service.create(businessId, userId, dto);

      const savedInvoice = mockManager.save.mock.calls.find(
        (call) => call[0].id === 'invoice-123',
      )?.[0];
      expect(savedInvoice?.status).toBe(InvoiceStatus.PAID);
      expect(savedInvoice?.paid_amount).toBe(2000);
    });
  });

  describe('findAll', () => {
    it('should return all payments for a business', async () => {
      const businessId = 'business-123';
      const mockPayments = [
        { id: 'payment-1', business_id: businessId, amount: 1000 },
        { id: 'payment-2', business_id: businessId, amount: 2000 },
      ];

      mockPaymentRepository.find.mockResolvedValue(mockPayments);

      const result = await service.findAll(businessId);

      expect(paymentRepo.find).toHaveBeenCalledWith({
        where: { business_id: businessId },
        relations: ['invoice', 'account'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('findByInvoice', () => {
    it('should return payments for a specific invoice', async () => {
      const businessId = 'business-123';
      const invoiceId = 'invoice-123';
      const mockPayments = [
        { id: 'payment-1', invoice_id: invoiceId, amount: 1000 },
      ];

      mockPaymentRepository.find.mockResolvedValue(mockPayments);

      const result = await service.findByInvoice(businessId, invoiceId);

      expect(paymentRepo.find).toHaveBeenCalledWith({
        where: { business_id: businessId, invoice_id: invoiceId },
        relations: ['account'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const businessId = 'business-123';
      const paymentId = 'payment-123';
      const mockPayment = {
        id: paymentId,
        business_id: businessId,
        amount: 1000,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne(businessId, paymentId);

      expect(paymentRepo.findOne).toHaveBeenCalledWith({
        where: { id: paymentId, business_id: businessId },
        relations: ['invoice', 'account'],
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('business-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
