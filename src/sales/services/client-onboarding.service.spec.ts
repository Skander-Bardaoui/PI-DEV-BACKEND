import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientOnboardingService } from './client-onboarding.service';
import { Client } from '../entities/client.entity';
import { Business } from '../../businesses/entities/business.entity';

describe('ClientOnboardingService', () => {
  let service: ClientOnboardingService;
  let clientRepo: Repository<Client>;
  let businessRepo: Repository<Business>;
  let jwtService: JwtService;

  const mockBusiness = {
    id: 'business-1',
    name: 'Test Business',
    email: 'business@test.com',
  };

  const mockClient = {
    id: 'client-1',
    business_id: 'business-1',
    name: 'Test Client',
    email: 'client@test.com',
    phone: '+216 12345678',
  };

  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientOnboardingService,
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                GMAIL_USER: 'test@gmail.com',
                GMAIL_PASS: 'password',
                FRONTEND_URL: 'http://localhost:5173',
                JWT_CLIENT_ONBOARDING_SECRET: 'test_secret',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ClientOnboardingService>(ClientOnboardingService);
    clientRepo = module.get(getRepositoryToken(Client));
    businessRepo = module.get(getRepositoryToken(Business));
    jwtService = module.get(JwtService);

    // Mock transporter
    service['transporter'] = mockTransporter as any;
  });

  describe('inviteClient', () => {
    it('should send invitation email successfully', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(clientRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-token');

      const result = await service.inviteClient('business-1', {
        email: 'newclient@test.com',
        name: 'New Client',
      });

      expect(result.message).toContain('newclient@test.com');
      expect(result.token).toBe('test-token');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if business not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.inviteClient('business-1', { email: 'client@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if client already exists', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(clientRepo, 'findOne').mockResolvedValue(mockClient as any);

      await expect(
        service.inviteClient('business-1', { email: 'client@test.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInvitationDetails', () => {
    it('should return invitation details for valid token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        businessId: 'business-1',
        email: 'client@test.com',
        name: 'Test Client',
      });
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);

      const result = await service.getInvitationDetails('valid-token');

      expect(result.email).toBe('client@test.com');
      expect(result.name).toBe('Test Client');
      expect(result.businessName).toBe('Test Business');
    });

    it('should throw BadRequestException for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.getInvitationDetails('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if business not found', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        businessId: 'business-1',
        email: 'client@test.com',
      });
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getInvitationDetails('valid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeOnboarding', () => {
    it('should create client successfully', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        businessId: 'business-1',
        email: 'client@test.com',
      });
      jest.spyOn(clientRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(clientRepo, 'create').mockReturnValue(mockClient as any);
      jest.spyOn(clientRepo, 'save').mockResolvedValue(mockClient as any);

      const result = await service.completeOnboarding('valid-token', {
        name: 'Test Client',
        email: 'client@test.com',
        phone: '+216 12345678',
      });

      expect(result).toEqual(mockClient);
      expect(clientRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email mismatch', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        businessId: 'business-1',
        email: 'client@test.com',
      });

      await expect(
        service.completeOnboarding('valid-token', {
          name: 'Test Client',
          email: 'different@test.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if client already exists', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        businessId: 'business-1',
        email: 'client@test.com',
      });
      jest.spyOn(clientRepo, 'findOne').mockResolvedValue(mockClient as any);

      await expect(
        service.completeOnboarding('valid-token', {
          name: 'Test Client',
          email: 'client@test.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
