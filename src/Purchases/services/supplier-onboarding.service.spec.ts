import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupplierOnboardingService } from './supplier-onboarding.service';
import { Supplier } from '../entities/supplier.entity';
import { Business } from '../../businesses/entities/business.entity';

describe('SupplierOnboardingService', () => {
  let service: SupplierOnboardingService;
  let supplierRepo: Repository<Supplier>;
  let businessRepo: Repository<Business>;
  let jwtService: JwtService;

  const mockBusiness = {
    id: 'business-1',
    name: 'Test Business',
    email: 'business@test.com',
  };

  const mockSupplier = {
    id: 'supplier-1',
    business_id: 'business-1',
    name: 'Test Supplier',
    email: 'supplier@test.com',
    phone: '+216 12345678',
    is_active: true,
  };

  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierOnboardingService,
        {
          provide: getRepositoryToken(Supplier),
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
                JWT_PORTAL_SECRET: 'portal_secret',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupplierOnboardingService>(SupplierOnboardingService);
    supplierRepo = module.get(getRepositoryToken(Supplier));
    businessRepo = module.get(getRepositoryToken(Business));
    jwtService = module.get(JwtService);

    // Mock transporter
    service['transporter'] = mockTransporter as any;
  });

  describe('sendInvitation', () => {
    it('should send invitation email successfully', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-token');

      const result = await service.sendInvitation('business-1', 'newsupplier@test.com', 'New Supplier');

      expect(result.message).toContain('newsupplier@test.com');
      expect(result.token).toBe('test-token');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if business not found', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.sendInvitation('business-1', 'supplier@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if supplier already exists', async () => {
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);

      await expect(
        service.sendInvitation('business-1', 'supplier@test.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInvitationData', () => {
    it('should return invitation data for valid token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        business_id: 'business-1',
        email: 'supplier@test.com',
        name: 'Test Supplier',
        type: 'supplier_invite',
      });
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);

      const result = await service.getInvitationData('valid-token');

      expect(result.email).toBe('supplier@test.com');
      expect(result.name).toBe('Test Supplier');
      expect(result.business_name).toBe('Test Business');
    });

    it('should throw BadRequestException for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.getInvitationData('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for wrong token type', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        business_id: 'business-1',
        email: 'supplier@test.com',
        type: 'wrong_type',
      });

      await expect(service.getInvitationData('valid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeInvitation', () => {
    it('should create supplier successfully', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        business_id: 'business-1',
        email: 'supplier@test.com',
        type: 'supplier_invite',
      });
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(supplierRepo, 'create').mockReturnValue(mockSupplier as any);
      jest.spyOn(supplierRepo, 'save').mockResolvedValue(mockSupplier as any);
      jest.spyOn(businessRepo, 'findOne').mockResolvedValue(mockBusiness as any);

      const result = await service.completeInvitation('valid-token', {
        name: 'Test Supplier',
        phone: '+216 12345678',
        matricule_fiscal: '1234567ABC123',
        rib: '12345678901234567890',
        bank_name: 'Test Bank',
      });

      expect(result).toEqual(mockSupplier);
      expect(supplierRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if name is empty', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        business_id: 'business-1',
        email: 'supplier@test.com',
        type: 'supplier_invite',
      });

      await expect(
        service.completeInvitation('valid-token', { name: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if supplier already exists', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        business_id: 'business-1',
        email: 'supplier@test.com',
        type: 'supplier_invite',
      });
      jest.spyOn(supplierRepo, 'findOne').mockResolvedValue(mockSupplier as any);

      await expect(
        service.completeInvitation('valid-token', { name: 'Test Supplier' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.completeInvitation('invalid-token', { name: 'Test Supplier' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
