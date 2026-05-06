import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';

describe('UploadController', () => {
  let instance: UploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadController],
    }).compile();

    instance = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
