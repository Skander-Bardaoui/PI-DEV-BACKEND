import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseAiAssistantController } from './purchase-ai-assistant.controller';

describe('PurchaseAiAssistantController', () => {
  let instance: PurchaseAiAssistantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseAiAssistantController],
    }).compile();

    instance = module.get<PurchaseAiAssistantController>(PurchaseAiAssistantController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
