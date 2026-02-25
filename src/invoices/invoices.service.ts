// src/invoices/invoices.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';
import { PdfService } from './services/pdf.service';
import { RecurringFrequency, RecurringInvoice } from './entities/recurring-invoice.entity';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    private readonly pdfService: PdfService,
    @InjectRepository(RecurringInvoice)
private readonly recurringRepository: Repository<RecurringInvoice>,
  ) {}

  // ─── Generate Invoice Number ─────────────────────────────────────────────
  private async generateInvoiceNumber(business_id: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Find the last invoice for this business in this year
    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.business_id = :business_id', { business_id })
      .andWhere('invoice.invoice_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.created_at', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  // ─── Calculate Invoice Totals ────────────────────────────────────────────
  private calculateTotals(items: CreateInvoiceDto['items'], tax_rate?: number) {
    const subtotal = items.reduce((sum, item) => {
      const amount = item.quantity * item.unit_price;
      return sum + amount;
    }, 0);

    const tax = tax_rate ? (subtotal * tax_rate) / 100 : 0;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }

  // ─── Create Invoice ──────────────────────────────────────────────────────
  async create(business_id: string, dto: CreateInvoiceDto): Promise<Invoice> {
    // Generate invoice number if not provided
    const invoice_number = dto.invoice_number || (await this.generateInvoiceNumber(business_id));

    // Calculate totals
    const { subtotal, tax, total } = this.calculateTotals(dto.items, dto.tax_rate);

    // Create invoice
    const invoice = this.invoiceRepository.create({
      business_id,
      client_id: dto.client_id,
      invoice_number,
      date: dto.date,
      due_date: dto.due_date,
      notes: dto.notes,
      tax_rate: dto.tax_rate,
      subtotal,
      tax,
      total,
      status: InvoiceStatus.DRAFT,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create invoice items
    const itemsToSave = dto.items.map((item) => {
      const amount = item.quantity * item.unit_price;
      return this.invoiceItemRepository.create({
        invoice_id: savedInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount,
      });
    });

    await this.invoiceItemRepository.save(itemsToSave);

    // Return invoice with items
    return this.findById(business_id, savedInvoice.id);
  }

  // ─── List Invoices ───────────────────────────────────────────────────────
  async findAll(
    business_id: string,
    page: number = 1,
    limit: number = 20,
    status?: InvoiceStatus,
    client_id?: string,
  ): Promise<{ invoices: Invoice[]; total: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.business_id = :business_id', { business_id });

    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    if (client_id) {
      queryBuilder.andWhere('invoice.client_id = :client_id', { client_id });
    }

    const [invoices, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('invoice.created_at', 'DESC')
      .getManyAndCount();

    return { invoices, total };
  }

  // ─── Get Invoice by ID ───────────────────────────────────────────────────
  async findById(business_id: string, id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, business_id },
      relations: ['client', 'items'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // ─── Update Invoice (only if DRAFT) ─────────────────────────────────────
  async update(business_id: string, id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findById(business_id, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only update invoices in DRAFT status');
    }

    // If items are being updated, delete old items and create new ones
    if (dto.items) {
      await this.invoiceItemRepository.delete({ invoice_id: id });

      const itemsToSave = dto.items.map((item) => {
        const amount = item.quantity * item.unit_price;
        return this.invoiceItemRepository.create({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount,
        });
      });

      await this.invoiceItemRepository.save(itemsToSave);

      // Recalculate totals
      const { subtotal, tax, total } = this.calculateTotals(dto.items, dto.tax_rate ?? invoice.tax_rate);
       const { items, ...updateData } = dto; // ✅ FIX

    await this.invoiceRepository.update(id, {
      ...updateData,
      subtotal,
      tax,
      total,
    });
    } else {
      await this.invoiceRepository.update(id, dto);
    }

    return this.findById(business_id, id);
  }

  // ─── Delete Invoice (only if DRAFT) ─────────────────────────────────────
  async delete(business_id: string, id: string): Promise<void> {
    const invoice = await this.findById(business_id, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only delete invoices in DRAFT status');
    }

    await this.invoiceRepository.delete({ id, business_id });
  }

  // ─── Invoice Items Management ────────────────────────────────────────────

  // Add Item to Invoice
  async addItem(
    business_id: string,
    invoice_id: string,
    dto: CreateInvoiceItemDto,
  ): Promise<InvoiceItem> {
    const invoice = await this.findById(business_id, invoice_id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only add items to invoices in DRAFT status');
    }

    const amount = dto.quantity * dto.unit_price;
    const item = this.invoiceItemRepository.create({
      invoice_id,
      description: dto.description,
      quantity: dto.quantity,
      unit_price: dto.unit_price,
      amount,
    });

    const savedItem = await this.invoiceItemRepository.save(item);

    // Recalculate invoice totals
    await this.recalculateTotals(business_id, invoice_id);

    return savedItem;
  }

  // Update Invoice Item
  async updateItem(
    business_id: string,
    invoice_id: string,
    item_id: string,
    dto: UpdateInvoiceItemDto,
  ): Promise<InvoiceItem> {
    const invoice = await this.findById(business_id, invoice_id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only update items in invoices with DRAFT status');
    }

    const item = await this.invoiceItemRepository.findOne({
      where: { id: item_id, invoice_id },
    });

    if (!item) {
      throw new NotFoundException('Invoice item not found');
    }

    // Calculate new amount if quantity or unit_price changed
    const quantity = dto.quantity ?? item.quantity;
    const unit_price = dto.unit_price ?? item.unit_price;
    const amount = quantity * unit_price;

    await this.invoiceItemRepository.update(item_id, {
      ...dto,
      amount,
    });

    // Recalculate invoice totals
    await this.recalculateTotals(business_id, invoice_id);

    const updatedItem = await this.invoiceItemRepository.findOne({ where: { id: item_id } });

    if (!updatedItem) {
      throw new NotFoundException('Invoice item not found');
    }

    return updatedItem;
  }

  // Delete Invoice Item
  async deleteItem(business_id: string, invoice_id: string, item_id: string): Promise<void> {
    const invoice = await this.findById(business_id, invoice_id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only delete items from invoices in DRAFT status');
    }

    const result = await this.invoiceItemRepository.delete({ id: item_id, invoice_id });

    if (result.affected === 0) {
      throw new NotFoundException('Invoice item not found');
    }

    // Recalculate invoice totals
    await this.recalculateTotals(business_id, invoice_id);
  }

  // Helper: Recalculate invoice totals after item changes
  private async recalculateTotals(business_id: string, invoice_id: string): Promise<void> {
    const invoice = await this.findById(business_id, invoice_id);

    const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = invoice.tax_rate ? (subtotal * Number(invoice.tax_rate)) / 100 : 0;
    const total = subtotal + tax;

    await this.invoiceRepository.update(invoice_id, {
      subtotal,
      tax,
      total,
    });
  }

  // ─── Invoice Status Management ───────────────────────────────────────────

  // Send Invoice (DRAFT → SENT)
  async sendInvoice(business_id: string, id: string): Promise<Invoice> {
    const invoice = await this.findById(business_id, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only send invoices in DRAFT status');
    }

    await this.invoiceRepository.update(id, { status: InvoiceStatus.SENT });

    // TODO: Send email to client (implement after email service integration)
    console.log(`Invoice ${invoice.invoice_number} sent to ${invoice.client.email}`);

    return this.findById(business_id, id);
  }

  // Mark Invoice as Paid (SENT/OVERDUE → PAID)
  async markPaid(business_id: string, id: string, dto: MarkPaidDto): Promise<Invoice> {
    const invoice = await this.findById(business_id, id);

    if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.OVERDUE) {
      throw new BadRequestException('Can only mark SENT or OVERDUE invoices as paid');
    }

    await this.invoiceRepository.update(id, { status: InvoiceStatus.PAID });

    // TODO: Create payment record (implement after Payment module)
    console.log(`Invoice ${invoice.invoice_number} marked as PAID`);
    console.log('Payment details:', dto);

    return this.findById(business_id, id);
  }

  // Mark Invoice as Overdue (SENT → OVERDUE)
  async markOverdue(business_id: string, id: string): Promise<Invoice> {
    const invoice = await this.findById(business_id, id);

    if (invoice.status !== InvoiceStatus.SENT) {
      throw new BadRequestException('Can only mark SENT invoices as overdue');
    }

    await this.invoiceRepository.update(id, { status: InvoiceStatus.OVERDUE });

    return this.findById(business_id, id);
  }

  // Cancel Invoice
  async cancelInvoice(business_id: string, id: string, reason?: string): Promise<Invoice> {
    const invoice = await this.findById(business_id, id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }

    // Optionally store cancellation reason in notes
    const updatedNotes = reason
      ? `${invoice.notes || ''}\n\n[CANCELLED] ${reason}`.trim()
      : invoice.notes;

    await this.invoiceRepository.update(id, {
      status: InvoiceStatus.CANCELLED,
      notes: updatedNotes,
    });

    return this.findById(business_id, id);
  }

  // ─── PDF Generation ──────────────────────────────────────────────────────

  // Generate PDF
  async generatePdf(business_id: string, id: string): Promise<{ filepath: string; url: string }> {
    const invoice = await this.findById(business_id, id);

    const pdfUrl = await this.pdfService.generateInvoicePdf(invoice);

    // Update invoice with PDF URL
    await this.invoiceRepository.update(id, { pdf_url: pdfUrl });

    return {
      filepath: this.pdfService.getPdfPath(pdfUrl),
      url: pdfUrl,
    };
  }

  // Regenerate PDF (force)
  async regeneratePdf(business_id: string, id: string): Promise<string> {
    const invoice = await this.findById(business_id, id);

    // Delete old PDF if exists
    if (invoice.pdf_url) {
      this.pdfService.deletePdf(invoice.pdf_url);
    }

    const pdfUrl = await this.pdfService.generateInvoicePdf(invoice);

    await this.invoiceRepository.update(id, { pdf_url: pdfUrl });

    return pdfUrl;
  }

  // ─── Recurring Invoices ──────────────────────────────────────────────────

  // Set up recurring schedule
  async createRecurring(
    business_id: string,
    invoice_id: string,
    dto: CreateRecurringDto,
  ): Promise<RecurringInvoice> {
    const invoice = await this.findById(business_id, invoice_id);

    // Calculate next generation date
    const nextDate = this.calculateNextDate(new Date(dto.start_date), dto.frequency);

    const recurring = this.recurringRepository.create({
      invoice_id,
      frequency: dto.frequency,
      start_date: dto.start_date,
      end_date: dto.end_date,
      next_generation_date: nextDate,
    });

    return this.recurringRepository.save(recurring);
  }

  // List recurring invoices
  async findAllRecurring(business_id: string): Promise<RecurringInvoice[]> {
    return this.recurringRepository
      .createQueryBuilder('recurring')
      .leftJoinAndSelect('recurring.invoice', 'invoice')
      .where('invoice.business_id = :business_id', { business_id })
      .orderBy('recurring.created_at', 'DESC')
      .getMany();
  }

  // Update recurring settings
  async updateRecurring(
    business_id: string,
    recurring_id: string,
    dto: UpdateRecurringDto,
  ): Promise<RecurringInvoice> {
    const recurring = await this.recurringRepository.findOne({
      where: { id: recurring_id },
      relations: ['invoice'],
    });

    if (!recurring) {
      throw new NotFoundException('Recurring invoice not found');
    }

    if (recurring.invoice.business_id !== business_id) {
      throw new NotFoundException('Recurring invoice not found');
    }

    // Recalculate next date if frequency or start date changed
    if (dto.frequency || dto.start_date) {
      const frequency = dto.frequency || recurring.frequency;
      const startDate = dto.start_date ? new Date(dto.start_date) : recurring.start_date;
      const nextDate = this.calculateNextDate(startDate, frequency);
      await this.recurringRepository.update(recurring_id, {
        ...dto,
        next_generation_date: nextDate,
      });
    } else {
      await this.recurringRepository.update(recurring_id, dto);
    }

    const updated = await this.recurringRepository.findOne({ where: { id: recurring_id }, relations: ['invoice'] });

    if (!updated) {
      throw new NotFoundException('Recurring invoice not found');
    }

    return updated;
  }

  // Cancel recurring
  async deleteRecurring(business_id: string, recurring_id: string): Promise<void> {
    const recurring = await this.recurringRepository.findOne({
      where: { id: recurring_id },
      relations: ['invoice'],
    });

    if (!recurring) {
      throw new NotFoundException('Recurring invoice not found');
    }

    if (recurring.invoice.business_id !== business_id) {
      throw new NotFoundException('Recurring invoice not found');
    }

    await this.recurringRepository.update(recurring_id, { is_active: false });
  }

  // Helper: Calculate next generation date
  private calculateNextDate(startDate: Date, frequency: RecurringFrequency): Date {
    const nextDate = new Date(startDate);

    switch (frequency) {
      case RecurringFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurringFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RecurringFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }
}