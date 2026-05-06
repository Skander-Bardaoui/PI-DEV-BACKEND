import { Test, TestingModule } from '@nestjs/testing';
import { GoodsReceiptsController } from './goods-receipts.controller';

describe('GoodsReceiptsController', () => {
  let instance: GoodsReceiptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoodsReceiptsController],
    }).compile();

    instance = module.get<GoodsReceiptsController>(GoodsReceiptsController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
