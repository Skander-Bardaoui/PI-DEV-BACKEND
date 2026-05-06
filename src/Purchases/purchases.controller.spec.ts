import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';

describe('PurchasesController', () => {
  let instance: PurchasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchasesController],
    }).compile();

    instance = module.get<PurchasesController>(PurchasesController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
