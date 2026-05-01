import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SupplierOnboardingService } from './supplier-onboarding.service';
import { Supplier } from '../entities/supplier.entity';
import { Business } from '../../businesses/entities/business.entity';
import { PurchaseMailService } from './purchase-mail.service';

describe('SupplierOnboardingService', () => {
  let service: SupplierOnboardingService;
  let supplierRepo: Repository<Supplier>;
  let mailService: PurchaseMailService;

  const mockSupplierRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBusinessRepo = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return 'default-value';
    }),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'test-token'),
    verify: jest.fn(),
  };

  const mockMailService = {
    sendSupplierInvitation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierOnboardingService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepo,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PurchaseMailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<SupplierOnboardingService>(SupplierOnboardingService);
    supplierRepo = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    mailService = module.get<PurchaseMailService>(PurchaseMailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have supplier repository injected', () => {
    expect(supplierRepo).toBeDefined();
  });

  it('should have mail service injected', () => {
    expect(mailService).toBeDefined();
  });
});
