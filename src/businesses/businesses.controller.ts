// src/businesses/businesses.controller.ts
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
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessesService } from './businesses.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../users/enums/role.enum';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';
import { QueryBusinessesDto } from './dto/query-businesses.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';

@Controller('businesses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  // ─── POST /businesses ────────────────────────────────────────────────────
  @Post()
  @Roles(Role.PLATFORM_ADMIN, Role.BUSINESS_OWNER)
  async create(@Body() dto: CreateBusinessDto) {
    return this.businessesService.create(dto);  
  }

  // ─── GET /businesses ─────────────────────────────────────────────────────
  @Get()
  async findAll(@Query() query: QueryBusinessesDto, @Request() req) {
    const { businesses, total } = await this.businessesService.findAll(
      query.page,
      query.limit,
      query.tenant_id,
    );

    return {
      businesses,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  // ─── GET /businesses/:id ─────────────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.businessesService.findById(id);
  }

  // ─── PATCH /businesses/:id ───────────────────────────────────────────────
  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessesService.update(id, dto);
  }

  // ─── DELETE /businesses/:id ──────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.BUSINESS_OWNER)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.businessesService.delete(id);
    return { message: 'Business deleted successfully' };
  }

  // ─── GET /businesses/:id/settings ────────────────────────────────────────
  @Get(':id/settings')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  async getSettings(@Param('id') id: string) {
    return this.businessesService.getSettings(id);
  }

  // ─── PATCH /businesses/:id/settings ──────────────────────────────────────
  @Patch(':id/settings')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async updateSettings(@Param('id') id: string, @Body() dto: UpdateBusinessSettingsDto) {
    return this.businessesService.updateSettings(id, dto);
  }

  // ─── Tax Rates Management ────────────────────────────────────────────────

  // POST /businesses/:id/tax-rates
  @Post(':id/tax-rates')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async createTaxRate(@Param('id') business_id: string, @Body() dto: CreateTaxRateDto) {
    return this.businessesService.createTaxRate(business_id, dto);
  }

  // GET /businesses/:id/tax-rates
  @Get(':id/tax-rates')
  async getTaxRates(@Param('id') business_id: string) {
    return this.businessesService.getTaxRates(business_id);
  }

  // PATCH /businesses/:id/tax-rates/:taxId
  @Patch(':id/tax-rates/:taxId')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async updateTaxRate(
    @Param('id') business_id: string,
    @Param('taxId') taxRateId: string,
    @Body() dto: UpdateTaxRateDto,
  ) {
    return this.businessesService.updateTaxRate(business_id, taxRateId, dto);
  }

  // DELETE /businesses/:id/tax-rates/:taxId
  @Delete(':id/tax-rates/:taxId')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTaxRate(@Param('id') business_id: string, @Param('taxId') taxRateId: string) {
    await this.businessesService.deleteTaxRate(business_id, taxRateId);
    return { message: 'Tax rate deleted successfully' };
  }
}