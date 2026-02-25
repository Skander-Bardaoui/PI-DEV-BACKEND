// src/tenants/tenants.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './entities/dto/create-tenant.dto';
import { UpdateTenantDto } from './entities/dto/update-tenant.dto';


@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  // ─── Create Tenant ───────────────────────────────────────────────────────
  async create(dto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create(dto);
    return this.tenantRepository.save(tenant);
  }

  // ─── List All Tenants (with pagination) ─────────────────────────────────
  async findAll(page: number = 1, limit: number = 20): Promise<{ tenants: Tenant[]; total: number }> {
    const skip = (page - 1) * limit;

    const [tenants, total] = await this.tenantRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { tenants, total };
  }

  // ─── Get Tenant by ID ────────────────────────────────────────────────────
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  // ─── Get Tenant by Owner ID ──────────────────────────────────────────────
  async findByOwnerId(ownerId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { ownerId } });
    if (!tenant) {
      throw new NotFoundException('You do not own any tenant');
    }
    return tenant;
  }

  // ─── Update Tenant ───────────────────────────────────────────────────────
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.tenantRepository.update(id, dto);
    return this.findById(id);
  }

  // ─── Delete Tenant ───────────────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    const result = await this.tenantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Tenant not found');
    }
  }

  // ─── Check if user owns this tenant ──────────────────────────────────────
  async checkOwnership(tenantId: string, userId: string): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    return tenant.ownerId === userId;
  }
}