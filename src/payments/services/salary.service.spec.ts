import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { SalaryProposal, SalaryProposalStatus } from '../entities/salary-proposal.entity';
import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';
import { EmailService } from '../../email/email.service';

describe('SalaryService', () => {
  let service: SalaryService;
  let businessMemberRepo: Repository<BusinessMember>;
  let salaryProposalRepo: Repository<SalaryProposal>;
  let accountRepo: Repository<Account>;
  let transactionRepo: Repository<Transaction>;
  let dataSource: DataSource;
  let emailService: EmailService;

  const mockBusinessMember = {
    id: 'member-1',
    business_id: 'business-1',
    user_id: 'user-1',
    is_active: true,
    user: {
      id: 'user-1',
      email: 'employee@test.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockSalaryProposal = {
    id: 'proposal-1',
    business_id: 'business-1',
    user_id: 'user-1',
    recipient_email: 'employee@test.com',
    recipient_name: 'John Doe',
    sender_name: 'Manager',
    sender_email: 'manager@test.com',
    business_name: 'Test Business',
    proposed_amount: 2000,
    currency: 'TND',
    status: SalaryProposalStatus.PENDING,
    token: 'test-token-123',
  };

  const mockAccount = {
    id: 'account-1',
    business_id: 'business-1',
    name: 'Main Account',
    current_balance: 10000,
    currency: 'TND',
    is_active: true,
  };

  beforeEach(async () => {
    const mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        {
          provide: getRepositoryToken(BusinessMember),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SalaryProposal),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            transporter: mockTransporter,
          },
        },
      ],
    }).compile();

    service = module.get<SalaryService>(SalaryService);
    businessMemberRepo = module.get(getRepositoryToken(BusinessMember));
    salaryProposalRepo = module.get(getRepositoryToken(SalaryProposal));
    accountRepo = module.get(getRepositoryToken(Account));
    transactionRepo = module.get(getRepositoryToken(Transaction));
    dataSource = module.get(DataSource);
    emailService = module.get(EmailService);
  });

  describe('getBusinessMembers', () => {
    it('should return active business members', async () => {
      jest.spyOn(businessMemberRepo, 'find').mockResolvedValue([mockBusinessMember] as any);

      const result = await service.getBusinessMembers('business-1');

      expect(result).toEqual([mockBusinessMember]);
      expect(businessMemberRepo.find).toHaveBeenCalledWith({
        where: { business_id: 'business-1', is_active: true },
        relations: ['user'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('getProposalStatuses', () => {
    it('should return latest proposal for each member', async () => {
      const proposals = [
        { ...mockSalaryProposal, user_id: 'user-1', created_at: new Date('2024-01-02') },
        { ...mockSalaryProposal, id: 'proposal-2', user_id: 'user-1', created_at: new Date('2024-01-01') },
        { ...mockSalaryProposal, id: 'proposal-3', user_id: 'user-2', created_at: new Date('2024-01-03') },
      ];
      jest.spyOn(salaryProposalRepo, 'find').mockResolvedValue(proposals as any);

      const result = await service.getProposalStatuses('business-1');

      expect(result['user-1'].id).toBe('proposal-1');
      expect(result['user-2'].id).toBe('proposal-3');
    });
  });

  describe('getAcceptedProposals', () => {
    it('should return accepted and paid proposals', async () => {
      const proposals = [
        { ...mockSalaryProposal, status: SalaryProposalStatus.ACCEPTED },
        { ...mockSalaryProposal, id: 'proposal-2', status: SalaryProposalStatus.PAID },
      ];
      jest.spyOn(salaryProposalRepo, 'find').mockResolvedValue(proposals as any);

      const result = await service.getAcceptedProposals('business-1');

      expect(result).toHaveLength(2);
      expect(salaryProposalRepo.find).toHaveBeenCalledWith({
        where: [
          { business_id: 'business-1', status: SalaryProposalStatus.ACCEPTED },
          { business_id: 'business-1', status: SalaryProposalStatus.PAID },
        ],
        order: { responded_at: 'DESC' },
      });
    });
  });

  describe('sendSalaryProposal', () => {
    it('should send salary proposal email', async () => {
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(mockBusinessMember as any);
      jest.spyOn(salaryProposalRepo, 'create').mockReturnValue(mockSalaryProposal as any);
      jest.spyOn(salaryProposalRepo, 'save').mockResolvedValue(mockSalaryProposal as any);

      const result = await service.sendSalaryProposal(
        'business-1',
        { userId: 'user-1', amount: 2000, currency: 'TND', message: 'Test message' },
        'Manager',
        'manager@test.com',
        'Test Business',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('employee@test.com');
      expect(emailService['transporter'].sendMail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if member not found', async () => {
      jest.spyOn(businessMemberRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.sendSalaryProposal(
          'business-1',
          { userId: 'user-1', amount: 2000, currency: 'TND' },
          'Manager',
          'manager@test.com',
          'Test Business',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProposalByToken', () => {
    it('should return proposal by token', async () => {
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(mockSalaryProposal as any);

      const result = await service.getProposalByToken('test-token-123');

      expect(result).toEqual(mockSalaryProposal);
    });

    it('should throw NotFoundException if token invalid', async () => {
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getProposalByToken('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('respondToProposal', () => {
    it('should accept proposal', async () => {
      const proposal = { ...mockSalaryProposal };
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);
      jest.spyOn(salaryProposalRepo, 'save').mockResolvedValue(proposal as any);
      emailService['transporter'].sendMail = jest.fn().mockResolvedValue({ messageId: 'test' });

      const result = await service.respondToProposal('test-token-123', { action: 'ACCEPT' });

      expect(result.success).toBe(true);
      expect(proposal.status).toBe(SalaryProposalStatus.ACCEPTED);
    });

    it('should reject proposal', async () => {
      const proposal = { ...mockSalaryProposal };
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);
      jest.spyOn(salaryProposalRepo, 'save').mockResolvedValue(proposal as any);
      emailService['transporter'].sendMail = jest.fn().mockResolvedValue({ messageId: 'test' });

      const result = await service.respondToProposal('test-token-123', { action: 'REJECT', note: 'Too low' });

      expect(result.success).toBe(true);
      expect(proposal.status).toBe(SalaryProposalStatus.REJECTED);
    });

    it('should counter proposal with amount', async () => {
      const proposal = { ...mockSalaryProposal };
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);
      jest.spyOn(salaryProposalRepo, 'save').mockResolvedValue(proposal as any);
      emailService['transporter'].sendMail = jest.fn().mockResolvedValue({ messageId: 'test' });

      const result = await service.respondToProposal('test-token-123', {
        action: 'COUNTER',
        counterAmount: 2500,
      });

      expect(result.success).toBe(true);
      expect(proposal.status).toBe(SalaryProposalStatus.COUNTERED);
      expect(proposal.counter_amount).toBe(2500);
    });

    it('should throw BadRequestException if counter without amount', async () => {
      const proposal = { ...mockSalaryProposal };
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);

      await expect(
        service.respondToProposal('test-token-123', { action: 'COUNTER' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already responded', async () => {
      const proposal = { ...mockSalaryProposal, status: SalaryProposalStatus.ACCEPTED };
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);

      await expect(
        service.respondToProposal('test-token-123', { action: 'ACCEPT' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('paySalary', () => {
    it('should pay salary successfully', async () => {
      const proposal = { ...mockSalaryProposal, status: SalaryProposalStatus.ACCEPTED };
      const account = { ...mockAccount };
      const transaction = { id: 'tx-1', amount: 2000 };

      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);
      jest.spyOn(accountRepo, 'findOne').mockResolvedValue(account as any);
      jest.spyOn(dataSource, 'transaction').mockImplementation(async (cb: any) => {
        const manager = {
          create: jest.fn().mockReturnValue(transaction),
          save: jest.fn().mockResolvedValue(transaction),
          decrement: jest.fn(),
          update: jest.fn(),
        };
        return cb(manager);
      });
      emailService['transporter'].sendMail = jest.fn().mockResolvedValue({ messageId: 'test' });

      const result = await service.paySalary('business-1', 'proposal-1', 'account-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
    });

    it('should throw NotFoundException if proposal not found', async () => {
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.paySalary('business-1', 'proposal-1', 'account-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if proposal not accepted', async () => {
      const proposal = { ...mockSalaryProposal, status: SalaryProposalStatus.PENDING };
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);

      await expect(
        service.paySalary('business-1', 'proposal-1', 'account-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      const proposal = { ...mockSalaryProposal, status: SalaryProposalStatus.ACCEPTED };
      const account = { ...mockAccount, current_balance: 100 };
      jest.spyOn(salaryProposalRepo, 'findOne').mockResolvedValue(proposal as any);
      jest.spyOn(accountRepo, 'findOne').mockResolvedValue(account as any);

      await expect(
        service.paySalary('business-1', 'proposal-1', 'account-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
