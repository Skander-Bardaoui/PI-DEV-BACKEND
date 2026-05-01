import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

describe('PurchasesController', () => {
  let controller: PurchasesController;
  let service: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [PurchasesService],
    }).compile();

    controller = module.get<PurchasesController>(PurchasesController);
    service = module.get<PurchasesService>(PurchasesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have purchasesService injected', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PurchasesService);
  });
});
