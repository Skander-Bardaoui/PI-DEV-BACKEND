import { Test, TestingModule } from '@nestjs/testing';
import { ThreeWayMatchingAIService } from './three-way-matching-ai.service';

describe('ThreeWayMatchingAIService', () => {
  let instance: ThreeWayMatchingAIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThreeWayMatchingAIService],
    }).compile();

    instance = module.get<ThreeWayMatchingAIService>(ThreeWayMatchingAIService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
