import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { QuotePortalService } from './quote-portal.service';
import { QuotePortalToken } from '../entities/quote-portal-token.entity';
import { Quote } from '../entities/quote.entity';
import { Client } from '../entities/client.entity';
import { Business } from '../../businesses/entities/business.entity';
import { QuotesService } from './quotes.service';
import { DataSource } from 'typeorm';

describe('QuotePortalService', () => {
  let service: QuotePortalService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'SMTP_HOST') return 'smtp.test.com';
      return null;
    }),
  };

  const mockQuotesService = {
    findOne: jest.fn(),
    update: jest.fn(),
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
        QuotePortalService,
        {
          provide: getRepositoryToken(QuotePortalToken),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Quote),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: QuotesService,
          useValue: mockQuotesService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<QuotePortalService>(QuotePortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
