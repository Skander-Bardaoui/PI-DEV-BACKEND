import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice, InvoiceStatus, InvoiceType } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { SalesMailService } from './sales-mail.service';
import { SalesEmailAiService } from './sales-email-ai.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepo: Repository<Invoice>;
  let itemRepo: Repository<InvoiceItem>;
  let dataSource: DataSource;
  let mailService: SalesMailService;
  let emailAiService: SalesEmailAiService;

  const mockInvoiceRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockItemRepo = {
    delete: jest.fn(),
  };

  const mockManager = {
    create: jest.fn((entity, data) => data),
    save: jest.fn((entity, data) => Promise.resolve(data)),
    findOne: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((callback) => callback(mockManager)),
    query: jest.fn(),
  };

  const mockMailService = {
    sendInvoiceEmail: jest.fn(),
    sendPaymentReminder: jest.fn(),
  };

  const mockEmailAiService = {
    generateEmailDraft: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const businessId = 'business-123';
  const invoiceId = 'invoice-456';
  const clientId = 'client-789';

  const mockInvoice: Partial<Invoice> = {
    id: invoiceId,
    business_id: businessId,
    client_id: clientId,
    invoice_number: 'FAC-2026-0001',
    type: InvoiceType.NORMAL,
    status: InvoiceStatus.DRAFT,
    date: new Date('2026-01-01'),
    due_date: new Date('2026-01-31'),
    subtotal_ht: 1000,
    tax_amount: 190,
    timbre_fiscal: 1.000,
    total_ttc: 1190,
    net_amount: 1191.000,
    paid_amount: 0,
    items: [],
    client: {
      id: clientId,
      name: 'Test Client',
      email: 'client@test.com',
    } as any,
  };

  const mockInvoiceItem = {
    id: 'item-1',
    invoice_id: invoiceId,
    description: 'Test Product',
    quantity: 10,
    unit_price: 100,
    tax_rate_value: 19,
    line_total_ht: 1000,
    line_tax: 190,
    line_total_ttc: 1190,
    sort_order: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(InvoiceItem),
          useValue: mockItemRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: SalesMailService,
          useValue: mockMailService,
        },
        {
          provide: SalesEmailAiService,
          useValue: mockEmailAiService,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    invoiceRepo = module.get<Repository<Invoice>>(getRepositoryToken(Invoice));
    itemRepo = module.get<Repository<InvoiceItem>>(getRepositoryToken(InvoiceItem));
    dataSource = module.get<DataSource>(DataSource);
    mailService = module.get<SalesMailService>(SalesMailService);
    emailAiService = module.get<SalesEmailAiService>(SalesEmailAiService);

    jest.clearAllMocks();
    mockInvoiceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an invoice with items', async () => {
      const createDto: CreateInvoiceDto = {
        client_id: clientId,
        date: new Date('2026-01-01'),
        due_date: new Date('2026-01-31'),
        items: [
          {
            description: 'Test Product',
            quantity: 10,
            unit_price: 100,
            tax_rate_value: 19,
          },
        ],
      };

      const mockManager = {
        create: jest.fn((entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve(data)),
        findOne: jest.fn().mockResolvedValue({ ...mockInvoice, items: [mockInvoiceItem] }),
        query: jest.fn().mockResolvedValue([{ next_seq: 1 }]),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.create(businessId, createDto);

      expect(result).toBeDefined();
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should calculate totals correctly', async () => {
      const createDto: CreateInvoiceDto = {
        client_id: clientId,
        items: [
          {
            description: 'Product 1',
            quantity: 10,
            unit_price: 100,
            tax_rate_value: 19,
          },
          {
            description: 'Product 2',
            quantity: 5,
            unit_price: 200,
            tax_rate_value: 19,
          },
        ],
      };

      const mockManager = {
        create: jest.fn((entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve(data)),
        findOne: jest.fn().mockResolvedValue(mockInvoice),
        query: jest.fn().mockResolvedValue([{ next_seq: 1 }]),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await service.create(businessId, createDto);

      expect(mockManager.create).toHaveBeenCalledWith(
        Invoice,
        expect.objectContaining({
          subtotal_ht: 2000, // (10*100) + (5*200)
          tax_amount: 380, // 2000 * 0.19
          net_amount: 2381.000, // 2000 + 380 + 1
        }),
      );
    });

    it('should set default status to DRAFT', async () => {
      const createDto: CreateInvoiceDto = {
        client_id: clientId,
        items: [],
      };

      const mockManager = {
        create: jest.fn((entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve(data)),
        findOne: jest.fn().mockResolvedValue(mockInvoice),
        query: jest.fn().mockResolvedValue([{ next_seq: 1 }]),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await service.create(businessId, createDto);

      expect(mockManager.create).toHaveBeenCalledWith(
        Invoice,
        expect.objectContaining({
          status: InvoiceStatus.DRAFT,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const mockInvoices = [mockInvoice];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockInvoices, 1]);

      const result = await service.findAll(businessId, { page: 1, limit: 20 });

      expect(result).toEqual({
        data: mockInvoices,
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      });
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, { status: 'DRAFT,SENT' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invoice.status IN (:...statuses)',
        { statuses: ['DRAFT', 'SENT'] },
      );
    });

    it('should filter by client_id', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, { client_id: clientId });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invoice.client_id = :client_id',
        { client_id: clientId },
      );
    });

    it('should filter by search term', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(businessId, { search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an invoice by id', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne(businessId, invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(mockInvoiceRepo.findOne).toHaveBeenCalledWith({
        where: { id: invoiceId, business_id: businessId },
        relations: ['items', 'client', 'business'],
      });
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(businessId, invoiceId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a DRAFT invoice', async () => {
      const updateDto: UpdateInvoiceDto = {
        notes: 'Updated notes',
      };

      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);

      const mockManager = {
        save: jest.fn((entity, data) => Promise.resolve(data)),
        findOne: jest.fn().mockResolvedValue({ ...mockInvoice, notes: 'Updated notes' }),
        delete: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      const result = await service.update(businessId, invoiceId, updateDto);

      expect(result.notes).toBe('Updated notes');
    });

    it('should throw BadRequestException if invoice is not DRAFT', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });

      await expect(service.update(businessId, invoiceId, {})).rejects.toThrow(BadRequestException);
    });

    it('should recalculate totals when items are updated', async () => {
      const updateDto: UpdateInvoiceDto = {
        items: [
          {
            description: 'Updated Product',
            quantity: 20,
            unit_price: 150,
            tax_rate_value: 19,
          },
        ],
      };

      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);

      const mockManager = {
        save: jest.fn((entity, data) => Promise.resolve(data)),
        findOne: jest.fn().mockResolvedValue(mockInvoice),
        delete: jest.fn(),
        create: jest.fn((entity, data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));

      await service.update(businessId, invoiceId, updateDto);

      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('should mark invoice as SENT', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);
      mockInvoiceRepo.save.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });

      const result = await service.send(businessId, invoiceId);

      expect(result.status).toBe(InvoiceStatus.SENT);
    });

    it('should set sent_at timestamp', async () => {
      const draftInvoice = { ...mockInvoice, status: InvoiceStatus.DRAFT };
      mockInvoiceRepo.findOne.mockResolvedValue(draftInvoice);
      mockInvoiceRepo.save.mockResolvedValue({
        ...draftInvoice,
        status: InvoiceStatus.SENT,
        sent_at: new Date(),
      });

      const result = await service.send(businessId, invoiceId);

      expect(result.sent_at).toBeDefined();
    });
  });

  describe('sendByEmail', () => {
    it('should send invoice by email and mark as SENT', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);
      mockInvoiceRepo.save.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });
      mockMailService.sendInvoiceEmail.mockResolvedValue(undefined);

      const result = await service.sendByEmail(businessId, invoiceId, 'client@test.com');

      expect(mailService.sendInvoiceEmail).toHaveBeenCalled();
      expect(result.status).toBe(InvoiceStatus.SENT);
    });

    it('should use client email if not provided', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);
      mockInvoiceRepo.save.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });
      mockMailService.sendInvoiceEmail.mockResolvedValue(undefined);

      await service.sendByEmail(businessId, invoiceId);

      expect(mailService.sendInvoiceEmail).toHaveBeenCalledWith(
        mockInvoice,
        'client@test.com',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should throw BadRequestException if no email provided', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, client: { ...mockInvoice.client, email: null } });

      await expect(service.sendByEmail(businessId, invoiceId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendPaymentReminder', () => {
    it('should send payment reminder for OVERDUE invoice', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.OVERDUE });
      mockMailService.sendPaymentReminder.mockResolvedValue(undefined);

      await service.sendPaymentReminder(businessId, invoiceId);

      expect(mailService.sendPaymentReminder).toHaveBeenCalledWith(
        expect.objectContaining({ status: InvoiceStatus.OVERDUE }),
        'client@test.com',
      );
    });

    it('should throw BadRequestException if invoice is not OVERDUE or SENT', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.PAID });

      await expect(service.sendPaymentReminder(businessId, invoiceId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateEmailDraft', () => {
    it('should generate email draft in French', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);
      mockEmailAiService.generateEmailDraft.mockResolvedValue({
        subject: 'Facture FAC-2026-0001',
        body: 'Bonjour...',
      });

      const result = await service.generateEmailDraft(businessId, invoiceId, 'fr', false);

      expect(result).toEqual({
        subject: 'Facture FAC-2026-0001',
        body: 'Bonjour...',
      });
      expect(emailAiService.generateEmailDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'fr',
          isReminder: false,
        }),
      );
    });

    it('should generate reminder email draft', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);
      mockEmailAiService.generateEmailDraft.mockResolvedValue({
        subject: 'Rappel - Facture FAC-2026-0001',
        body: 'Rappel...',
      });

      await service.generateEmailDraft(businessId, invoiceId, 'fr', true);

      expect(emailAiService.generateEmailDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          isReminder: true,
        }),
      );
    });
  });

  describe('markPaid', () => {
    it('should mark invoice as PAID', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });
      mockInvoiceRepo.save.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.PAID });

      const result = await service.markPaid(businessId, invoiceId);

      expect(result.status).toBe(InvoiceStatus.PAID);
    });
  });

  describe('markPartiallyPaid', () => {
    it('should mark invoice as PARTIALLY_PAID', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });
      mockInvoiceRepo.save.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.PARTIALLY_PAID });

      const result = await service.markPartiallyPaid(businessId, invoiceId);

      expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
    });
  });

  describe('cancel', () => {
    it('should cancel an invoice', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.DRAFT });
      mockInvoiceRepo.save.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.CANCELLED });

      const result = await service.cancel(businessId, invoiceId);

      expect(result.status).toBe(InvoiceStatus.CANCELLED);
    });
  });

  describe('delete', () => {
    it('should delete a DRAFT invoice', async () => {
      const draftInvoice = { ...mockInvoice, status: InvoiceStatus.DRAFT };
      mockInvoiceRepo.findOne.mockResolvedValue(draftInvoice);
      mockDataSource.query.mockResolvedValue([]);
      mockInvoiceRepo.delete.mockResolvedValue({ affected: 1 });

      await service.delete(businessId, invoiceId);

      expect(mockInvoiceRepo.delete).toHaveBeenCalledWith({ id: invoiceId, business_id: businessId });
    });

    it('should throw BadRequestException if invoice is not DRAFT', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });

      await expect(service.delete(businessId, invoiceId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invoice is referenced by sales order', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);
      mockDataSource.query.mockResolvedValue([{ id: 'order-123' }]);

      await expect(service.delete(businessId, invoiceId)).rejects.toThrow(BadRequestException);
    });
  });
});
