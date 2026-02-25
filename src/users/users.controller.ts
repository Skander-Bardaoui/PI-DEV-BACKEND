// src/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from './enums/role.enum';

import { ChangeRoleDto } from './dto/change-role.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';


@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── GET /users ──────────────────────────────────────────────────────────
  @Get()
  @Roles(Role.PLATFORM_ADMIN)
  async findAll(@Query() query: QueryUsersDto) {
    const { users, total } = await this.usersService.findAll(
      query.page,
      query.limit,
      query.search,
    );

    // Don't send password_hash to frontend
    const safeUsers = users.map(({ password_hash, ...rest }) => rest);

    return {
      users: safeUsers,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  // ─── GET /users/:id ──────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.PLATFORM_ADMIN)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return { message: 'User not found' };
    }

    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  // ─── PATCH /users/:id ────────────────────────────────────────────────────
  @Patch(':id')
  @Roles(Role.PLATFORM_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.updateUser(id, dto);
    const { password_hash, ...safeUser } = updated;
    return safeUser;
  }

  // ─── DELETE /users/:id ───────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  // ─── PATCH /users/:id/role ───────────────────────────────────────────────
  @Patch(':id/role')
  @Roles(Role.PLATFORM_ADMIN)
  async changeRole(@Param('id') id: string, @Body() dto: ChangeRoleDto) {
    const updated = await this.usersService.updateRole(id, dto.role);
    const { password_hash, ...safeUser } = updated;
    return safeUser;
  }

  // ─── POST /users/:id/suspend ─────────────────────────────────────────────
  @Post(':id/suspend')
  @Roles(Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id') id: string) {
    await this.usersService.suspend(id);
    return { message: 'User suspended successfully' };
  }

  // ─── POST /users/:id/activate ────────────────────────────────────────────
  @Post(':id/activate')
  @Roles(Role.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string) {
    await this.usersService.activate(id);
    return { message: 'User activated successfully' };
  }
}