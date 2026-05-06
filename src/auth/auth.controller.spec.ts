import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let instance: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthController],
    }).compile();

    instance = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
