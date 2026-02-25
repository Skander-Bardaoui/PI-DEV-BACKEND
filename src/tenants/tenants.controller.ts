// src/tenants/tenants.controller.ts
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
import { TenantsService } from './tenants.service';
import { RolesGuard } from '../auth/guards/roles.guard';

import { Role } from '../users/enums/role.enum';
import { CreateTenantDto } from './entities/dto/create-tenant.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { QueryTenantsDto } from './entities/dto/query-tenants.dto';
import { UpdateTenantDto } from './entities/dto/update-tenant.dto';

;

@Controller('tenants')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ─── POST /tenants ───────────────────────────────────────────────────────
  @Post()
  @Roles(Role.PLATFORM_ADMIN)
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  // ─── GET /tenants ────────────────────────────────────────────────────────
  @Get()
  @Roles(Role.PLATFORM_ADMIN)
  async findAll(@Query() query: QueryTenantsDto) {
    const { tenants, total } = await this.tenantsService.findAll(query.page, query.limit);
    return {
      tenants,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  // ─── GET /tenants/my ─────────────────────────────────────────────────────
  // MUST be before /tenants/:id or it will match :id = "my"
  @Get('my')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async getMy(@Request() req) {
    return this.tenantsService.findByOwnerId(req.user.id);
  }
  

  // ─── GET /tenants/:id ────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.BUSINESS_OWNER)
  async findOne(@Param('id') id: string, @Request() req) {
    const tenant = await this.tenantsService.findById(id);

    // If not PLATFORM_ADMIN, must be the owner
    if (req.user.role !== Role.PLATFORM_ADMIN) {
      const isOwner = await this.tenantsService.checkOwnership(id, req.user.id);
      if (!isOwner) {
        throw new ForbiddenException('You can only view your own tenant');
      }
    }

    return tenant;
  }

  // ─── PATCH /tenants/:id ──────────────────────────────────────────────────
  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN, Role.BUSINESS_OWNER)
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @Request() req) {
    // If not PLATFORM_ADMIN, must be the owner
    if (req.user.role !== Role.PLATFORM_ADMIN) {
      const isOwner = await this.tenantsService.checkOwnership(id, req.user.id);
      if (!isOwner) {
        throw new ForbiddenException('You can only update your own tenant');
      }
    }

    return this.tenantsService.update(id, dto);
  }

  // ─── DELETE /tenants/:id ─────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.tenantsService.delete(id);
    return { message: 'Tenant deleted successfully' };
  }
}