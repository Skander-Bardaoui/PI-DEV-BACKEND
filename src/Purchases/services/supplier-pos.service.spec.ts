import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupplierPOsService } from './supplier-pos.service';
import { SupplierPO } from '../entities/supplier-po.entity';
import { SupplierPOItem } from '../entities/supplier-po-item.entity';
import { Supplier } from '../entities/supplier.entity';
import { Product } from '../../stock/entities/product.entity';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
import { PurchaseMailService } from './purchase-mail.service';
import { DataSource } from 'typeorm';

describe('SupplierPOsService', () => {
  let service: SupplierPOsService;

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

  const mockPurchaseMailService = {
    sendPOToSupplier: jest.fn(),
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

  const mockSuppliersService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  const mockMlPredictionService = {
    predict: jest.fn(),
  };

  const mockStockMovementsService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierPOsService,
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPOItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: mockRepository,
        },
        {
          provide: 'SuppliersService',
          useValue: mockSuppliersService,
        },
        {
          provide: 'MlPredictionService',
          useValue: mockMlPredictionService,
        },
        {
          provide: 'StockMovementsService',
          useValue: mockStockMovementsService,
        },
        {
          provide: PurchaseMailService,
          useValue: mockPurchaseMailService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SupplierPOsService>(SupplierPOsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
