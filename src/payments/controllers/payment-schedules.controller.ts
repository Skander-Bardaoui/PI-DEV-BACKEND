import {
  Controller, Get, Post, Param,
  Body, Req, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard }              from '@nestjs/passport';
import { PaymentScheduleService } from '../services/payment-schedule.service';
import { ZodValidationPipe }      from 'src/common/pipes/zod-validation.pipe';
import { CreatePaymentScheduleSchema, PayInstallmentSchema } from '../dto/payment-schedule';


@UseGuards(AuthGuard('jwt'))
@Controller('businesses/:businessId/payment-schedules')
export class PaymentSchedulesController {
  constructor(private readonly svc: PaymentScheduleService) {}

  /** POST /businesses/:businessId/payment-schedules */
  @Post()
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body(new ZodValidationPipe(CreatePaymentScheduleSchema)) dto: any,
    @Req() req: any,
  ) {
    return this.svc.createSchedule(businessId, req.user.id, dto);
  }

  /** GET /businesses/:businessId/payment-schedules/:id */
  @Get(':id')
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.findOne(businessId, id);
  }

  /** GET /businesses/:businessId/payment-schedules/invoice/:invoiceId */
  @Get('invoice/:invoiceId')
  findByInvoice(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.svc.findByInvoice(businessId, invoiceId);
  }

  /** POST /businesses/:businessId/payment-schedules/:id/installments/:installmentId/pay */
  @Post(':id/installments/:installmentId/pay')
  payInstallment(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('installmentId', ParseUUIDPipe) installmentId: string,
    @Body(new ZodValidationPipe(PayInstallmentSchema)) dto: any,
    @Req() req: any,
  ) {
    return this.svc.payInstallment(businessId, req.user.id, id, installmentId, dto);
  }
}
