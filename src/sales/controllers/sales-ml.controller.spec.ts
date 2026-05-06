import { Test, TestingModule } from '@nestjs/testing';
import { SalesMLController } from './sales-ml.controller';

describe('SalesMLController', () => {
  let instance: SalesMLController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesMLController],
    }).compile();

    instance = module.get<SalesMLController>(SalesMLController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
