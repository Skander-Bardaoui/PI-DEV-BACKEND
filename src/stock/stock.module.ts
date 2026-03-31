import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Business } from '../businesses/entities/business.entity';
import { StockMovementsService } from './services/stock-movements/stock-movements.service';
import { ProductCategoriesService } from './services/product-categories.service';
import { ProductsService } from './services/products.service';
import { WarehousesService } from './services/warehouses.service';
import { ProductCategoriesController } from './controllers/product-categories.controller';
import { ProductsController } from './controllers/products.controller';
import { StockMovementsController } from './controllers/stock-movements.controller';
import { WarehousesController } from './controllers/warehouses.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductCategory, StockMovement, Warehouse, Business]),
  ],
  controllers: [ProductCategoriesController, ProductsController, StockMovementsController, WarehousesController],
  exports: [TypeOrmModule, StockMovementsService, ProductsService, WarehousesService],
  providers: [StockMovementsService, ProductCategoriesService, ProductsService, WarehousesService],
})
export class StockModule {}

