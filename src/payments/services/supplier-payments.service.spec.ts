import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupplierPaymentsService } from './supplier-payments.service';
import { SupplierPayment } from '../entities/supplier-payment.entity';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { PurchaseInvoice } from '../../Purchases/entities/purchase-invoice.entity';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TransactionsService } from './transactions.service';
import { Role } from '../../users/enums/role.enum';
import { InvoiceStatus } from '../../Purchases/enum/invoice-status.enum';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('SupplierPaymentsService', () => {
  let service: SupplierPaymentsService;
  let paymentRepo: Repository<SupplierPayment>;
  let userRepo: Repository<User>;
  let dataSource: DataSource;

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockInvoiceRepository = {
    findOne: jest.fn(),
  };

  const mockAccountRepository = {
    findOne: jest.fn(),
  };

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
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
        SupplierPaymentsService,
        {
          provide: getRepositoryToken(SupplierPayment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: mockInvoiceRepository,
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

    service = module.get<SupplierPaymentsService>(SupplierPaymentsService);
    paymentRepo = module.get<Repository<SupplierPayment>>(getRepositoryToken(SupplierPayment));
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
    it('should create a supplier payment with invoice', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        supplier_id: 'supplier-123',
        purchase_invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'BANK_TRANSFER',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = {
        id: 'account-123',
        current_balance: 5000,
        is_active: true,
      };
      const mockInvoice = {
        id: 'invoice-123',
        supplier_id: 'supplier-123',
        invoice_number_supplier: 'INV-001',
        status: InvoiceStatus.APPROVED,
        net_amount: 2000,
        paid_amount: 0,
      };
      const mockPayment = {
        id: 'payment-123',
        payment_number: 'PAY-2024-0001',
      };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAccount)
          .mockResolvedValueOnce(mockInvoice)
          .mockResolvedValueOnce(mockPayment),
        create: jest.fn().mockReturnValue(mockPayment),
        save: jest.fn().mockResolvedValue(mockPayment),
        query: jest.fn().mockResolvedValue([{ next_seq: 1 }]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      const result = await service.create(businessId, userId, dto);

      expect(mockManager.findOne).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
      expect(mockTransactionsService.create).toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });

    it('should throw ForbiddenException without permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        supplier_id: 'supplier-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'CASH',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: userId, role: Role.TEAM_MEMBER });
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        supplier_id: 'supplier-123',
        account_id: 'account-123',
        amount: 10000,
        payment_date: '2024-01-15',
        payment_method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = {
        id: 'account-123',
        current_balance: 1000,
        is_active: true,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockAccount),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invoice belongs to different supplier', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        supplier_id: 'supplier-123',
        purchase_invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 1000,
        payment_date: '2024-01-15',
        payment_method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = {
        id: 'account-123',
        current_balance: 5000,
        is_active: true,
      };
      const mockInvoice = {
        id: 'invoice-123',
        supplier_id: 'different-supplier',
        status: InvoiceStatus.APPROVED,
      };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAccount)
          .mockResolvedValueOnce(mockInvoice),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should update invoice status to PAID when fully paid', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        supplier_id: 'supplier-123',
        purchase_invoice_id: 'invoice-123',
        account_id: 'account-123',
        amount: 2000,
        payment_date: '2024-01-15',
        payment_method: 'CASH',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = {
        id: 'account-123',
        current_balance: 5000,
        is_active: true,
      };
      const mockInvoice = {
        id: 'invoice-123',
        supplier_id: 'supplier-123',
        status: InvoiceStatus.APPROVED,
        net_amount: 2000,
        paid_amount: 0,
      };
      const mockPayment = { id: 'payment-123' };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockAccount)
          .mockResolvedValueOnce(mockInvoice)
          .mockResolvedValueOnce(mockPayment),
        create: jest.fn().mockReturnValue(mockPayment),
        save: jest.fn().mockImplementation((entity, data) => Promise.resolve(data || entity)),
        query: jest.fn().mockResolvedValue([{ next_seq: 1 }]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      await service.create(businessId, userId, dto);

      expect(mockInvoice.status).toBe(InvoiceStatus.PAID);
      expect(mockInvoice.paid_amount).toBe(2000);
    });
  });

  describe('findAll', () => {
    it('should return all supplier payments', async () => {
      const businessId = 'business-123';
      const mockPayments = [
        { id: 'payment-1', amount: 1000 },
        { id: 'payment-2', amount: 2000 },
      ];

      mockPaymentRepository.find.mockResolvedValue(mockPayments);

      const result = await service.findAll(businessId);

      expect(paymentRepo.find).toHaveBeenCalledWith({
        where: { business_id: businessId },
        relations: ['supplier', 'purchase_invoice', 'account'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('findOne', () => {
    it('should return a supplier payment by id', async () => {
      const businessId = 'business-123';
      const paymentId = 'payment-123';
      const mockPayment = { id: paymentId, amount: 1000 };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne(businessId, paymentId);

      expect(paymentRepo.findOne).toHaveBeenCalledWith({
        where: { id: paymentId, business_id: businessId },
        relations: ['supplier', 'purchase_invoice', 'account'],
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

  describe('findBySupplier', () => {
    it('should return payments for a specific supplier', async () => {
      const businessId = 'business-123';
      const supplierId = 'supplier-123';
      const mockPayments = [
        { id: 'payment-1', supplier_id: supplierId, amount: 1000 },
      ];

      mockPaymentRepository.find.mockResolvedValue(mockPayments);

      const result = await service.findBySupplier(businessId, supplierId);

      expect(paymentRepo.find).toHaveBeenCalledWith({
        where: { business_id: businessId, supplier_id: supplierId },
        relations: ['purchase_invoice', 'account'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('getSupplierStats', () => {
    it('should return supplier payment statistics', async () => {
      const businessId = 'business-123';
      const supplierId = 'supplier-123';

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          total_paid: '5000',
          payment_count: '3',
        }),
      };

      mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSupplierStats(businessId, supplierId);

      expect(result).toEqual({
        total_paid: 5000,
        payment_count: 3,
      });
    });

    it('should return zero values if no payments found', async () => {
      const businessId = 'business-123';
      const supplierId = 'supplier-123';

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          total_paid: null,
          payment_count: null,
        }),
      };

      mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSupplierStats(businessId, supplierId);

      expect(result).toEqual({
        total_paid: 0,
        payment_count: 0,
      });
    });
  });
});
