import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierAiInsightsService } from './supplier-ai-insights.service';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';

describe('SupplierAiInsightsService', () => {
  let service: SupplierAiInsightsService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'GEMINI_API_KEY') return 'test-api-key';
      return defaultValue;
    }),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierAiInsightsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
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
      ],
    }).compile();

    service = module.get<SupplierAiInsightsService>(SupplierAiInsightsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
