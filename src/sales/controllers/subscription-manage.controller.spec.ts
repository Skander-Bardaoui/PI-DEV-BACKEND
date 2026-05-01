import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionManageController } from './subscription-manage.controller';
import { SubscriptionManageService } from '../services/subscription-manage.service';

describe('SubscriptionManageController', () => {
  let controller: SubscriptionManageController;
  let service: SubscriptionManageService;

  const mockService = {
    getSubscriptionDetails: jest.fn(),
    pauseSubscription: jest.fn(),
    resumeSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionManageController],
      providers: [
        {
          provide: SubscriptionManageService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionManageController>(SubscriptionManageController);
    service = module.get<SubscriptionManageService>(SubscriptionManageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
