import { Test, TestingModule } from '@nestjs/testing';
import { QuotePortalService } from './quote-portal.service';

describe('QuotePortalService', () => {
  let instance: QuotePortalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotePortalService],
    }).compile();

    instance = module.get<QuotePortalService>(QuotePortalService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
