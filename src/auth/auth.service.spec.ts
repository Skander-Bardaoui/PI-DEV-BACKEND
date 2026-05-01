import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-token'),
}));
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken, TokenType } from './entities/password-reset-token.entity';
import { EmailService } from '../email/email.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMember } from '../businesses/entities/business-member.entity';
import { TaxRate } from '../businesses/entities/tax-rate.entity';
import { Role } from '../users/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let configService: any;
  let emailService: any;
  let refreshTokenRepo: any;
  let resetTokenRepo: any;
  let usersRepository: any;
  let tenantsRepository: any;
  let businessesRepository: any;
  let businessMembersRepository: any;
  let taxRatesRepository: any;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn((entity, data) => data),
      save: jest.fn((data) => ({ ...data, id: 'generated-id' })),
      connection: {
        createQueryRunner: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateUser: jest.fn(),
      verify: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key, defaultValue) => {
        const config = {
          JWT_ACCESS_SECRET: 'test-access-secret',
          JWT_ACCESS_EXPIRY: '15m',
          NODE_ENV: 'test',
        };
        return config[key] || defaultValue;
      }),
    };

    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    refreshTokenRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    resetTokenRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      manager: {
        connection: {
          createQueryRunner: jest.fn(() => mockQueryRunner),
        },
      },
    };

    tenantsRepository = {
      findOne: jest.fn(),
    };

    businessesRepository = {
      findOne: jest.fn(),
    };

    businessMembersRepository = {
      findOne: jest.fn(),
    };

    taxRatesRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepo,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: resetTokenRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: tenantsRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: businessesRepository,
        },
        {
          provide: getRepositoryToken(BusinessMember),
          useValue: businessMembersRepository,
        },
        {
          provide: getRepositoryToken(TaxRate),
          useValue: taxRatesRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('devrait retourner l\'utilisateur si les credentials sont valides', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 12),
        firstName: 'Test',
        lastName: 'User',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('devrait retourner null si le mot de passe est incorrect', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 12),
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phone_number: '+21612345678',
      tenant: {
        name: 'Test Tenant',
        domain: 'test-tenant',
        contactEmail: 'contact@test.com',
        description: 'Test description',
      },
      business: {
        name: 'Test Business',
        tax_id: '123456',
        currency: 'TND',
        address: 'Test Address',
        email: 'business@test.com',
      },
      taxRate: {
        name: 'TVA 19%',
        rate: 19,
        is_default: true,
      },
    };

    const mockRes = {
      cookie: jest.fn(),
    } as any;

    beforeEach(() => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
    });

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const result = await service.register(registerDto, mockRes);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('devrait rejeter si l\'email existe déjà', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto, mockRes)).rejects.toThrow(
        'Email already registered',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('devrait rollback en cas d\'erreur', async () => {
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto, mockRes)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('devrait générer des tokens et retourner les infos utilisateur', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.BUSINESS_OWNER,
      };

      const mockRes = {
        cookie: jest.fn(),
      } as any;

      jwtService.sign.mockReturnValue('mock-jwt-token');
      refreshTokenRepo.save.mockResolvedValue({ token: 'mock-refresh-token' });
      tenantsRepository.findOne.mockResolvedValue({ id: 'tenant-1' });
      businessesRepository.findOne.mockResolvedValue({ id: 'business-1' });

      const result = await service.login(mockUser, mockRes);

      expect(result).toHaveProperty('message', 'Login successful');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshTokens', () => {
    it('devrait rafraîchir les tokens avec succès', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.BUSINESS_OWNER,
      };

      const mockTokenRecord = {
        id: 'token-1',
        token: 'valid-refresh-token',
        user: mockUser,
        is_revoked: false,
        expires_at: new Date(Date.now() + 86400000),
      };

      const mockRes = {
        cookie: jest.fn(),
      } as any;

      refreshTokenRepo.findOne.mockResolvedValue(mockTokenRecord);
      refreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      jwtService.sign.mockReturnValue('new-access-token');
      refreshTokenRepo.save.mockResolvedValue({ token: 'new-refresh-token' });
      tenantsRepository.findOne.mockResolvedValue({ id: 'tenant-1' });
      businessesRepository.findOne.mockResolvedValue({ id: 'business-1' });

      const result = await service.refreshTokens('valid-refresh-token', mockRes);

      expect(result).toHaveProperty('message', 'Tokens refreshed successfully');
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        is_revoked: true,
      });
    });

    it('devrait rejeter un token invalide', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      const mockRes = { cookie: jest.fn() } as any;

      await expect(service.refreshTokens('invalid-token', mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('devrait rejeter un token révoqué', async () => {
      const mockTokenRecord = {
        id: 'token-1',
        token: 'revoked-token',
        is_revoked: true,
        expires_at: new Date(Date.now() + 86400000),
      };

      refreshTokenRepo.findOne.mockResolvedValue(mockTokenRecord);

      const mockRes = { cookie: jest.fn() } as any;

      await expect(service.refreshTokens('revoked-token', mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('devrait révoquer le refresh token', async () => {
      const mockTokenRecord = {
        id: 'token-1',
        token: 'valid-token',
      };

      refreshTokenRepo.findOne.mockResolvedValue(mockTokenRecord);
      refreshTokenRepo.update.mockResolvedValue({ affected: 1 });

      await service.logout('valid-token');

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        is_revoked: true,
      });
    });

    it('ne devrait pas échouer si le token n\'existe pas', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.logout('nonexistent-token')).resolves.not.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('devrait mettre à jour le profil utilisateur', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password_hash: 'hash',
      };

      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      usersService.findById.mockResolvedValue(mockUser);
      usersService.updateUser.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('user-1', updateDto);

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    it('devrait rejeter si l\'email est déjà utilisé', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      const existingUser = {
        id: 'user-2',
        email: 'existing@example.com',
      };

      usersService.findById.mockResolvedValue(mockUser);
      usersService.findByEmail.mockResolvedValue(existingUser);

      await expect(
        service.updateProfile('user-1', { email: 'existing@example.com' }),
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('verifyEmail', () => {
    it('devrait vérifier l\'email avec succès', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockTokenRecord = {
        id: 'token-1',
        token: 'valid-token',
        user: mockUser,
        type: TokenType.EMAIL_VERIFICATION,
        is_used: false,
        expires_at: new Date(Date.now() + 86400000),
      };

      resetTokenRepo.findOne.mockResolvedValue(mockTokenRecord);
      usersService.verify.mockResolvedValue(undefined);
      resetTokenRepo.update.mockResolvedValue({ affected: 1 });

      await service.verifyEmail('valid-token');

      expect(usersService.verify).toHaveBeenCalledWith(mockUser.id);
      expect(resetTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, { is_used: true });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it('devrait rejeter un token invalide', async () => {
      resetTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('devrait créer un token de réinitialisation et envoyer un email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      resetTokenRepo.save.mockResolvedValue({ token: 'reset-token' });

      await service.forgotPassword('test@example.com');

      expect(resetTokenRepo.save).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('ne devrait pas échouer si l\'email n\'existe pas', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('nonexistent@example.com')).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('devrait réinitialiser le mot de passe avec succès', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      const mockTokenRecord = {
        id: 'token-1',
        token: 'valid-token',
        user: mockUser,
        type: TokenType.PASSWORD_RESET,
        is_used: false,
        expires_at: new Date(Date.now() + 3600000),
      };

      resetTokenRepo.findOne.mockResolvedValue(mockTokenRecord);
      usersService.updateUser.mockResolvedValue(mockUser);
      resetTokenRepo.update.mockResolvedValue({ affected: 1 });

      await service.resetPassword('valid-token', 'newpassword123');

      expect(usersService.updateUser).toHaveBeenCalled();
      expect(resetTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, { is_used: true });
    });

    it('devrait rejeter un token expiré', async () => {
      const mockTokenRecord = {
        id: 'token-1',
        token: 'expired-token',
        type: TokenType.PASSWORD_RESET,
        is_used: false,
        expires_at: new Date(Date.now() - 3600000),
      };

      resetTokenRepo.findOne.mockResolvedValue(mockTokenRecord);

      await expect(service.resetPassword('expired-token', 'newpassword')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
