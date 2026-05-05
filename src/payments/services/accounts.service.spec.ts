import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsService } from './accounts.service';
import { Account } from '../entities/account.entity';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Role } from '../../users/enums/role.enum';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('AccountsService', () => {
  let service: AccountsService;
  let accountRepo: Repository<Account>;
  let memberRepo: Repository<BusinessMember>;
  let userRepo: Repository<User>;

  const mockAccountRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
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
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    accountRepo = module.get<Repository<Account>>(getRepositoryToken(Account));
    memberRepo = module.get<Repository<BusinessMember>>(getRepositoryToken(BusinessMember));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an account with permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        name: 'Main Account',
        type: 'BANK',
        opening_balance: 1000,
        is_default: false,
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = {
        id: 'account-123',
        ...dto,
        business_id: businessId,
        current_balance: 1000,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountRepository.create.mockReturnValue(mockAccount);
      mockAccountRepository.save.mockResolvedValue(mockAccount);

      const result = await service.create(businessId, userId, dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(accountRepo.create).toHaveBeenCalledWith({
        ...dto,
        business_id: businessId,
        current_balance: 1000,
      });
      expect(accountRepo.save).toHaveBeenCalledWith(mockAccount);
      expect(result).toEqual(mockAccount);
    });

    it('should set is_default to false for other accounts when creating default account', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        name: 'Default Account',
        type: 'BANK',
        opening_balance: 0,
        is_default: true,
      };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = { id: 'account-123', ...dto, business_id: businessId };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountRepository.update.mockResolvedValue({ affected: 1 });
      mockAccountRepository.create.mockReturnValue(mockAccount);
      mockAccountRepository.save.mockResolvedValue(mockAccount);

      await service.create(businessId, userId, dto);

      expect(accountRepo.update).toHaveBeenCalledWith(
        { business_id: businessId, is_default: true },
        { is_default: false },
      );
    });

    it('should throw ForbiddenException without permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const dto = {
        name: 'Account',
        type: 'BANK',
        opening_balance: 0,
      };

      mockUserRepository.findOne.mockResolvedValue({ id: userId, role: Role.TEAM_MEMBER });
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.create(businessId, userId, dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all accounts for a business', async () => {
      const businessId = 'business-123';
      const mockAccounts = [
        { id: 'account-1', name: 'Account 1', business_id: businessId },
        { id: 'account-2', name: 'Account 2', business_id: businessId },
      ];

      mockAccountRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.findAll(businessId);

      expect(accountRepo.find).toHaveBeenCalledWith({
        where: { business_id: businessId },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('findOne', () => {
    it('should return an account by id', async () => {
      const businessId = 'business-123';
      const accountId = 'account-123';
      const mockAccount = { id: accountId, name: 'Account', business_id: businessId };

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findOne(businessId, accountId);

      expect(accountRepo.findOne).toHaveBeenCalledWith({
        where: { id: accountId, business_id: businessId },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException if account not found', async () => {
      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('business-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an account with permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const accountId = 'account-123';
      const dto = { name: 'Updated Account' };

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = { id: accountId, name: 'Old Name', business_id: businessId };
      const updatedAccount = { ...mockAccount, ...dto };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.update(businessId, userId, accountId, dto);

      expect(accountRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Account');
    });

    it('should throw ForbiddenException without permission', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const accountId = 'account-123';
      const dto = { name: 'Updated' };

      mockUserRepository.findOne.mockResolvedValue({ id: userId, role: Role.TEAM_MEMBER });
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.update(businessId, userId, accountId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle account active status', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const accountId = 'account-123';

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = {
        id: accountId,
        is_active: true,
        is_default: false,
        business_id: businessId,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountRepository.save.mockResolvedValue({ ...mockAccount, is_active: false });

      const result = await service.toggleActive(businessId, userId, accountId);

      expect(result.is_active).toBe(false);
    });

    it('should throw BadRequestException when deactivating default account', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const accountId = 'account-123';

      const mockUser = { id: userId, role: Role.PLATFORM_ADMIN };
      const mockAccount = {
        id: accountId,
        is_active: true,
        is_default: true,
        business_id: businessId,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);

      await expect(service.toggleActive(businessId, userId, accountId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getBalance', () => {
    it('should return account balance', async () => {
      const businessId = 'business-123';
      const accountId = 'account-123';
      const mockAccount = {
        id: accountId,
        current_balance: 5000,
        opening_balance: 1000,
        business_id: businessId,
      };

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.getBalance(businessId, accountId);

      expect(result).toEqual({
        account: mockAccount,
        current_balance: 5000,
        opening_balance: 1000,
      });
    });
  });

  describe('getTotalBalance', () => {
    it('should return total balance across all active accounts', async () => {
      const businessId = 'business-123';
      const mockAccounts = [
        { id: 'account-1', name: 'Account 1', current_balance: 1000, type: 'BANK' },
        { id: 'account-2', name: 'Account 2', current_balance: 2000, type: 'CASH' },
      ];

      mockAccountRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.getTotalBalance(businessId);

      expect(result.total).toBe(3000);
      expect(result.by_account).toHaveLength(2);
      expect(result.by_account[0].balance).toBe(1000);
      expect(result.by_account[1].balance).toBe(2000);
    });
  });
});
