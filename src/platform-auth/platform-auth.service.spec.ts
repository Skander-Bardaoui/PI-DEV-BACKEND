import { Test, TestingModule } from '@nestjs/testing';
import { PlatformAuthService } from './platform-auth.service';

describe('PlatformAuthService', () => {
  let instance: PlatformAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformAuthService],
    }).compile();

    instance = module.get<PlatformAuthService>(PlatformAuthService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
