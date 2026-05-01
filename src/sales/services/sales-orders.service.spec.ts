import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { DeliveryNote } from '../entities/delivery-note.entity';
import { DeliveryNoteItem } from '../entities/delivery-note-item.entity';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
import { Product } from '../../stock/entities/product.entity';
import { SalesMailService } from './sales-mail.service';
import { ClientPortalService } from './client-portal.service';
import { StockMovementsService } from '../../stock/services/stock-movements/stock-movements.service';
import { DataSource } from 'typeorm';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;

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

  const mockSalesMailService = {
    sendOrderConfirmation: jest.fn(),
  };

  const mockClientPortalService = {
    generateToken: jest.fn(),
  };

  const mockStockMovementsService = {
    create: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
      },
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SalesOrderItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(InvoiceItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DeliveryNote),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DeliveryNoteItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: SalesMailService,
          useValue: mockSalesMailService,
        },
        {
          provide: ClientPortalService,
          useValue: mockClientPortalService,
        },
        {
          provide: StockMovementsService,
          useValue: mockStockMovementsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
