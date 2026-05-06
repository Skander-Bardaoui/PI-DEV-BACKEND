import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let instance: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppController],
    }).compile();

    instance = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
