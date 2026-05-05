import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from '../services/transactions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    findAll: jest.fn(),
    findByAccount: jest.fn(),
    findOne: jest.fn(),
    getTrainingData: jest.fn(),
    updateFraudReview: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      business_id: 'business-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all transactions', async () => {
      const mockTransactions = [
        { id: 'transaction-1', amount: 1000 },
        { id: 'transaction-2', amount: 2000 },
      ];

      mockTransactionsService.findAll.mockResolvedValue(mockTransactions);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith('business-123');
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getTrainingData', () => {
    it('should return training data', async () => {
      const mockTrainingData = [
        {
          amount: 1000,
          hour: 10,
          is_weekend: 0,
          is_night: 0,
          velocity_score: 0,
          geo_anomaly_score: 0,
          spending_deviation_score: 0,
          is_fraud: 0,
        },
      ];

      mockTransactionsService.getTrainingData.mockResolvedValue(mockTrainingData);

      const result = await controller.getTrainingData(mockRequest);

      expect(service.getTrainingData).toHaveBeenCalledWith('business-123');
      expect(result).toEqual(mockTrainingData);
    });
  });

  describe('findByAccount', () => {
    it('should return transactions for a specific account', async () => {
      const accountId = 'account-123';
      const mockTransactions = [
        { id: 'transaction-1', account_id: accountId, amount: 1000 },
      ];

      mockTransactionsService.findByAccount.mockResolvedValue(mockTransactions);

      const result = await controller.findByAccount(mockRequest, accountId);

      expect(service.findByAccount).toHaveBeenCalledWith('business-123', accountId);
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('updateFraudReview', () => {
    it('should update fraud review status', async () => {
      const transactionId = 'transaction-123';
      const body = { is_fraud: true };
      const mockTransaction = {
        id: transactionId,
        is_fraud: true,
        fraud_reviewed: true,
      };

      mockTransactionsService.updateFraudReview.mockResolvedValue(mockTransaction);

      const result = await controller.updateFraudReview(mockRequest, transactionId, body);

      expect(service.updateFraudReview).toHaveBeenCalledWith('business-123', transactionId, true);
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const transactionId = 'transaction-123';
      const mockTransaction = { id: transactionId, amount: 1000 };

      mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne(mockRequest, transactionId);

      expect(service.findOne).toHaveBeenCalledWith('business-123', transactionId);
      expect(result).toEqual(mockTransaction);
    });
  });
});
