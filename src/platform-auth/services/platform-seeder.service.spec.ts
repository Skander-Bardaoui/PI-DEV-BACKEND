import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSeederService } from './platform-seeder.service';

describe('PlatformSeederService', () => {
  let instance: PlatformSeederService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformSeederService],
    }).compile();

    instance = module.get<PlatformSeederService>(PlatformSeederService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
