import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientOnboardingService } from './client-onboarding.service';
import { Client } from '../entities/client.entity';
import { Business } from '../../businesses/entities/business.entity';

describe('ClientOnboardingService', () => {
  let service: ClientOnboardingService;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'test-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientOnboardingService,
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
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<ClientOnboardingService>(ClientOnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
