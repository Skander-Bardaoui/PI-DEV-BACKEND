import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrdersController } from './sales-orders.controller';

describe('SalesOrdersController', () => {
  let instance: SalesOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesOrdersController],
    }).compile();

    instance = module.get<SalesOrdersController>(SalesOrdersController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
