import { Test, TestingModule } from '@nestjs/testing';
import { SalesOcrAiService } from './sales-ocr-ai.service';

describe('SalesOcrAiService', () => {
  let instance: SalesOcrAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesOcrAiService],
    }).compile();

    instance = module.get<SalesOcrAiService>(SalesOcrAiService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
