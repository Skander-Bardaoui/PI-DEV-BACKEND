// src/businesses/businesses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { Business } from './entities/business.entity';
import { BusinessSettings } from './entities/business-settings.entity';
import { TaxRate } from './entities/tax-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Business, BusinessSettings, TaxRate])],
  providers: [BusinessesService],
  controllers: [BusinessesController],
  exports: [BusinessesService],
})
export class BusinessesModule {}    