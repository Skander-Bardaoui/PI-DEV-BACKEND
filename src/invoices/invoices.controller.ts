  // src/invoices/invoices.controller.ts
  import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    NotFoundException,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import type { Response } from 'express';
  import * as fs from 'fs';


  import { InvoicesService } from './invoices.service';

  import { Role } from '../users/enums/role.enum';
  import { CreateInvoiceDto } from './dto/create-invoice.dto';
  import { UpdateInvoiceDto } from './dto/update-invoice.dto';
  import { QueryInvoicesDto } from './dto/query-invoices.dto';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorators';
  import { CancelInvoiceDto } from './dto/cancel-invoice.dto';
  import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
  import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';
  import { MarkPaidDto } from './dto/mark-paid.dto';
  import { Res } from '@nestjs/common';
  import { UpdateRecurringDto } from './dto/update-recurring.dto';
  import { CreateRecurringDto } from './dto/create-recurring.dto';





  @Controller('businesses/:businessId/invoices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) {}

    // ─── POST /businesses/:businessId/invoices ───────────────────────────────
    @Post()
    @Roles(Role.PLATFORM_ADMIN, Role.BUSINESS_OWNER, Role.ACCOUNTANT, Role.TEAM_MEMBER)
    async create(@Param('businessId') businessId: string, @Body() dto: CreateInvoiceDto) {
      return this.invoicesService.create(businessId, dto);
    }

    // ─── GET /businesses/:businessId/invoices ────────────────────────────────
    @Get()
    async findAll(@Param('businessId') businessId: string, @Query() query: QueryInvoicesDto) {
      const { invoices, total } = await this.invoicesService.findAll(
        businessId,
        query.page,
        query.limit,
        query.status,
        query.client_id,
      );

      return {
        invoices,
        total,
        page: query.page,
        limit: query.limit,
      };
    }

 



  

    // ─── Invoice Items Management ────────────────────────────────────────────

    // POST /businesses/:businessId/invoices/:invoiceId/items
    @Post(':invoiceId/items')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    async addItem(
      @Param('businessId') businessId: string,
      @Param('invoiceId') invoiceId: string,
      @Body() dto: CreateInvoiceItemDto,
    ) {
      return this.invoicesService.addItem(businessId, invoiceId, dto);
    }

    // PATCH /businesses/:businessId/invoices/:invoiceId/items/:itemId
    @Patch(':invoiceId/items/:itemId')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    async updateItem(
      @Param('businessId') businessId: string,
      @Param('invoiceId') invoiceId: string,
      @Param('itemId') itemId: string,
      @Body() dto: UpdateInvoiceItemDto,
    ) {
      return this.invoicesService.updateItem(businessId, invoiceId, itemId, dto);
    }

    // DELETE /businesses/:businessId/invoices/:invoiceId/items/:itemId
    @Delete(':invoiceId/items/:itemId')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async deleteItem(
      @Param('businessId') businessId: string,
      @Param('invoiceId') invoiceId: string,
      @Param('itemId') itemId: string,
    ) {
      await this.invoicesService.deleteItem(businessId, invoiceId, itemId);
      return { message: 'Item deleted successfully' };
    }

    // ─── Invoice Status Management ───────────────────────────────────────────

    // POST /businesses/:businessId/invoices/:id/send
    @Post(':id/send')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async sendInvoice(@Param('businessId') businessId: string, @Param('id') id: string) {
      const invoice = await this.invoicesService.sendInvoice(businessId, id);
      return {
        message: 'Invoice sent successfully',
        invoice,
      };
    }

    // POST /businesses/:businessId/invoices/:id/mark-paid
    @Post(':id/mark-paid')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async markPaid(
      @Param('businessId') businessId: string,
      @Param('id') id: string,
      @Body() dto: MarkPaidDto,
    ) {
      const invoice = await this.invoicesService.markPaid(businessId, id, dto);
      return {
        message: 'Invoice marked as paid',
        invoice,
      };
    }

    // POST /businesses/:businessId/invoices/:id/mark-overdue
    @Post(':id/mark-overdue')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async markOverdue(@Param('businessId') businessId: string, @Param('id') id: string) {
      const invoice = await this.invoicesService.markOverdue(businessId, id);
      return {
        message: 'Invoice marked as overdue',
        invoice,
      };
    }

    // POST /businesses/:businessId/invoices/:id/cancel
    @Post(':id/cancel')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async cancel(
      @Param('businessId') businessId: string,
      @Param('id') id: string,
      @Body() dto: CancelInvoiceDto,
    ) {
      const invoice = await this.invoicesService.cancelInvoice(businessId, id, dto.reason);
      return {
        message: 'Invoice cancelled',
        invoice,
      };
    }

      // GET /businesses/:businessId/invoices/:id/pdf
  @Get(':id/pdf')
  async downloadPdf(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filepath } = await this.invoicesService.generatePdf(businessId, id);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('PDF not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');

    return fs.createReadStream(filepath);
  }


    // POST /businesses/:businessId/invoices/:id/regenerate-pdf
    @Post(':id/regenerate-pdf')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async regeneratePdf(@Param('businessId') businessId: string, @Param('id') id: string) {
      const pdf_url = await this.invoicesService.regeneratePdf(businessId, id);
      return { pdf_url };
    }




    // ─── Recurring Invoices ──────────────────────────────────────────────────

    // POST /businesses/:businessId/invoices/:id/recur
    @Post(':id/recur')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    async createRecurring(
      @Param('businessId') businessId: string,
      @Param('id') invoiceId: string,
      @Body() dto: CreateRecurringDto,
    ) {
      return this.invoicesService.createRecurring(businessId, invoiceId, dto);
    }

    // GET /businesses/:businessId/invoices/recurring
    @Get('recurring')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    async getRecurring(@Param('businessId') businessId: string) {
      return this.invoicesService.findAllRecurring(businessId);
    }

    // PATCH /businesses/:businessId/invoices/recurring/:id
    @Patch('recurring/:id')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    async updateRecurring(
      @Param('businessId') businessId: string,
      @Param('id') recurringId: string,
      @Body() dto: UpdateRecurringDto,
    ) {
      return this.invoicesService.updateRecurring(businessId, recurringId, dto);
    }

    // DELETE /businesses/:businessId/invoices/recurring/:id
    @Delete('recurring/:id')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async deleteRecurring(@Param('businessId') businessId: string, @Param('id') recurringId: string) {
      await this.invoicesService.deleteRecurring(businessId, recurringId);
      return { message: 'Recurring cancelled successfully' };
    }











///ALWAYS KEEP THIS ENDPOINT AT THE END ANYTHING THAT WILL BE ADDED MUST BE ADDED ABOVE THIS PLS/////////////////////////////////////////////////////////

       //  ─── GET /businesses/:businessId/invoices/:id ────────────────────────────
    @Get(':id')
    async findOne(@Param('businessId') businessId: string, @Param('id') id: string) {
      return this.invoicesService.findById(businessId, id);
    }

        // ─── PATCH /businesses/:businessId/invoices/:id ──────────────────────────
    @Patch(':id')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    async update(
      @Param('businessId') businessId: string,
      @Param('id') id: string,
      @Body() dto: UpdateInvoiceDto,
    ) {
      return this.invoicesService.update(businessId, id, dto);
    }

      // ─── DELETE /businesses/:businessId/invoices/:id ─────────────────────────
    @Delete(':id')
    @Roles(Role.BUSINESS_OWNER, Role.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    async delete(@Param('businessId') businessId: string, @Param('id') id: string) {
      await this.invoicesService.delete(businessId, id);
      return { message: 'Invoice deleted successfully' };
    }
  }