import { Test, TestingModule } from '@nestjs/testing';
import { MlPredictionController } from './ml-prediction.controller';
import { MlPredictionService } from '../services/ml-prediction.service';

describe('MlPredictionController', () => {
  let controller: MlPredictionController;
  let service: MlPredictionService;

  const mockService = {
    checkHealth: jest.fn(),
    predictDemand: jest.fn(),
    predictBatch: jest.fn(),
    getRecommendations: jest.fn(),
    predictForProduct: jest.fn(),
    getBusinessRecommendations: jest.fn(),
    markAsProcessed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MlPredictionController],
      providers: [
        {
          provide: MlPredictionService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MlPredictionController>(MlPredictionController);
    service = module.get<MlPredictionService>(MlPredictionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
