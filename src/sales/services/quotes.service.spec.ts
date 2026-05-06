import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';

describe('QuotesService', () => {
  let instance: QuotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotesService],
    }).compile();

    instance = module.get<QuotesService>(QuotesService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
