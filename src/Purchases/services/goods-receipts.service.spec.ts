import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoodsReceiptsService } from './goods-receipts.service';
import { GoodsReceipt } from '../entities/goods-receipt.entity';
import { GoodsReceiptItem } from '../entities/goods-receipt-item.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { SupplierPOItem } from '../entities/supplier-po-item.entity';
import { Product } from '../../stock/entities/product.entity';
import { SupplierPOsService } from './supplier-pos.service';
import { StockMovementsService } from '../../stock/services/stock-movements/stock-movements.service';
import { DataSource } from 'typeorm';

describe('GoodsReceiptsService', () => {
  let service: GoodsReceiptsService;

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

  const mockSupplierPOsService = {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
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
        GoodsReceiptsService,
        {
          provide: getRepositoryToken(GoodsReceipt),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(GoodsReceiptItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPOItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: SupplierPOsService,
          useValue: mockSupplierPOsService,
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

    service = module.get<GoodsReceiptsService>(GoodsReceiptsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
