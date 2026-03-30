// src/stock/services/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import Groq from 'groq-sdk';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ScanProductImageResponseDto } from '../dto/scan-product-image.dto';

@Injectable()
export class ProductsService {
  private groq: Groq;

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    }
  }

  async findAll(businessId: string, isActive?: boolean): Promise<Product[]> {
    const where: any = { business_id: businessId };
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    return this.productRepo.find({
      where,
      relations: ['category', 'default_supplier'],
      order: { name: 'ASC' },
    });
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
}
