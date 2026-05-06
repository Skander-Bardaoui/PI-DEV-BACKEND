import { Test, TestingModule } from '@nestjs/testing';
import { SalesEmailAiService } from './sales-email-ai.service';

describe('SalesEmailAiService', () => {
  let instance: SalesEmailAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesEmailAiService],
    }).compile();

    instance = module.get<SalesEmailAiService>(SalesEmailAiService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
