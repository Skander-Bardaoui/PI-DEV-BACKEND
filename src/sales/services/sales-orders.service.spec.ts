import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersService', () => {
  let instance: SalesOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesOrdersService],
    }).compile();

    instance = module.get<SalesOrdersService>(SalesOrdersService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
