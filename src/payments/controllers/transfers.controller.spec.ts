import { Test, TestingModule } from '@nestjs/testing';
import { TransfersController } from './transfers.controller';
import { TransfersService } from '../services/transfers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('TransfersController', () => {
  let controller: TransfersController;
  let service: TransfersService;

  const mockTransfersService = {
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
      controllers: [TransfersController],
      providers: [
        {
          provide: TransfersService,
          useValue: mockTransfersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TransfersController>(TransfersController);
    service = module.get<TransfersService>(TransfersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transfer', async () => {
      const dto = {
        from_account_id: 'account-from',
        to_account_id: 'account-to',
        amount: 1000,
        transfer_date: '2024-01-15',
        reference: 'TRANS-001',
      };

      const mockResult = {
        debit: { id: 'debit-123', amount: 1000 },
        credit: { id: 'credit-123', amount: 1000 },
      };

      mockTransfersService.create.mockResolvedValue(mockResult);

      const result = await controller.create(mockRequest, dto);

      expect(service.create).toHaveBeenCalledWith('business-123', 'user-123', dto);
      expect(result).toEqual(mockResult);
    });
  });
});
