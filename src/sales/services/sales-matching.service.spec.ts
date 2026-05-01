import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesMatchingService } from './sales-matching.service';
import { Invoice } from '../entities/invoice.entity';
import { DeliveryNote } from '../entities/delivery-note.entity';
import { SalesOrder } from '../entities/sales-order.entity';
import { Quote } from '../entities/quote.entity';

describe('SalesMatchingService', () => {
  let service: SalesMatchingService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesMatchingService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DeliveryNote),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Quote),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SalesMatchingService>(SalesMatchingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
