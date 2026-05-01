import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseAiAssistantService } from './purchase-ai-assistant.service';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { SupplierPayment } from '../../payments/entities/supplier-payment.entity';

describe('PurchaseAiAssistantService', () => {
  let service: PurchaseAiAssistantService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'GEMINI_API_KEY') return 'test-api-key';
      return defaultValue;
    }),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseAiAssistantService,
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
        {
          provide: getRepositoryToken(SupplierPayment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PurchaseAiAssistantService>(PurchaseAiAssistantService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should return error message if API key not configured', async () => {
      mockConfigService.get.mockReturnValueOnce('');

      const result = await service.chat('business-1', 'Test question');

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API error'));

      const result = await service.chat('business-1', 'Test question');

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('analyzeIntent', () => {
    it('should detect top_suppliers_by_amount intent', () => {
      const intent = (service as any).analyzeIntent('Quel fournisseur m\'a le plus facturé?');
      expect(intent).toBe('top_suppliers_by_amount');
    });

    it('should detect overdue_invoices intent', () => {
      const intent = (service as any).analyzeIntent('Y a-t-il des factures en retard?');
      expect(intent).toBe('overdue_invoices');
    });

    it('should default to general_query for unknown intent', () => {
      const intent = (service as any).analyzeIntent('Question aléatoire');
      expect(intent).toBe('general_query');
    });
  });
});
