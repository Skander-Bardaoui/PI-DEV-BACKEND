import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOcrAiService } from './purchase-ocr-ai.service';

describe('PurchaseOcrAiService', () => {
  let instance: PurchaseOcrAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOcrAiService],
    }).compile();

    instance = module.get<PurchaseOcrAiService>(PurchaseOcrAiService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
