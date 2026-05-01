import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Client } from '../entities/client.entity';
import { SalesMailService } from './sales-mail.service';
import { SalesEmailAiService } from './sales-email-ai.service';
import { DataSource } from 'typeorm';

describe('InvoicesService', () => {
  let service: InvoicesService;

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
    sendInvoice: jest.fn(),
  };

  const mockSalesEmailAiService = {
    generateEmailContent: jest.fn(),
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
      },
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(InvoiceItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
        {
          provide: SalesMailService,
          useValue: mockSalesMailService,
        },
        {
          provide: SalesEmailAiService,
          useValue: mockSalesEmailAiService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
