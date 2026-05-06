import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';

describe('StatisticsController', () => {
  let instance: StatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsController],
    }).compile();

    instance = module.get<StatisticsController>(StatisticsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
