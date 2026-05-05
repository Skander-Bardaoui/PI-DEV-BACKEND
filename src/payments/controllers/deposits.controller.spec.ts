import { Test, TestingModule } from '@nestjs/testing';
import { DepositsController } from './deposits.controller';
import { DepositsService } from '../services/deposits.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('DepositsController', () => {
  let controller: DepositsController;
  let service: DepositsService;

  const mockDepositsService = {
    create: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      business_id: 'business-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepositsController],
      providers: [
        {
          provide: DepositsService,
          useValue: mockDepositsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DepositsController>(DepositsController);
    service = module.get<DepositsService>(DepositsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a deposit', async () => {
      const dto = {
        account_id: 'account-123',
        amount: 1000,
        description: 'Test deposit',
        reference: 'DEP-001',
        deposit_date: '2024-01-15',
      };

      const mockResult = {
        message: 'Deposit added successfully',
        transaction: { id: 'transaction-123', amount: 1000 },
        account: {
          id: 'account-123',
          name: 'Main Account',
          previous_balance: 5000,
          new_balance: 6000,
        },
      };

      mockDepositsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(mockRequest, dto);

      expect(service.create).toHaveBeenCalledWith('business-123', 'user-123', dto);
      expect(result).toEqual(mockResult);
    });
  });
});
