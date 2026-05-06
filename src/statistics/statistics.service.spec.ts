import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let instance: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService],
    }).compile();

    instance = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
