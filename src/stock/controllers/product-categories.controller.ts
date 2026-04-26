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
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategoriesService } from '../services/product-categories.service';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { QueryCategoriesDto } from '../dto/query-categories.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { Role } from '../../users/enums/role.enum';
import { BusinessMember } from '../../businesses/entities/business-member.entity';

@Controller('businesses/:businessId/categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductCategoriesController {
  constructor(
    private readonly categoriesService: ProductCategoriesService,
    @InjectRepository(BusinessMember)
    private readonly businessMemberRepository: Repository<BusinessMember>,
  ) {}

  /**
   * Check if user has permission for category operation
   * Checks create_service_category/update_service_category/delete_service_category for SERVICE type
   * Checks create_category/update_category/delete_category for PRODUCT type
   */
  private async checkCategoryPermission(
    businessId: string,
    userId: string,
    userRole: string,
    categoryType: string,
    operation: 'create' | 'update' | 'delete',
  ): Promise<void> {
    // BUSINESS_OWNER bypasses all checks
    if (userRole === Role.BUSINESS_OWNER) {
      return;
    }

    // Get member permissions
    const member = await this.businessMemberRepository.findOne({
      where: { business_id: businessId, user_id: userId, is_active: true },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this business');
    }

    // Determine permission key based on category type
    const isServiceCategory = categoryType === 'SERVICE';
    const permissionKey = isServiceCategory
      ? `${operation}_service_category`
      : `${operation}_category`;

    // Check permission (default to false if missing)
    const hasPermission = member.stock_permissions?.[permissionKey] === true;

    if (!hasPermission) {
      throw new ForbiddenException(`Insufficient permissions to ${operation} ${isServiceCategory ? 'service categories' : 'product categories'}`);
    }
  }

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
  async create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: CreateProductCategoryDto,
    @Request() req,
  ) {
    // Check permission based on category type
    await this.checkCategoryPermission(
      businessId,
      req.user.id,
      req.user.role,
      dto.category_type || 'PRODUCT',
      'create',
    );

    return this.categoriesService.create(businessId, dto);
  }

  @Put(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductCategoryDto,
    @Request() req,
  ) {
    // Fetch existing category to check its type
    const existingCategory = await this.categoriesService.findOne(businessId, id);
    
    // Check permission based on existing category type
    await this.checkCategoryPermission(
      businessId,
      req.user.id,
      req.user.role,
      existingCategory.category_type,
      'update',
    );

    return this.categoriesService.update(businessId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    // Fetch existing category to check its type
    const existingCategory = await this.categoriesService.findOne(businessId, id);
    
    // Check permission based on existing category type
    await this.checkCategoryPermission(
      businessId,
      req.user.id,
      req.user.role,
      existingCategory.category_type,
      'delete',
    );

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
