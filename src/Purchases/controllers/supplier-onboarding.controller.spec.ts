import { Test, TestingModule } from '@nestjs/testing';
import { SupplierOnboardingController } from './supplier-onboarding.controller';
import { SupplierOnboardingService } from '../services/supplier-onboarding.service';

describe('SupplierOnboardingController', () => {
  let controller: SupplierOnboardingController;
  let service: SupplierOnboardingService;

  const mockService = {
    sendInvitation: jest.fn(),
    getInvitationStatus: jest.fn(),
    completeOnboarding: jest.fn(),
    resendInvitation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierOnboardingController],
      providers: [
        {
          provide: SupplierOnboardingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SupplierOnboardingController>(SupplierOnboardingController);
    service = module.get<SupplierOnboardingService>(SupplierOnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
