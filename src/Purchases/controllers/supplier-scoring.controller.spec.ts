import { Test, TestingModule } from '@nestjs/testing';
import { SupplierScoringController } from './supplier-scoring.controller';
import { SupplierScoringService } from '../services/supplier-scoring.service';
import { SupplierAiInsightsService } from '../services/supplier-ai-insights.service';

describe('SupplierScoringController', () => {
  let controller: SupplierScoringController;
  let service: SupplierScoringService;

  const mockService = {
    getSupplierScore: jest.fn(),
    getAllScores: jest.fn(),
    recalculateScore: jest.fn(),
  };

  const mockAiInsightsService = {
    getInsights: jest.fn(),
    analyzeSupplier: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierScoringController],
      providers: [
        {
          provide: SupplierScoringService,
          useValue: mockService,
        },
        {
          provide: SupplierAiInsightsService,
          useValue: mockAiInsightsService,
        },
      ],
    }).compile();

    controller = module.get<SupplierScoringController>(SupplierScoringController);
    service = module.get<SupplierScoringService>(SupplierScoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have service injected', () => {
    expect(service).toBeDefined();
  });
});
