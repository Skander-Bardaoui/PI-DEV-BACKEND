import { Test, TestingModule } from '@nestjs/testing';
import { SalaryController } from './salary.controller';

describe('SalaryController', () => {
  let instance: SalaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalaryController],
    }).compile();

    instance = module.get<SalaryController>(SalaryController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
