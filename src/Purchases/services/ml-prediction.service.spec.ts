import { Test, TestingModule } from '@nestjs/testing';
import { MlPredictionService } from './ml-prediction.service';

describe('MlPredictionService', () => {
  let instance: MlPredictionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MlPredictionService],
    }).compile();

    instance = module.get<MlPredictionService>(MlPredictionService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
