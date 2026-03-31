// src/stock/controllers/products.controller.ts
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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  BadGatewayException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ScanProductImageResponseDto } from '../dto/scan-product-image.dto';
import { GenerateSkuDto, GenerateSkuResponseDto } from '../dto/generate-sku.dto';
import { BulkLabelsDto } from '../dto/bulk-labels.dto';
import { QueryProductsDto } from '../dto/query-products.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorators';
import { Role } from '../../users/enums/role.enum';
import type { Response } from 'express';

@Controller('businesses/:businessId/products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Transform frontend DTO to backend DTO
  private transformFrontendDto(frontendDto: any): any {
    const backendDto: any = { ...frontendDto };
    
    // Map frontend field names to backend field names
    if (frontendDto.reference !== undefined) {
      backendDto.sku = frontendDto.reference;
      delete backendDto.reference;
    }
    if (frontendDto.sale_price_ht !== undefined) {
      backendDto.price = frontendDto.sale_price_ht;
      delete backendDto.sale_price_ht;
    }
    if (frontendDto.purchase_price_ht !== undefined) {
      backendDto.cost = frontendDto.purchase_price_ht;
      delete backendDto.purchase_price_ht;
    }
    if (frontendDto.current_stock !== undefined) {
      backendDto.quantity = frontendDto.current_stock;
      delete backendDto.current_stock;
    }
    if (frontendDto.min_stock_threshold !== undefined) {
      backendDto.min_quantity = frontendDto.min_stock_threshold;
      delete backendDto.min_stock_threshold;
    }
    if (frontendDto.is_stockable !== undefined) {
      backendDto.track_inventory = frontendDto.is_stockable;
      delete backendDto.is_stockable;
    }
    
    return backendDto;
  }

  // Transform backend entity to frontend format
  private transformToFrontend(product: any): any {
    return {
      ...product,
      reference: product.sku,
      sale_price_ht: parseFloat(product.price) || 0,
      purchase_price_ht: parseFloat(product.cost) || 0,
      current_stock: parseFloat(product.quantity) || 0,
      min_stock_threshold: parseFloat(product.min_quantity) || 0,
      is_stockable: product.track_inventory,
    };
  }

  @Get()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async findAll(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Query() query: QueryProductsDto,
  ) {
    const products = await this.productsService.findAll(businessId, query);
    return products.map(p => this.transformToFrontend(p));
  }

  @Get('alerts')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async findAlerts(@Param('businessId', ParseUUIDPipe) businessId: string) {
    const products = await this.productsService.findAlerts(businessId);
    return products.map(p => this.transformToFrontend(p));
  }

  @Post('scan-image')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Only JPEG, PNG, and WEBP images are allowed'), false);
      }
      cb(null, true);
    },
  }))
  async scanImage(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ScanProductImageResponseDto> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    try {
      return await this.productsService.scanProductImage(file.buffer, file.mimetype);
    } catch (error: any) {
      console.error('Error scanning product image:', error);
      
      // Check if it's a quota/rate limit error
      if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new BadGatewayException('Image scanning service has exceeded quota. Please try again later.');
      }
      
      // Check if it's an authentication error
      if (error?.message?.includes('API key') || error?.status === 401 || error?.status === 403) {
        throw new BadGatewayException('Image scanning service is not configured. Please contact your administrator.');
      }
      
      throw new BadGatewayException('Failed to analyze image. Please try again.');
    }
  }

  @Post('generate-sku')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async generateSku(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: GenerateSkuDto,
  ): Promise<GenerateSkuResponseDto> {
    const sku = await this.productsService.generateSku(businessId, dto);
    return { sku };
  }

  @Get(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const product = await this.productsService.findOne(businessId, id);
    return this.transformToFrontend(product);
  }

  @Post()
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async create(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: any,
  ) {
    const backendDto = this.transformFrontendDto(dto);
    const product = await this.productsService.create(businessId, backendDto);
    return this.transformToFrontend(product);
  }

  @Put(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async update(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    const backendDto = this.transformFrontendDto(dto);
    const product = await this.productsService.update(businessId, id, backendDto);
    return this.transformToFrontend(product);
  }

  @Delete(':id')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.remove(businessId, id);
  }

  @Post(':id/generate-barcode')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
  async generateBarcode(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const product = await this.productsService.generateBarcode(businessId, id);
    return this.transformToFrontend(product);
  }

  @Get(':id/label')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async getLabel(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const product = await this.productsService.findOne(businessId, id);
    const pdfBuffer = await this.productsService.generateLabel(businessId, id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="label-${product.sku}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  @Post('labels/bulk')
  @Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT, Role.TEAM_MEMBER)
  async getBulkLabels(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: BulkLabelsDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.productsService.generateBulkLabels(businessId, dto.product_ids);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="labels-bulk.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }
}
