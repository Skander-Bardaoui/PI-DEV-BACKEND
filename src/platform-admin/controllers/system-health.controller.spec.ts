import { Test, TestingModule } from '@nestjs/testing';
import { SystemHealthController } from './system-health.controller';

describe('SystemHealthController', () => {
  let instance: SystemHealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemHealthController],
    }).compile();

    instance = module.get<SystemHealthController>(SystemHealthController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
