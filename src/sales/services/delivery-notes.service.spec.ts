import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNotesService } from './delivery-notes.service';

describe('DeliveryNotesService', () => {
  let instance: DeliveryNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryNotesService],
    }).compile();

    instance = module.get<DeliveryNotesService>(DeliveryNotesService);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
