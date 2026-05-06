import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseAiAssistantService } from './purchase-ai-assistant.service';

describe('PurchaseAiAssistantService', () => {
  let instance: PurchaseAiAssistantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseAiAssistantService],
    }).compile();

    instance = module.get<PurchaseAiAssistantService>(PurchaseAiAssistantService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
