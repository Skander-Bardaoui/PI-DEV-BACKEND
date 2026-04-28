// src/platform-admin/controllers/tenant-management.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlatformAdminGuard } from '../guards/platform-admin.guard';
import { TenantManagementService } from '../services/tenant-management.service';
import { TenantQueryDto } from '../dto/tenant-query.dto';
import { RejectTenantDto } from '../dto/reject-tenant.dto';
import { SuspendTenantDto } from '../dto/suspend-tenant.dto';

@Controller('platform/tenants')
@UseGuards(PlatformAdminGuard)
export class TenantManagementController {
  constructor(private readonly tenantService: TenantManagementService) {}

  // ─── List Tenants ────────────────────────────────────────────────────────
  @Get()
  async listTenants(@Query() query: TenantQueryDto) {
    return this.tenantService.listTenants(query);
  }

  // ─── Get Tenant Detail ───────────────────────────────────────────────────
  @Get(':id')
  async getTenantDetail(@Param('id') id: string) {
    return this.tenantService.getTenantDetail(id);
  }

  // ─── Approve Tenant ──────────────────────────────────────────────────────
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveTenant(@Param('id') id: string, @Request() req: any) {
    return this.tenantService.approveTenant(id, req.user.id);
  }

  // ─── Reject Tenant ───────────────────────────────────────────────────────
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectTenant(
    @Param('id') id: string,
    @Body() dto: RejectTenantDto,
    @Request() req: any,
  ) {
    return this.tenantService.rejectTenant(id, req.user.id, dto);
  }

  // ─── Suspend Tenant ──────────────────────────────────────────────────────
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendTenant(@Param('id') id: string, @Body() dto: SuspendTenantDto) {
    return this.tenantService.suspendTenant(id, dto.reason);
  }

  // ─── Unsuspend Tenant ────────────────────────────────────────────────────
  @Post(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendTenant(@Param('id') id: string) {
    return this.tenantService.unsuspendTenant(id);
  }

  // ─── Delete Tenant ───────────────────────────────────────────────────────
  @Delete(':id')
  async deleteTenant(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }

  // ─── Impersonate Tenant ──────────────────────────────────────────────────
  @Post(':id/impersonate')
  @HttpCode(HttpStatus.OK)
  async impersonateTenant(@Param('id') id: string, @Request() req: any) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.tenantService.impersonateTenant(id, req.user.id, ip, userAgent);
  }
}