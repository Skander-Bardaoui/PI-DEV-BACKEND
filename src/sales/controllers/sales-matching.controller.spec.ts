import { Test, TestingModule } from '@nestjs/testing';
import { SalesMatchingController } from './sales-matching.controller';

describe('SalesMatchingController', () => {
  let instance: SalesMatchingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesMatchingController],
    }).compile();

    instance = module.get<SalesMatchingController>(SalesMatchingController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
