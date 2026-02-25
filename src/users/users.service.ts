// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ─── Find Methods ────────────────────────────────────────────────────────
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // ─── Create User ─────────────────────────────────────────────────────────
  async create(data: {
    email: string;
    password_hash: string;
    name: string;
    role?: Role;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: data.email,
      password_hash: data.password_hash,
      name: data.name,
      role: data.role || Role.TEAM_MEMBER,
    });
    return this.userRepository.save(user);
  }

  // ─── Update User ─────────────────────────────────────────────────────────
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    const updated = await this.userRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  // ─── Verify User ─────────────────────────────────────────────────────────
  async verify(id: string): Promise<void> {
    await this.userRepository.update(id, { is_verified: true });
  }

  // ─── Change Role ─────────────────────────────────────────────────────────
  async updateRole(id: string, role: Role): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.userRepository.save(user);
  }

  // ─── List All Users (with pagination and search) ────────────────────────
  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { email: Like(`%${search}%`) },
          { name: Like(`%${search}%`) },
        ]
      : {};

    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { users, total };
  }

  // ─── Delete User ─────────────────────────────────────────────────────────
  async deleteUser(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  // ─── Suspend User ────────────────────────────────────────────────────────
  async suspend(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.is_suspended = true;
    return this.userRepository.save(user);
  }

  // ─── Activate User ───────────────────────────────────────────────────────
  async activate(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.is_suspended = false;
    return this.userRepository.save(user);
  }
}