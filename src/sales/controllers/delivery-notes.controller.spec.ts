import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNotesController } from './delivery-notes.controller';

describe('DeliveryNotesController', () => {
  let instance: DeliveryNotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryNotesController],
    }).compile();

    instance = module.get<DeliveryNotesController>(DeliveryNotesController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
