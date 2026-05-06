import { Test, TestingModule } from '@nestjs/testing';
import { PublicPaymentController } from './public-payment.controller';

describe('PublicPaymentController', () => {
  let instance: PublicPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicPaymentController],
    }).compile();

    instance = module.get<PublicPaymentController>(PublicPaymentController);
  });

  it('should be defined', () => {
    expect(instance).toBeDefined();
  });
});
