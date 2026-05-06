import { Test, TestingModule } from '@nestjs/testing';
import { GlobalAiAssistantController } from './global-ai-assistant.controller';

describe('GlobalAiAssistantController', () => {
  let instance: GlobalAiAssistantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalAiAssistantController],
    }).compile();

    instance = module.get<GlobalAiAssistantController>(GlobalAiAssistantController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
