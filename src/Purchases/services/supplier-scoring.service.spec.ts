import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierScoringService } from './supplier-scoring.service';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { GoodsReceipt } from '../entities/goods-receipt.entity';
import { SupplierPayment } from '../../payments/entities/supplier-payment.entity';

describe('SupplierScoringService', () => {
  let service: SupplierScoringService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierScoringService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(GoodsReceipt),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SupplierPayment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SupplierScoringService>(SupplierScoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
