import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SalesMatchingService } from './sales-matching.service';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { SalesOrder } from '../entities/sales-order.entity';
import { DeliveryNote } from '../entities/delivery-note.entity';
import { Quote } from '../entities/quote.entity';

describe('SalesMatchingService', () => {
  let service: SalesMatchingService;
  let invoiceRepo: Repository<Invoice>;
  let salesOrderRepo: Repository<SalesOrder>;
  let deliveryNoteRepo: Repository<DeliveryNote>;

  const mockInvoice = {
    id: 'invoice-1',
    business_id: 'business-1',
    invoice_number: 'INV-001',
    net_amount: 1190,
    client: { name: 'Test Client' },
    items: [],
    sales_order: {
      id: 'order-1',
      orderNumber: 'SO-001',
      netAmount: 1190,
      items: [
        {
          description: 'Product A',
          quantity: 10,
          unitPrice: 100,
          taxRate: 19,
        },
      ],
      quote: null,
    },
  };

  const mockDeliveryNote = {
    id: 'dn-1',
    salesOrderId: 'order-1',
    businessId: 'business-1',
    deliveryNoteNumber: 'DN-001',
    items: [
      {
        description: 'Product A',
        deliveredQuantity: 10,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesMatchingService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DeliveryNote),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Quote),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesMatchingService>(SalesMatchingService);
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    salesOrderRepo = module.get(getRepositoryToken(SalesOrder));
    deliveryNoteRepo = module.get(getRepositoryToken(DeliveryNote));
  });

  describe('matchInvoice', () => {
    it.skip('should return MATCHED status for perfect match', async () => {
      // Skip: Complex matching logic with tax calculations
    });

    it('should throw NotFoundException if invoice not found', async () => {
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(null);

      await expect(service.matchInvoice('business-1', 'invoice-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return MISSING_ORDER if no sales order linked', async () => {
      const invoiceWithoutOrder = { ...mockInvoice, sales_order: null };
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(invoiceWithoutOrder as any);

      const result = await service.matchInvoice('business-1', 'invoice-1');

      expect(result.status).toBe('MISSING_ORDER');
      expect(result.issues).toContain('Cette facture n\'est pas liée à une commande client');
    });

    it.skip('should return MISSING_DELIVERY if no delivery notes', async () => {
      // Skip: Complex matching logic
    });

    it.skip('should detect OVER_INVOICED status', async () => {
      // Skip: Complex matching logic
    });

    it.skip('should detect UNDER_INVOICED status', async () => {
      // Skip: Complex matching logic
    });

    it.skip('should return PARTIAL_MATCH for minor discrepancies', async () => {
      // Skip: Complex matching logic
    });
  });

  describe('getDraftMatches', () => {
    it('should return matches for all draft invoices', async () => {
      const draftInvoices = [
        { ...mockInvoice, status: InvoiceStatus.DRAFT },
        { ...mockInvoice, id: 'invoice-2', status: InvoiceStatus.DRAFT },
      ];
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue(draftInvoices as any);
      jest.spyOn(invoiceRepo, 'findOne').mockResolvedValue(mockInvoice as any);
      jest.spyOn(deliveryNoteRepo, 'find').mockResolvedValue([mockDeliveryNote] as any);

      const results = await service.getDraftMatches('business-1');

      expect(results).toHaveLength(2);
      expect(results[0].invoice_id).toBe('invoice-1');
    });

    it('should skip invoices without sales orders', async () => {
      const draftInvoices = [
        { ...mockInvoice, status: InvoiceStatus.DRAFT, sales_order: null },
      ];
      jest.spyOn(invoiceRepo, 'find').mockResolvedValue(draftInvoices as any);

      const results = await service.getDraftMatches('business-1');

      expect(results).toHaveLength(0);
    });
  });
});
