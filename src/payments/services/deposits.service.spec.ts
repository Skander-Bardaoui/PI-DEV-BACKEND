import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DepositsService } from './deposits.service';
import { Account } from '../entities/account.entity';
import { TransactionsService } from './transactions.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DepositsService', () => {
  let service: DepositsService;
  let dataSource: DataSource;

  const mockAccountRepository = {
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
        DepositsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DepositsService>(DepositsService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a deposit', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        account_id: 'account-123',
        amount: 1000,
        description: 'Test deposit',
        reference: 'DEP-001',
        deposit_date: '2024-01-15',
      };

      const mockAccount = {
        id: 'account-123',
        name: 'Main Account',
        business_id: businessId,
        is_active: true,
        current_balance: 5000,
      };

      const mockTransaction = {
        id: 'transaction-123',
        amount: 1000,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockAccount),
        save: jest.fn().mockResolvedValue(mockAccount),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue(mockTransaction);

      const result = await service.create(businessId, userId, dto);

      expect(mockManager.findOne).toHaveBeenCalledWith(Account, {
        where: { id: dto.account_id, business_id: businessId, is_active: true },
      });
      expect(mockManager.save).toHaveBeenCalled();
      expect(mockTransactionsService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('transaction');
      expect(result).toHaveProperty('account');
      expect(result.account.new_balance).toBe(6000);
    });

    it('should throw BadRequestException if amount is zero or negative', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        account_id: 'account-123',
        amount: 0,
        description: 'Invalid deposit',
      };

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if account not found', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        account_id: 'non-existent',
        amount: 1000,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if balance exceeds maximum', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        account_id: 'account-123',
        amount: 1e12,
      };

      const mockAccount = {
        id: 'account-123',
        current_balance: 1000,
        is_active: true,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockAccount),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should use current date if deposit_date not provided', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        account_id: 'account-123',
        amount: 1000,
      };

      const mockAccount = {
        id: 'account-123',
        name: 'Account',
        current_balance: 5000,
        is_active: true,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockAccount),
        save: jest.fn().mockResolvedValue(mockAccount),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      await service.create(businessId, userId, dto);

      const createCall = mockTransactionsService.create.mock.calls[0][0];
      expect(createCall.transaction_date).toBeInstanceOf(Date);
    });

    it('should generate reference if not provided', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        account_id: 'account-123',
        amount: 1000,
      };

      const mockAccount = {
        id: 'account-123',
        name: 'Account',
        current_balance: 5000,
        is_active: true,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockAccount),
        save: jest.fn().mockResolvedValue(mockAccount),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      await service.create(businessId, userId, dto);

      const createCall = mockTransactionsService.create.mock.calls[0][0];
      expect(createCall.reference).toMatch(/^DEP-\d+$/);
    });
  });
});
