// src/invoices/invoices.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { PdfService } from './services/pdf.service';
import { RecurringInvoice } from './entities/recurring-invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem,RecurringInvoice])],
 providers: [InvoicesService, PdfService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}