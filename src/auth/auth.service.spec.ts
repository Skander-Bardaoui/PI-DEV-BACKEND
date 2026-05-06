import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let instance: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    instance = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
