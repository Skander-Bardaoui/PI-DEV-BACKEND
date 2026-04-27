// src/payments/payments.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule }      from '@nestjs/typeorm';
import { Account }            from './entities/account.entity';
import { Payment }            from './entities/payment.entity';
import { SupplierPayment }    from './entities/supplier-payment.entity';
import { Transaction }        from './entities/transaction.entity';
import { Invoice }            from '../sales/entities/invoice.entity';
import { AccountsController }         from './controllers/accounts.controller';
import { PaymentsController }         from './controllers/payments.controller';
import { SupplierPaymentsController } from './controllers/supplier-payments.controller';
import { AccountsService }            from './services/accounts.service';
import { PaymentsService }            from './services/payments.service';
import { SupplierPaymentsService }    from './services/supplier-payments.service';
import { PurchasesModule }            from '../Purchases/purchases.module';
import { PurchaseInvoice }            from '../Purchases/entities/purchase-invoice.entity';
import { TransactionsController }     from './controllers/transactions.controller';
import { TransactionsService }        from './services/transactions.service';
import { TransfersController }        from './controllers/transfers.controller';
import { TransfersService }           from './services/transfers.service';
import { PaymentScheduleService }     from './services/payment-schedule.service';
import { PaymentSchedulesController } from './controllers/payment-schedules.controller';
import { PaymentScheduleInstallment } from './entities/payment-schedule-installment';
import { ForecastService } from './services/forecast.service';
import { ForecastController } from './controllers/forecast.controller';
import { PaymentSchedule }            from './entities/payment-schedule';
import { SalaryService }              from './services/salary.service';
import { SalaryController }           from './controllers/salary.controller';
import { BusinessMember }             from 'src/businesses/entities/business-member.entity';
import { User }                       from 'src/users/entities/user.entity';
import { Business }                   from 'src/businesses/entities/business.entity';
import { Tenant }                     from 'src/tenants/entities/tenant.entity';
import { EmailModule }                from 'src/email/email.module';
import { SalaryProposal }             from './entities/salary-proposal.entity';
import { Supplier } from '../Purchases/entities/supplier.entity';
import { SupplierSchedulePublicController } from './controllers/supplier-schedule-public.controller';
import { SalaryPermissionGuard } from './guards/salary-permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Payment,
      SupplierPayment,
      Transaction,
      Invoice,
      PurchaseInvoice,
      PaymentSchedule,
      PaymentScheduleInstallment,
      BusinessMember,
      User,
      Business,
      Tenant,
      SalaryProposal,
      Supplier,
    ]),
    forwardRef(() => PurchasesModule),
    EmailModule,
  ],
  controllers: [
    AccountsController,
    PaymentsController,
    SupplierPaymentsController,
    TransactionsController,
    TransfersController,
    PaymentSchedulesController,
    SalaryController,
    ForecastController,
    SupplierSchedulePublicController,
  ],
  providers: [
    AccountsService,
    PaymentsService,
    SupplierPaymentsService,
    TransactionsService,
    TransfersService,
    PaymentScheduleService,
    SalaryService,
    ForecastService,
    SalaryPermissionGuard,
  ],
  exports: [
    AccountsService,
    PaymentsService,
    SupplierPaymentsService,
    PaymentScheduleService,
    SalaryService,
    TypeOrmModule,
  ],
})
export class PaymentsModule {}
