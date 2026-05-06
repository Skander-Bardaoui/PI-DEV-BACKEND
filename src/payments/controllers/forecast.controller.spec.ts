import { Test, TestingModule } from '@nestjs/testing';
import { ForecastController } from './forecast.controller';

describe('ForecastController', () => {
  let instance: ForecastController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForecastController],
    }).compile();

    instance = module.get<ForecastController>(ForecastController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
