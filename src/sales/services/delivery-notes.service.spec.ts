import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryNotesService } from './delivery-notes.service';
import { DeliveryNote } from '../entities/delivery-note.entity';
import { DeliveryNoteItem } from '../entities/delivery-note-item.entity';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';

describe('DeliveryNotesService', () => {
  let service: DeliveryNotesService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryNotesService,
        {
          provide: getRepositoryToken(DeliveryNote),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DeliveryNoteItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SalesOrderItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeliveryNotesService>(DeliveryNotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
