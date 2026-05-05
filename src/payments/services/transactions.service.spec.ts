import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from '../entities/transaction.entity';
import { FraudDetectionService } from './fraud-detection.service';
import { TransactionType } from '../enums/transaction-type.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: Repository<Transaction>;
  let fraudDetection: FraudDetectionService;

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockFraudDetectionService = {
    evaluate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: FraudDetectionService,
          useValue: mockFraudDetectionService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    fraudDetection = module.get<FraudDetectionService>(FraudDetectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all transactions for a business', async () => {
      const businessId = 'business-123';
      const mockTransactions = [
        {
          id: 'transaction-1',
          business_id: businessId,
          type: TransactionType.ENCAISSEMENT,
          amount: 1000,
        },
        {
          id: 'transaction-2',
          business_id: businessId,
          type: TransactionType.DECAISSEMENT,
          amount: 500,
        },
      ];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.findAll(businessId);

      expect(transactionRepo.find).toHaveBeenCalledWith({
        where: { business_id: businessId },
        relations: ['account'],
        order: { transaction_date: 'DESC' },
      });
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('findByAccount', () => {
    it('should return transactions for a specific account', async () => {
      const businessId = 'business-123';
      const accountId = 'account-123';
      const mockTransactions = [
        {
          id: 'transaction-1',
          business_id: businessId,
          account_id: accountId,
          amount: 1000,
        },
      ];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.findByAccount(businessId, accountId);

      expect(transactionRepo.find).toHaveBeenCalledWith({
        where: { business_id: businessId, account_id: accountId },
        relations: ['account'],
        order: { transaction_date: 'DESC' },
      });
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const businessId = 'business-123';
      const transactionId = 'transaction-123';
      const mockTransaction = {
        id: transactionId,
        business_id: businessId,
        amount: 1000,
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne(businessId, transactionId);

      expect(transactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: transactionId, business_id: businessId },
        relations: ['account'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('business-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a transaction with low fraud risk', async () => {
      const dto = {
        business_id: 'business-123',
        account_id: 'account-123',
        type: TransactionType.ENCAISSEMENT,
        amount: 1000,
        transaction_date: new Date(),
        description: 'Test transaction',
        created_by: 'user-123',
      };

      const fraudResult = {
        fraud_score: 0.1,
        is_fraud: false,
        action: 'allow' as const,
        confidence: 0.9,
      };

      const mockTransaction = {
        id: 'transaction-123',
        ...dto,
        fraud_score: 0.1,
        is_fraud: false,
        fraud_blocked: false,
        fraud_reviewed: false,
      };

      mockFraudDetectionService.evaluate.mockResolvedValue(fraudResult);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.create(dto);

      expect(fraudDetection.evaluate).toHaveBeenCalledWith({
        amount: dto.amount,
        type: dto.type,
        transaction_date: dto.transaction_date,
      });
      expect(transactionRepo.create).toHaveBeenCalledWith({
        ...dto,
        fraud_score: 0.1,
        is_fraud: false,
        fraud_blocked: false,
        fraud_reviewed: false,
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should flag transaction with medium fraud risk', async () => {
      const dto = {
        business_id: 'business-123',
        account_id: 'account-123',
        type: TransactionType.ENCAISSEMENT,
        amount: 10000,
        transaction_date: new Date(),
        created_by: 'user-123',
      };

      const fraudResult = {
        fraud_score: 0.6,
        is_fraud: false,
        action: 'flag' as const,
        confidence: 0.7,
      };

      const mockTransaction = {
        id: 'transaction-123',
        ...dto,
        fraud_score: 0.6,
        is_fraud: false,
      };

      mockFraudDetectionService.evaluate.mockResolvedValue(fraudResult);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.create(dto);

      expect(result.fraud_score).toBe(0.6);
    });

    it('should block transaction with high fraud risk', async () => {
      const dto = {
        business_id: 'business-123',
        account_id: 'account-123',
        type: TransactionType.ENCAISSEMENT,
        amount: 50000,
        transaction_date: new Date(),
        created_by: 'user-123',
      };

      const fraudResult = {
        fraud_score: 0.95,
        is_fraud: true,
        action: 'block' as const,
        confidence: 0.95,
      };

      mockFraudDetectionService.evaluate.mockResolvedValue(fraudResult);

      await expect(service.create(dto)).rejects.toThrow(ForbiddenException);
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getTrainingData', () => {
    it('should return training data for reviewed transactions', async () => {
      const businessId = 'business-123';
      const mockTransactions = [
        {
          id: 'transaction-1',
          amount: 1000,
          transaction_date: new Date('2024-01-15T10:00:00'),
          is_fraud: false,
          fraud_reviewed: true,
        },
        {
          id: 'transaction-2',
          amount: 5000,
          transaction_date: new Date('2024-01-16T23:00:00'),
          is_fraud: true,
          fraud_reviewed: true,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTransactions),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTrainingData(businessId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('hour');
      expect(result[0]).toHaveProperty('is_fraud');
      expect(result[0].is_fraud).toBe(0);
      expect(result[1].is_fraud).toBe(1);
    });

    it('should calculate time-based features correctly', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          amount: 1000,
          transaction_date: new Date('2024-01-13T23:30:00'), // Saturday night
          is_fraud: false,
          fraud_reviewed: true,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTransactions),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTrainingData();

      expect(result[0].is_weekend).toBe(1); // Saturday
      expect(result[0].is_night).toBe(1); // 23:30 is night time
      expect(result[0].hour).toBe(23);
    });
  });

  describe('updateFraudReview', () => {
    it('should update fraud review status', async () => {
      const businessId = 'business-123';
      const transactionId = 'transaction-123';
      const mockTransaction = {
        id: transactionId,
        business_id: businessId,
        is_fraud: false,
        fraud_reviewed: false,
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue({
        ...mockTransaction,
        is_fraud: true,
        fraud_reviewed: true,
      });

      const result = await service.updateFraudReview(businessId, transactionId, true);

      expect(result.is_fraud).toBe(true);
      expect(result.fraud_reviewed).toBe(true);
      expect(transactionRepo.save).toHaveBeenCalled();
    });
  });
});
