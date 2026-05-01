import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionManageService } from './subscription-manage.service';
import { RecurringInvoice } from '../entities/recurring-invoice.entity';
import { RecurringSubscriptionToken } from '../entities/recurring-subscription-token.entity';

describe('SubscriptionManageService', () => {
  let service: SubscriptionManageService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionManageService,
        {
          provide: getRepositoryToken(RecurringInvoice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RecurringSubscriptionToken),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionManageService>(SubscriptionManageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
