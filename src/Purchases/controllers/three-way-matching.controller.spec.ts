import { Test, TestingModule } from '@nestjs/testing';
import { ThreeWayMatchingController } from './three-way-matching.controller';

describe('ThreeWayMatchingController', () => {
  let instance: ThreeWayMatchingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThreeWayMatchingController],
    }).compile();

    instance = module.get<ThreeWayMatchingController>(ThreeWayMatchingController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
