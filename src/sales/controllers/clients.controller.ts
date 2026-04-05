// src/sales/controllers/clients.controller.ts

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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { Role } from '../../users/enums/role.enum';
import { ClientsService } from '../services/clients.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { QueryClientsDto } from '../dto/query-clients.dto';

@Controller('businesses/:businessId/sales/clients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SalesClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(businessId, createClientDto);
  }

  @Get()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: QueryClientsDto,
  ) {
    return this.clientsService.findAll(businessId, query);
  }

  @Get(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.findOne(businessId, id);
  }

  @Patch(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT)
  update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(businessId, id, updateClientDto);
  }

  @Delete(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.remove(businessId, id);
  }
}
