import { Test, TestingModule } from '@nestjs/testing';
import { PlatformAuthController } from './platform-auth.controller';

describe('PlatformAuthController', () => {
  let instance: PlatformAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformAuthController],
    }).compile();

    instance = module.get<PlatformAuthController>(PlatformAuthController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
