import { Test, TestingModule } from '@nestjs/testing';
import { SalesMailService } from './sales-mail.service';

describe('SalesMailService', () => {
  let instance: SalesMailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesMailService],
    }).compile();

    instance = module.get<SalesMailService>(SalesMailService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
