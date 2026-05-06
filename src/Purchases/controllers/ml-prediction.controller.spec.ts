import { Test, TestingModule } from '@nestjs/testing';
import { MlPredictionController } from './ml-prediction.controller';

describe('MlPredictionController', () => {
  let instance: MlPredictionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MlPredictionController],
    }).compile();

    instance = module.get<MlPredictionController>(MlPredictionController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
