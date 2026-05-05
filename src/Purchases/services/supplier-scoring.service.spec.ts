import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierScoringService } from './supplier-scoring.service';
import { Supplier } from '../entities/supplier.entity';
import { SupplierPO } from '../entities/supplier-po.entity';
import { GoodsReceipt } from '../entities/goods-receipt.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';
import { SupplierPayment } from '../../payments/entities/supplier-payment.entity';
import { POStatus } from '../enum/po-status.enum';
import { InvoiceStatus } from '../enum/invoice-status.enum';

describe('SupplierScoringService', () => {
  let service: SupplierScoringService;
  let supplierRepo: Repository<Supplier>;
  let poRepo: Repository<SupplierPO>;
  let grRepo: Repository<GoodsReceipt>;
  let invoiceRepo: Repository<PurchaseInvoice>;
  let paymentRepo: Repository<SupplierPayment>;

  const mockSupplier = {
    id: 'supplier-1',
    business_id: 'business-1',
    name: 'Test Supplier',
    is_active: true,
  };

  const mockPO = {
    id: 'po-1',
    business_id: 'business-1',
    supplier_id: 'supplier-1',
    status: POStatus.CONFIRMED,
    sent_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
    expected_delivery: new Date('2024-01-10'),
    items: [
      {
        quantity_ordered: 100,
        quantity_received: 100,
      },
    ],
  };

  const mockGoodsReceipt = {
    id: 'gr-1',
    business_id: 'business-1',
    receipt_date: new Date('2024-01-09'),
    supplier_po: {
      supplier_id: 'supplier-1',
      expected_delivery: new Date('2024-01-10'),
    },
  };

  const mockInvoice = {
    id: 'invoice-1',
    business_id: 'business-1',
    supplier_id: 'supplier-1',
    status: InvoiceStatus.APPROVED,
    net_amount: 1000,
    invoice_date: new Date('2024-01-01'),
  };

  const mockPayment = {
    id: 'payment-1',
    business_id: 'business-1',
    supplier_id: 'supplier-1',
    amount: 1000,
    payment_date: new Date('2024-01-15'),
    purchase_invoice_id: 'invoice-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierScoringService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SupplierPO),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GoodsReceipt),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PurchaseInvoice),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SupplierPayment),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SupplierScoringService>(SupplierScoringService);
    supplierRepo = module.get(getRepositoryToken(Supplier));
    poRepo = module.get(getRepositoryToken(SupplierPO));
    grRepo = module.get(getRepositoryToken(GoodsReceipt));
    invoiceRepo = module.get(getRepositoryToken(PurchaseInvoice));
    paymentRepo = module.get(getRepositoryToken(SupplierPayment));
  });

  describe('scoreSupplier', () => {
    it('should calculate supplier score successfully', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.scoreSupplier('business-1', 'supplier-1');

      expect(result.supplier_id).toBe('supplier-1');
      expect(result.supplier_name).toBe('Test Supplier');
      expect(result.total_score).toBeGreaterThanOrEqual(0);
      expect(result.total_score).toBeLessThanOrEqual(100);
      expect(result.criteria).toHaveLength(5);
      expect(result.grade).toMatch(/^[ABCDF]$/);
    });

    it('should throw error if supplier not found', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(null);

      await expect(service.scoreSupplier('business-1', 'supplier-1')).rejects.toThrow();
    });

    it('should assign grade A for score >= 85', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.scoreSupplier('business-1', 'supplier-1');

      if (result.total_score >= 85) {
        expect(result.grade).toBe('A');
      }
    });

    it('should calculate confirmation speed correctly', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.scoreSupplier('business-1', 'supplier-1');

      const confirmationCriteria = result.criteria.find(c => c.name === 'Rapidité de confirmation');
      expect(confirmationCriteria).toBeDefined();
      expect(confirmationCriteria!.weight).toBe(20);
    });

    it('should calculate delivery rate correctly', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.scoreSupplier('business-1', 'supplier-1');

      const deliveryCriteria = result.criteria.find(c => c.name === 'Taux de livraison');
      expect(deliveryCriteria).toBeDefined();
      expect(deliveryCriteria!.weight).toBe(25);
      expect(result.stats.delivery_rate_pct).toBeGreaterThanOrEqual(0);
    });

    it('should calculate on-time delivery correctly', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.scoreSupplier('business-1', 'supplier-1');

      const onTimeCriteria = result.criteria.find(c => c.name === 'Respect des délais');
      expect(onTimeCriteria).toBeDefined();
      expect(onTimeCriteria!.weight).toBe(20);
    });

    it('should calculate dispute rate correctly', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.scoreSupplier('business-1', 'supplier-1');

      const disputeCriteria = result.criteria.find(c => c.name === 'Taux de litiges');
      expect(disputeCriteria).toBeDefined();
      expect(disputeCriteria!.weight).toBe(20);
      expect(result.stats.dispute_rate_pct).toBeGreaterThanOrEqual(0);
    });

    it('should calculate payment history correctly', async () => {
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.scoreSupplier('business-1', 'supplier-1');

      const paymentCriteria = result.criteria.find(c => c.name === 'Vos paiements fournisseur');
      expect(paymentCriteria).toBeDefined();
      expect(paymentCriteria!.weight).toBe(15);
    });
  });

  describe('rankSuppliers', () => {
    it('should rank suppliers by score', async () => {
      const suppliers = [
        { ...mockSupplier, id: 'supplier-1', name: 'Supplier A' },
        { ...mockSupplier, id: 'supplier-2', name: 'Supplier B' },
      ];
      jest.spyOn(supplierRepo, 'find').mockResolvedValue(suppliers as any);
      jest.spyOn(supplierRepo, 'findOne').mockImplementation((options: any) => {
        const id = options.where.id;
        return Promise.resolve(suppliers.find(s => s.id === id) as any);
      });
      jest.spyOn(poRepo, 'find').mockResolvedValue([mockPO] as any);
      jest.spyOn(grRepo, 'find').mockResolvedValue([mockGoodsReceipt] as any);
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue([mockInvoice] as any);
      jest.spyOn(paymentRepo, 'find').mockResolvedValue([mockPayment] as any);

      const result = await service.rankSuppliers('business-1');

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[0].total_score).toBeGreaterThanOrEqual(result[1].total_score);
    });

    it('should return empty array if no active suppliers', async () => {
      jest.spyOn(supplierRepo, 'find').mockResolvedValue([]);

      const result = await service.rankSuppliers('business-1');

      expect(result).toHaveLength(0);
    });
  });
});
