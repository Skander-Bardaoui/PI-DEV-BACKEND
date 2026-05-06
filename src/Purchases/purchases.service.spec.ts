import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';

describe('PurchasesService', () => {
  let instance: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchasesService],
    }).compile();

    instance = module.get<PurchasesService>(PurchasesService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
