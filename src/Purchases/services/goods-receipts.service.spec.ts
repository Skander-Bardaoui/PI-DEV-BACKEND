import { Test, TestingModule } from '@nestjs/testing';
import { GoodsReceiptsService } from './goods-receipts.service';

describe('GoodsReceiptsService', () => {
  let instance: GoodsReceiptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoodsReceiptsService],
    }).compile();

    instance = module.get<GoodsReceiptsService>(GoodsReceiptsService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
