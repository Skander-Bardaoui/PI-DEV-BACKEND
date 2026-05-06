import { Test, TestingModule } from '@nestjs/testing';
import { SystemHealthService } from './system-health.service';

describe('SystemHealthService', () => {
  let instance: SystemHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemHealthService],
    }).compile();

    instance = module.get<SystemHealthService>(SystemHealthService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
