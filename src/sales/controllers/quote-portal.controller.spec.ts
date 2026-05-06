import { Test, TestingModule } from '@nestjs/testing';
import { QuotePortalController } from './quote-portal.controller';

describe('QuotePortalController', () => {
  let instance: QuotePortalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotePortalController],
    }).compile();

    instance = module.get<QuotePortalController>(QuotePortalController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
