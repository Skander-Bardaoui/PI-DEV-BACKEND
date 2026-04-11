// src/stock/controllers/product-categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductCategoriesService } from '../services/product-categories.service';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { QueryCategoriesDto } from '../dto/query-categories.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { Role } from '../../users/enums/role.enum';

@Controller('businesses/:businessId/categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  @Get()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: QueryCategoriesDto,
  ) {
    return this.categoriesService.findAll(businessId, query);
  }

  // Archive routes must come BEFORE :id route to avoid UUID parsing issues
  @Get('archived')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async getArchived(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.categoriesService.findArchived(businessId);
  }

  @Get(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.findOne(businessId, id);
  }

  @Post()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: CreateProductCategoryDto,
  ) {
    return this.categoriesService.create(businessId, dto);
  }

  @Put(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.categoriesService.update(businessId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.remove(businessId, id);
  }

  @Post(':id/restore')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async restore(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.restore(businessId, id);
  }
}
