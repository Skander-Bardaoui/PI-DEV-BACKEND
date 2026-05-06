import { Test, TestingModule } from '@nestjs/testing';
import { DisputeResolutionController } from './dispute-resolution.controller';

describe('DisputeResolutionController', () => {
  let instance: DisputeResolutionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisputeResolutionController],
    }).compile();

    instance = module.get<DisputeResolutionController>(DisputeResolutionController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
