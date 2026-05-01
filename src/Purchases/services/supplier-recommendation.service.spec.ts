import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierRecommendationService } from './supplier-recommendation.service';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { SupplierScoringService } from './supplier-scoring.service';

describe('SupplierRecommendationService', () => {
  let service: SupplierRecommendationService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockScoringService = {
    getSupplierScore: jest.fn(),
    calculateScore: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierRecommendationService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: mockRepository,
        },
        {
          provide: SupplierScoringService,
          useValue: mockScoringService,
        },
      ],
    }).compile();

    service = module.get<SupplierRecommendationService>(SupplierRecommendationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
