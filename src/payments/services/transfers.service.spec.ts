import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransfersService } from './transfers.service';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TransactionsService } from './transactions.service';
import { Role } from '../../users/enums/role.enum';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('TransfersService', () => {
  let service: TransfersService;
  let userRepo: Repository<User>;
  let dataSource: DataSource;

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
        TransfersService,
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

    service = module.get<TransfersService>(TransfersService);
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
    it('should create a transfer between accounts', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        from_account_id: 'account-from',
        to_account_id: 'account-to',
        amount: 1000,
        transfer_date: '2024-01-15',
        reference: 'TRANS-001',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockFromAccount = {
        id: 'account-from',
        name: 'Account From',
        business_id: businessId,
        is_active: true,
        current_balance: 5000,
      };
      const mockToAccount = {
        id: 'account-to',
        name: 'Account To',
        business_id: businessId,
        is_active: true,
        current_balance: 2000,
      };
      const mockDebitTransaction = { id: 'debit-123', amount: 1000 };
      const mockCreditTransaction = { id: 'credit-123', amount: 1000 };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockFromAccount)
          .mockResolvedValueOnce(mockToAccount),
        save: jest.fn().mockResolvedValue({}),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create
        .mockResolvedValueOnce(mockDebitTransaction)
        .mockResolvedValueOnce(mockCreditTransaction);

      const result = await service.create(businessId, userId, dto);

      expect(mockManager.findOne).toHaveBeenCalledTimes(2);
      expect(mockManager.save).toHaveBeenCalledTimes(2);
      expect(mockTransactionsService.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        debit: mockDebitTransaction,
        credit: mockCreditTransaction,
      });
    });

    it('should throw ForbiddenException without permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        from_account_id: 'account-from',
        to_account_id: 'account-to',
        amount: 1000,
        transfer_date: '2024-01-15',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: userId, role: Role.TEAM_MEMBER });
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if source account not found', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        from_account_id: 'non-existent',
        to_account_id: 'account-to',
        amount: 1000,
        transfer_date: '2024-01-15',
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

    it('should throw BadRequestException if insufficient balance', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        from_account_id: 'account-from',
        to_account_id: 'account-to',
        amount: 10000,
        transfer_date: '2024-01-15',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockFromAccount = {
        id: 'account-from',
        current_balance: 1000,
        is_active: true,
      };
      const mockToAccount = {
        id: 'account-to',
        is_active: true,
      };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockFromAccount)
          .mockResolvedValueOnce(mockToAccount),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should update account balances correctly', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        from_account_id: 'account-from',
        to_account_id: 'account-to',
        amount: 1000,
        transfer_date: '2024-01-15',
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockFromAccount = {
        id: 'account-from',
        name: 'From',
        current_balance: 5000,
        is_active: true,
      };
      const mockToAccount = {
        id: 'account-to',
        name: 'To',
        current_balance: 2000,
        is_active: true,
      };

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockFromAccount)
          .mockResolvedValueOnce(mockToAccount),
        save: jest.fn().mockImplementation((entity, data) => Promise.resolve(data)),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockTransactionsService.create.mockResolvedValue({});

      await service.create(businessId, userId, dto);

      expect(mockFromAccount.current_balance).toBe(4000);
      expect(mockToAccount.current_balance).toBe(3000);
    });
  });
});
