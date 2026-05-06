import { Test, TestingModule } from '@nestjs/testing';
import { QuotesController } from './quotes.controller';

describe('QuotesController', () => {
  let instance: QuotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotesController],
    }).compile();

    instance = module.get<QuotesController>(QuotesController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
