import { Test, TestingModule } from '@nestjs/testing';
import { PoAiGeneratorService } from './po-ai-generator.service';

describe('PoAiGeneratorService', () => {
  let instance: PoAiGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PoAiGeneratorService],
    }).compile();

    instance = module.get<PoAiGeneratorService>(PoAiGeneratorService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
