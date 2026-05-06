import { Test, TestingModule } from '@nestjs/testing';
import { ClientOnboardingController } from './client-onboarding.controller';

describe('ClientOnboardingController', () => {
  let instance: ClientOnboardingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientOnboardingController],
    }).compile();

    instance = module.get<ClientOnboardingController>(ClientOnboardingController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
