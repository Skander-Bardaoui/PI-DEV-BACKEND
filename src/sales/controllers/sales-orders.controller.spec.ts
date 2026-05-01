import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from '../services/sales-orders.service';

describe('SalesOrdersController', () => {
  let controller: SalesOrdersController;
  let service: SalesOrdersService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesOrdersController],
      providers: [
        {
          provide: SalesOrdersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SalesOrdersController>(SalesOrdersController);
    service = module.get<SalesOrdersService>(SalesOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have service injected', () => {
    expect(service).toBeDefined();
  });
});
