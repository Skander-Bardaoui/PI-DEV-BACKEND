import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesDashboardService } from './sales-dashboard.service';
import { Quote } from '../entities/quote.entity';
import { SalesOrder } from '../entities/sales-order.entity';
import { DeliveryNote } from '../entities/delivery-note.entity';
import { Invoice } from '../entities/invoice.entity';
import { Client } from '../entities/client.entity';

describe('SalesDashboardService', () => {
  let service: SalesDashboardService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({}),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesDashboardService,
        {
          provide: getRepositoryToken(Quote),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DeliveryNote),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SalesDashboardService>(SalesDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
