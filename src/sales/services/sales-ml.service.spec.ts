import { Test, TestingModule } from '@nestjs/testing';
import { SalesMLService } from './sales-ml.service';

describe('SalesMLService', () => {
  let instance: SalesMLService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesMLService],
    }).compile();

    instance = module.get<SalesMLService>(SalesMLService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
