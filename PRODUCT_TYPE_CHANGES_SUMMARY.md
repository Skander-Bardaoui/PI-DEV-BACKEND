# Product Type Feature - Implementation Summary

## Overview
Added support for SERVICE and DIGITAL product types alongside the existing PHYSICAL products. Services and digital products do not track inventory and cannot have stock movements.

## Backend Changes Completed

### 1. Product Entity (`src/stock/entities/product.entity.ts`)
- Added `ProductType` enum with values: PHYSICAL, SERVICE, DIGITAL
- Changed `type` column from string to ProductType enum
- Updated default value from 'product' to 'PHYSICAL'

### 2. DTOs Updated
- `create-product.dto.ts`: Added type field with @IsEnum(ProductType) validation
- `update-product.dto.ts`: Added type field with @IsEnum(ProductType) validation  
- `query-products.dto.ts`: Added type filter parameter

### 3. Products Service (`src/stock/services/products.service.ts`)
- Added type filter in `findAll()` method
- In `create()`: Force track_inventory=false, quantity=0, min_quantity=0, warehouse_id=null for SERVICE/DIGITAL
- In `update()`: Same enforcement for SERVICE/DIGITAL products

### 4. Stock Movements Service (`src/stock/services/stock-movements/stock-movements.service.ts`)
- Added guard in `createManual()` to throw BadRequestException if product type is SERVICE or DIGITAL

### 5. Sales Module (`src/sales/services/sales-orders.service.ts`)
- Added ProductType import
- In `create()`: Check product type before creating SORTIE_VENTE movements, skip if SERVICE/DIGITAL
- In `update()`: Same check before creating movements

### 6. Purchases Module (`src/Purchases/services/supplier-pos.service.ts`)
- Added ProductType import
- In stock movement creation: Check product type before creating ENTREE_ACHAT movements, skip if SERVICE/DIGITAL

### 7. Migration (`src/migrations/1775100000000-AddProductTypeEnum.ts`)
- Updates default value from 'product' to 'PHYSICAL'
- Migrates existing 'product' values to 'PHYSICAL'
- Includes rollback logic

## Frontend Changes Needed

### Files to Modify:

1. **Product Type Definition** (`PI-DEV-FRONT/src/types/product.ts`)
   - Add ProductType enum matching backend
   - Update Product interface to use ProductType instead of string

2. **Products API** (`PI-DEV-FRONT/src/api/products.api.ts`)
   - Ensure type parameter is passed in query filters

3. **Navigation** (`PI-DEV-FRONT/src/layouts/BackOfficeLayout.tsx`)
   - Split "Products" nav item into two:
     - Products (icon: Box, route: /app/stock/products)
     - Services (icon: Briefcase or similar, route: /app/stock/services)

4. **Routing** (`PI-DEV-FRONT/src/App.tsx`)
   - Add new route: `<Route path="stock/services" element={<Services />} />`

5. **Products Page** (`PI-DEV-FRONT/src/pages/backoffice/Products.tsx`)
   - Add `type: 'PHYSICAL'` to all API calls (in loadProducts query and form submission)
   - Keep all existing functionality unchanged

6. **New Services Page** (`PI-DEV-FRONT/src/pages/backoffice/Services.tsx`)
   - Create new page similar to Products but simplified:
     - Call API with `?type=SERVICE`
     - Table columns: Name, SKU/Reference, Price (HT), Category, Status, Actions
     - Remove: quantity, warehouse, barcode, stock alerts, low stock indicators
     - Filters: Search, Category, Status only (no warehouse, no stock filters)
     - Add blue info banner: "Services are not tracked in inventory and do not generate stock movements."

7. **Service Form Modal** (in Services.tsx)
   - Simplified form with only:
     - Name (required)
     - SKU/Reference with Generate SKU button
     - Description (textarea)
     - Category dropdown
     - Price HT (required)
     - Tax rate (default 19)
     - Is active toggle
   - On submit, include `type: 'SERVICE', track_inventory: false`
   - No warehouse, barcode, quantity, min quantity, weight, dimensions, unit fields

8. **Stock Movements Page** (`PI-DEV-FRONT/src/pages/backoffice/StockMovements.tsx`)
   - In manual movement creation form:
     - After product selection, check if product.type === 'SERVICE' or 'DIGITAL'
     - If true, show inline error: "Services cannot have stock movements."
     - Clear product selection and prevent form submission

9. **Stock Alerts Page**
   - No changes needed (already filters by track_inventory=true)

## Testing Checklist

### Backend:
- [ ] Create a SERVICE product via API
- [ ] Verify track_inventory is forced to false
- [ ] Try to create stock movement for SERVICE product (should fail)
- [ ] Create sales order with SERVICE product (should not create stock movement)
- [ ] Create purchase order with SERVICE product (should not create stock movement)
- [ ] Filter products by type=PHYSICAL and type=SERVICE
- [ ] Run migration and verify existing products are migrated to PHYSICAL

### Frontend:
- [ ] Navigate to Products page, verify only PHYSICAL products shown
- [ ] Navigate to Services page, verify only SERVICE products shown
- [ ] Create a new service via Services page
- [ ] Verify service form doesn't show inventory fields
- [ ] Try to create manual stock movement for a service (should show error)
- [ ] Verify stock alerts don't show services

## All Modified Files

### Backend:
1. `src/stock/entities/product.entity.ts` - Added ProductType enum, updated type column
2. `src/stock/dto/create-product.dto.ts` - Added type field with enum validation
3. `src/stock/dto/update-product.dto.ts` - Added type field with enum validation
4. `src/stock/dto/query-products.dto.ts` - Added type filter
5. `src/stock/services/products.service.ts` - Added type filter and inventory enforcement
6. `src/stock/services/stock-movements/stock-movements.service.ts` - Added guard for SERVICE/DIGITAL
7. `src/sales/services/sales-orders.service.ts` - Skip movements for SERVICE/DIGITAL
8. `src/Purchases/services/supplier-pos.service.ts` - Skip movements for SERVICE/DIGITAL
9. `src/migrations/1775100000000-AddProductTypeEnum.ts` - Migration file (NEW)

### Frontend (to be created/modified):
1. `src/types/product.ts` - Add ProductType enum
2. `src/layouts/BackOfficeLayout.tsx` - Add Services nav item
3. `src/App.tsx` - Add Services route
4. `src/pages/backoffice/Products.tsx` - Add type=PHYSICAL filter
5. `src/pages/backoffice/Services.tsx` - New page (CREATE)
6. `src/pages/backoffice/StockMovements.tsx` - Add service validation
