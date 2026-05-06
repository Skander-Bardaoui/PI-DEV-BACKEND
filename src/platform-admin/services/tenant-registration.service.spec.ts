import { Test, TestingModule } from '@nestjs/testing';
import { TenantRegistrationService } from './tenant-registration.service';

describe('TenantRegistrationService', () => {
  let instance: TenantRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantRegistrationService],
    }).compile();

    instance = module.get<TenantRegistrationService>(TenantRegistrationService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
