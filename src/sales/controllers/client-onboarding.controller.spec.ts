import { Test, TestingModule } from '@nestjs/testing';
import { ClientOnboardingController } from './client-onboarding.controller';
import { ClientOnboardingService } from '../services/client-onboarding.service';

describe('ClientOnboardingController', () => {
  let controller: ClientOnboardingController;
  let service: ClientOnboardingService;

  const mockService = {
    sendInvitation: jest.fn(),
    completeOnboarding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientOnboardingController],
      providers: [
        {
          provide: ClientOnboardingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ClientOnboardingController>(ClientOnboardingController);
    service = module.get<ClientOnboardingService>(ClientOnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
