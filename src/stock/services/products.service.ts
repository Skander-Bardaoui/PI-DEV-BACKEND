// src/stock/services/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Like, In, SelectQueryBuilder } from 'typeorm';
import Groq from 'groq-sdk';
import PDFDocument from 'pdfkit';
import * as bwipjs from 'bwip-js';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ScanProductImageResponseDto } from '../dto/scan-product-image.dto';
import { GenerateSkuDto } from '../dto/generate-sku.dto';
import { QueryProductsDto, ProductSortBy } from '../dto/query-products.dto';
import { generateInternalBarcode } from '../utils/barcode.util';
import { Business } from '../../businesses/entities/business.entity';

@Injectable()
export class ProductsService {
  private groq: Groq;

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    }
  }

  async findAll(businessId: string, query: QueryProductsDto = {}): Promise<Product[]> {
    const qb: SelectQueryBuilder<Product> = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.warehouse', 'warehouse')
      .where('product.business_id = :businessId', { businessId });

    // Search filter
    if (query.search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search) OR LOWER(product.barcode) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    // Category filter
    if (query.category_id) {
      qb.andWhere('product.category_id = :categoryId', { categoryId: query.category_id });
    }

    // Warehouse filter
    if (query.warehouse_id) {
      qb.andWhere('product.warehouse_id = :warehouseId', { warehouseId: query.warehouse_id });
    }

    // Active status filter
    if (query.is_active !== undefined) {
      qb.andWhere('product.is_active = :isActive', { isActive: query.is_active });
    }

    // Stockable filter
    if (query.is_stockable !== undefined) {
      qb.andWhere('product.track_inventory = :trackInventory', { trackInventory: query.is_stockable });
    }

    // Low stock filter
    if (query.low_stock) {
      qb.andWhere('product.track_inventory = :trackInventory', { trackInventory: true })
        .andWhere('product.quantity <= product.min_quantity');
    }

    // Out of stock filter
    if (query.out_of_stock) {
      qb.andWhere('product.quantity = :zero', { zero: 0 });
    }

    // Barcode filter
    if (query.has_barcode !== undefined) {
      if (query.has_barcode) {
        qb.andWhere('product.barcode IS NOT NULL');
      } else {
        qb.andWhere('product.barcode IS NULL');
      }
    }

    // Price range filters
    if (query.price_min !== undefined) {
      qb.andWhere('product.price >= :priceMin', { priceMin: query.price_min });
    }

    if (query.price_max !== undefined) {
      qb.andWhere('product.price <= :priceMax', { priceMax: query.price_max });
    }

    // Sorting
    const sortBy = query.sort_by || ProductSortBy.NAME;
    const sortOrder = query.sort_order || 'ASC';

    switch (sortBy) {
      case ProductSortBy.NAME:
        qb.orderBy('product.name', sortOrder);
        break;
      case ProductSortBy.PRICE:
        qb.orderBy('product.price', sortOrder);
        break;
      case ProductSortBy.QUANTITY:
        qb.orderBy('product.quantity', sortOrder);
        break;
      case ProductSortBy.CREATED_AT:
        qb.orderBy('product.created_at', sortOrder);
        break;
      default:
        qb.orderBy('product.name', 'ASC');
    }

    return qb.getMany();
  }

  async findOne(businessId: string, id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, business_id: businessId },
      relations: ['category', 'default_supplier'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findAlerts(businessId: string): Promise<Product[]> {
    const products = await this.productRepo
      .createQueryBuilder('product')
      .where('product.business_id = :businessId', { businessId })
      .andWhere('product.track_inventory = :track', { track: true })
      .andWhere('product.quantity <= product.min_quantity')
      .andWhere('product.is_active = :active', { active: true })
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.name', 'ASC')
      .getMany();

    return products;
  }

  async create(businessId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      ...dto,
      business_id: businessId,
    });
    return this.productRepo.save(product);
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(businessId, id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(businessId: string, id: string): Promise<void> {
    const product = await this.findOne(businessId, id);
    await this.productRepo.remove(product);
  }

  async scanProductImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<ScanProductImageResponseDto> {
    if (!this.groq) {
      throw new Error('Groq API key not configured. Please add GROQ_API_KEY to your .env file.');
    }

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    const prompt = `You are analyzing a product image to extract information for inventory management.

Extract ONLY what is clearly visible in the image. Return a JSON object with these exact fields:
- name: product name (string or null)
- description: brief product description (string or null)
- barcode: the numeric string printed under a barcode if visible (string or null)
- unit: unit of measure like "kg", "L", "pcs", "box" (string or null)
- suggested_category_name: a plain text category guess like "Electronics", "Food", "Beverages" (string or null)
- sale_price_ht: price if clearly visible on label/tag (number or null)
- brand: brand name if visible (string or null)
- confidence_note: a short sentence about what was and wasn't visible (string, required)

Rules:
- Return ONLY the raw JSON object, no markdown, no explanation, no code blocks
- If something is not visible or unclear, use null
- For barcode, extract only the numeric string, not the barcode type
- For price, extract only the number without currency symbol
- Be conservative: only extract what you're confident about

Return the JSON now:`;

    const result = await this.groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    let responseText = result.choices[0].message.content?.trim() ?? '';

    // Remove markdown code blocks if present
    responseText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '');

    const parsedResult = JSON.parse(responseText);

    return {
      name: parsedResult.name || null,
      description: parsedResult.description || null,
      barcode: parsedResult.barcode || null,
      unit: parsedResult.unit || null,
      suggested_category_name: parsedResult.suggested_category_name || null,
      sale_price_ht: parsedResult.sale_price_ht || null,
      brand: parsedResult.brand || null,
      confidence_note: parsedResult.confidence_note || 'Analysis completed',
    };
  }

  async generateSku(businessId: string, dto: GenerateSkuDto): Promise<string> {
    // Extract category prefix (first 4 letters uppercased)
    let categoryPrefix = 'GEN';
    if (dto.category_name) {
      categoryPrefix = dto.category_name
        .substring(0, 4)
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      if (categoryPrefix.length === 0) categoryPrefix = 'GEN';
    }

    // Extract brand/name token (first 4 letters uppercased)
    let brandOrNameToken = '000';
    const sourceText = dto.brand || dto.name;
    if (sourceText) {
      brandOrNameToken = sourceText
        .substring(0, 4)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      if (brandOrNameToken.length === 0) brandOrNameToken = '000';
    }

    // Extract attribute token (alphanumeric only, max 6 chars)
    let attributeToken = '';
    if (dto.extra_attribute) {
      attributeToken = dto.extra_attribute
        .replace(/[^A-Za-z0-9]/g, '')
        .substring(0, 6)
        .toUpperCase();
    }

    // Generate unique 4-digit suffix
    // Count existing SKUs with the same category prefix for this business
    const existingCount = await this.productRepo.count({
      where: {
        business_id: businessId,
        sku: Like(`${categoryPrefix}-%`),
      },
    });

    const suffix = String(existingCount + 1).padStart(4, '0');

    // Build final SKU
    let sku = `${categoryPrefix}-${brandOrNameToken}`;
    if (attributeToken) {
      sku += `-${attributeToken}`;
    }
    sku += `-${suffix}`;

    return sku;
  }

  async generateBarcode(businessId: string, productId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId, business_id: businessId },
      relations: ['warehouse'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const warehouseCode = product.warehouse?.code || null;
    const barcode = generateInternalBarcode(warehouseCode, productId);

    product.barcode = barcode;
    return this.productRepo.save(product);
  }

  async generateLabel(businessId: string, productId: string): Promise<Buffer> {
    const product = await this.productRepo.findOne({
      where: { id: productId, business_id: businessId },
      relations: ['warehouse', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    // Generate barcode on the fly if not present (don't save it)
    let barcodeValue = product.barcode;
    if (!barcodeValue) {
      const warehouseCode = product.warehouse?.code || null;
      barcodeValue = generateInternalBarcode(warehouseCode, productId);
    }

    return this.createLabelPDF(business?.name || 'Business', product, barcodeValue);
  }

  async generateBulkLabels(businessId: string, productIds: string[]): Promise<Buffer> {
    const products = await this.productRepo.find({
      where: {
        id: In(productIds),
        business_id: businessId,
      },
      relations: ['warehouse', 'category'],
    });

    if (products.length === 0) {
      throw new NotFoundException('No products found');
    }

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });

    return this.createBulkLabelsPDF(business?.name || 'Business', products);
  }

  private async createLabelPDF(
    businessName: string,
    product: Product,
    barcodeValue: string,
  ): Promise<Buffer> {
    // Generate barcode image first
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcodeValue,
      scale: 2,
      height: 10,
      includetext: false,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [288, 216], margin: 10 }); // 4x3 inches at 72 DPI
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        // Business name (small, top)
        doc.fontSize(8).text(businessName, { align: 'center' });
        doc.moveDown(0.3);

        // Product name (large, bold)
        doc.fontSize(14).font('Helvetica-Bold').text(product.name, { align: 'center' });
        doc.moveDown(0.5);

        // SKU
        doc.fontSize(10).font('Helvetica').text(`SKU: ${product.sku}`, { align: 'center' });
        doc.moveDown(0.3);

        // Barcode value as text
        doc.fontSize(9).text(barcodeValue, { align: 'center' });
        doc.moveDown(0.3);

        // Center the barcode image
        const imgWidth = 200;
        const imgX = (doc.page.width - imgWidth) / 2;
        doc.image(barcodeBuffer, imgX, doc.y, { width: imgWidth });
        doc.moveDown(3);

        // Warehouse and category info
        const info: string[] = [];
        if (product.warehouse) {
          info.push(`Warehouse: ${product.warehouse.name}`);
        }
        if (product.category) {
          info.push(`Category: ${product.category.name}`);
        }
        if (info.length > 0) {
          doc.fontSize(8).text(info.join(' | '), { align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async createBulkLabelsPDF(
    businessName: string,
    products: Product[],
  ): Promise<Buffer> {
    // Pre-generate all barcode images
    const barcodeImages = await Promise.all(
      products.map(async (product) => {
        let barcodeValue = product.barcode;
        if (!barcodeValue) {
          const warehouseCode = product.warehouse?.code || null;
          barcodeValue = generateInternalBarcode(warehouseCode, product.id);
        }

        const buffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: barcodeValue,
          scale: 2,
          height: 8,
          includetext: false,
        });

        return { product, barcodeValue, buffer };
      }),
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 20 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        const labelWidth = 288; // 4 inches
        const labelHeight = 216; // 3 inches
        const cols = 2;
        const rows = 2;
        const marginX = 20;
        const marginY = 20;

        barcodeImages.forEach(({ product, barcodeValue, buffer }, currentLabel) => {
          const col = currentLabel % cols;
          const row = Math.floor((currentLabel % (cols * rows)) / cols);

          // Add new page if needed
          if (currentLabel > 0 && currentLabel % (cols * rows) === 0) {
            doc.addPage();
          }

          const x = marginX + col * labelWidth;
          const y = marginY + row * labelHeight;

          // Draw label content
          doc.save();
          doc.translate(x, y);

          // Business name
          doc.fontSize(8).text(businessName, 10, 10, { width: labelWidth - 20, align: 'center' });

          // Product name
          doc.fontSize(12).font('Helvetica-Bold').text(product.name, 10, 30, {
            width: labelWidth - 20,
            align: 'center',
            ellipsis: true,
          });

          // SKU
          doc.fontSize(9).font('Helvetica').text(`SKU: ${product.sku}`, 10, 55, {
            width: labelWidth - 20,
            align: 'center',
          });

          // Barcode value
          doc.fontSize(8).text(barcodeValue, 10, 70, { width: labelWidth - 20, align: 'center' });

          // Barcode image
          const imgWidth = 180;
          const imgX = (labelWidth - imgWidth) / 2;
          doc.image(buffer, imgX, 85, { width: imgWidth });

          // Warehouse and category
          const info: string[] = [];
          if (product.warehouse) {
            info.push(`WH: ${product.warehouse.name}`);
          }
          if (product.category) {
            info.push(`Cat: ${product.category.name}`);
          }
          if (info.length > 0) {
            doc.fontSize(7).text(info.join(' | '), 10, 150, {
              width: labelWidth - 20,
              align: 'center',
            });
          }

          doc.restore();
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
