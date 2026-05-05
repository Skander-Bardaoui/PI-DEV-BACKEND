import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from '../services/accounts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: AccountsService;

  const mockAccountsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggleActive: jest.fn(),
    getBalance: jest.fn(),
    getTotalBalance: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      business_id: 'business-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an account', async () => {
      const dto = {
        name: 'Main Account',
        type: 'BANK',
        opening_balance: 1000,
      };
      const mockAccount = { id: 'account-123', ...dto };

      mockAccountsService.create.mockResolvedValue(mockAccount);

      const result = await controller.create(mockRequest, dto);

      expect(service.create).toHaveBeenCalledWith('business-123', 'user-123', dto);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('findAll', () => {
    it('should return all accounts', async () => {
      const mockAccounts = [
        { id: 'account-1', name: 'Account 1' },
        { id: 'account-2', name: 'Account 2' },
      ];

      mockAccountsService.findAll.mockResolvedValue(mockAccounts);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('business-123');
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('getTotalBalance', () => {
    it('should return total balance', async () => {
      const mockBalance = {
        total: 5000,
        by_account: [
          { id: 'account-1', name: 'Account 1', balance: 3000, type: 'BANK' },
          { id: 'account-2', name: 'Account 2', balance: 2000, type: 'CASH' },
        ],
      };

      mockAccountsService.getTotalBalance.mockResolvedValue(mockBalance);

      const result = await controller.getTotalBalance(mockRequest);

      expect(service.getTotalBalance).toHaveBeenCalledWith('business-123');
      expect(result).toEqual(mockBalance);
    });
  });

  describe('findOne', () => {
    it('should return an account by id', async () => {
      const accountId = 'account-123';
      const mockAccount = { id: accountId, name: 'Account' };

      mockAccountsService.findOne.mockResolvedValue(mockAccount);

      const result = await controller.findOne(mockRequest, accountId);

      expect(service.findOne).toHaveBeenCalledWith('business-123', accountId);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('getBalance', () => {
    it('should return account balance', async () => {
      const accountId = 'account-123';
      const mockBalance = {
        account: { id: accountId, name: 'Account' },
        current_balance: 5000,
        opening_balance: 1000,
      };

      mockAccountsService.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance(mockRequest, accountId);

      expect(service.getBalance).toHaveBeenCalledWith('business-123', accountId);
      expect(result).toEqual(mockBalance);
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const accountId = 'account-123';
      const dto = { name: 'Updated Account' };
      const mockAccount = { id: accountId, ...dto };

      mockAccountsService.update.mockResolvedValue(mockAccount);

      const result = await controller.update(mockRequest, accountId, dto);

      expect(service.update).toHaveBeenCalledWith('business-123', 'user-123', accountId, dto);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('toggleActive', () => {
    it('should toggle account active status', async () => {
      const accountId = 'account-123';
      const mockAccount = { id: accountId, is_active: false };

      mockAccountsService.toggleActive.mockResolvedValue(mockAccount);

      const result = await controller.toggleActive(mockRequest, accountId);

      expect(service.toggleActive).toHaveBeenCalledWith('business-123', 'user-123', accountId);
      expect(result).toEqual(mockAccount);
    });
  });
});
