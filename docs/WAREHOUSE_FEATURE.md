# Warehouse Feature - Complete Documentation

## Overview

The Warehouse feature extends the Stock module to support multi-location inventory management. Businesses can now organize their products across multiple physical warehouses, track stock movements per warehouse, and get detailed stock reports for each location.

---

## Backend Implementation

### 1. Database Schema

#### Warehouses Table

**Table:** `warehouses`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `business_id` | UUID | NOT NULL, FK → businesses | Owner business |
| `name` | VARCHAR(255) | NOT NULL | Warehouse name |
| `code` | VARCHAR(50) | NOT NULL | Unique code per business (e.g., WH01) |
| `description` | TEXT | NULLABLE | Optional description |
| `address` | TEXT | NULLABLE | Physical address |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Indexes:**
- `IDX_warehouses_business_id` on `business_id`
- `IDX_warehouses_business_id_is_active` on `(business_id, is_active)`
- `IDX_warehouses_business_id_code` on `(business_id, code)` - UNIQUE

**Foreign Keys:**
- `business_id` → `businesses(id)` ON DELETE CASCADE

---

#### Updated Tables

**Products Table** - Added Fields:
- `warehouse_id` (UUID, NULLABLE) - FK → warehouses(id) ON DELETE SET NULL

**Stock Movements Table** - Added Fields:
- `warehouse_id` (UUID, NULLABLE) - FK → warehouses(id) ON DELETE SET NULL

---

### 2. Entity: Warehouse

**File:** `src/stock/entities/warehouse.entity.ts`

```typescript
@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  business: Business;

  @OneToMany(() => Product, (product) => product.warehouse)
  products: Product[];

  @OneToMany(() => StockMovement, (movement) => movement.warehouse)
  stock_movements: StockMovement[];
}
```

---

### 3. DTOs

#### CreateWarehouseDto

**File:** `src/stock/dto/create-warehouse.dto.ts`

```typescript
export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
```

#### UpdateWarehouseDto

**File:** `src/stock/dto/update-warehouse.dto.ts`

```typescript
export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}
```

---

### 4. Service: WarehousesService

**File:** `src/stock/services/warehouses.service.ts`

#### Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `findAll` | Get all warehouses | `businessId`, `isActive?` | `Warehouse[]` |
| `findOne` | Get one warehouse | `businessId`, `id` | `Warehouse` |
| `create` | Create warehouse | `businessId`, `dto` | `Warehouse` |
| `update` | Update warehouse | `businessId`, `id`, `dto` | `Warehouse` |
| `remove` | Delete warehouse | `businessId`, `id` | `void` |
| `getWarehouseStock` | Get all products in warehouse | `businessId`, `warehouseId` | `Product[]` |

#### Business Logic

**Code Uniqueness:**
- Warehouse codes must be unique per business
- Validation on create and update
- Returns `BadRequestException` if code already exists

**Stock Retrieval:**
- `getWarehouseStock` returns all products where `warehouse_id` matches
- Includes product category relation
- Ordered by product name

---

### 5. Controller: WarehousesController

**File:** `src/stock/controllers/warehouses.controller.ts`

**Base URL:** `/businesses/:businessId/warehouses`

#### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | List all warehouses | READ |
| GET | `/:id` | Get one warehouse | READ |
| GET | `/:id/stock` | Get warehouse stock | READ |
| POST | `/` | Create warehouse | WRITE |
| PUT | `/:id` | Update warehouse | WRITE |
| DELETE | `/:id` | Delete warehouse | WRITE |

**Roles:**
- READ: BUSINESS_OWNER, BUSINESS_ADMIN, ACCOUNTANT, TEAM_MEMBER
- WRITE: BUSINESS_OWNER, BUSINESS_ADMIN

**Guards:**
- `AuthGuard('jwt')` - Authentication required
- `RolesGuard` - Role-based access control

---

### 6. Module Updates

**File:** `src/stock/stock.module.ts`

**Changes:**
- Added `Warehouse` entity to TypeORM imports
- Added `WarehousesService` to providers
- Added `WarehousesController` to controllers
- Exported `WarehousesService` for use in other modules

---

### 7. Migration

**File:** `src/migrations/1711800000000-AddWarehouseFeature.ts`

**Up Migration:**
1. Create `warehouses` table with all columns and indexes
2. Add FK from `warehouses.business_id` to `businesses.id`
3. Add `warehouse_id` column to `products` table
4. Add FK from `products.warehouse_id` to `warehouses.id`
5. Add `warehouse_id` column to `stock_movements` table
6. Add FK from `stock_movements.warehouse_id` to `warehouses.id`

**Down Migration:**
1. Drop FKs from `products` and `stock_movements`
2. Drop `warehouse_id` columns
3. Drop `warehouses` table

**Run Migration:**
```bash
npm run migration:run
```

---

## Frontend Implementation

### 1. Types

**File:** `src/types/warehouse.ts`

```typescript
export interface Warehouse {
  id: string;
  business_id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  description?: string;
  address?: string;
  is_active?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  is_active?: boolean;
}
```

**Updated Types:**
- `StockProduct` - Added `warehouse_id?: string | null`
- `CreateProductDto` - Added `warehouse_id?: string`
- `UpdateProductDto` - Added `warehouse_id?: string`
- `StockMovement` - Added `warehouse_id?: string | null`
- `CreateStockMovementDto` - Added `warehouse_id?: string`

---

### 2. API Service

**File:** `src/api/warehouses.api.ts`

```typescript
export const warehousesApi = {
  getAll(businessId, params?): Promise<Warehouse[]>
  getOne(businessId, id): Promise<Warehouse>
  create(businessId, data): Promise<Warehouse>
  update(businessId, id, data): Promise<Warehouse>
  delete(businessId, id): Promise<void>
  getWarehouseStock(businessId, warehouseId): Promise<StockProduct[]>
}
```

---

### 3. Pages

#### Warehouses List Page

**File:** `src/pages/backoffice/Warehouses.tsx`

**Features:**
- Grid layout showing warehouse cards
- Each card displays:
  - Warehouse icon
  - Name and code
  - Active/Inactive badge
  - Description preview
  - Address preview
  - "View Stock" button
  - Edit and Delete actions
- "New Warehouse" button opens modal
- Create/Edit modal with form
- Empty state when no warehouses exist
- Loading state

**Actions:**
- Create new warehouse
- Edit existing warehouse
- Delete warehouse (with confirmation)
- Navigate to warehouse detail page

---

#### Warehouse Detail Page

**File:** `src/pages/backoffice/WarehouseDetail.tsx`

**Features:**
- Header with warehouse info:
  - Name, code, status badge
  - Description and address
  - Statistics: Total Products, Total Units, Low Stock Items
- Products table showing:
  - Product name and reference
  - Category
  - Current stock
  - Min threshold
  - Status (OK or Low Stock)
- Low stock items highlighted in orange
- Back button to warehouses list
- Empty state when no products assigned

---

#### Updated: Products Page

**File:** `src/pages/backoffice/Products.tsx`

**Changes:**
- Added warehouse dropdown in create/edit form
- Loads active warehouses on mount
- Dropdown shows: "Warehouse Name (CODE)"
- Optional field - can be left empty

---

#### Updated: Stock Movements Page

**File:** `src/pages/backoffice/StockMovements.tsx`

**Changes:**
- Added warehouse dropdown in create movement form
- Loads active warehouses on mount
- Dropdown shows: "Warehouse Name (CODE)"
- Optional field - can be left empty

---

### 4. Routing

**File:** `src/App.tsx`

**Added Routes:**
```typescript
<Route path="warehouses" element={<Warehouses />} />
<Route path="warehouses/:id" element={<WarehouseDetail />} />
```

---

## Usage Examples

### Backend

#### Create a Warehouse

```typescript
POST /businesses/{businessId}/warehouses
{
  "name": "Main Warehouse",
  "code": "WH01",
  "description": "Primary storage facility",
  "address": "123 Main St, City, Country",
  "is_active": true
}
```

#### Get Warehouse Stock

```typescript
GET /businesses/{businessId}/warehouses/{warehouseId}/stock

Response:
[
  {
    "id": "uuid",
    "name": "Product A",
    "reference": "SKU-001",
    "current_stock": 100.000,
    "min_stock_threshold": 20.000,
    "category": { "name": "Electronics" }
  }
]
```

#### Assign Product to Warehouse

```typescript
PUT /businesses/{businessId}/products/{productId}
{
  "warehouse_id": "warehouse-uuid"
}
```

#### Create Stock Movement with Warehouse

```typescript
POST /businesses/{businessId}/stock-movements/manual
{
  "product_id": "product-uuid",
  "type": "AJUSTEMENT_POSITIF",
  "quantity": 50,
  "warehouse_id": "warehouse-uuid",
  "note": "Inventory adjustment for Main Warehouse"
}
```

---

### Frontend

#### Navigate to Warehouses

```typescript
navigate('/backoffice/warehouses')
```

#### View Warehouse Stock

```typescript
navigate(`/backoffice/warehouses/${warehouseId}`)
```

---

## Data Flow

### Creating a Warehouse

1. User clicks "New Warehouse" button
2. Modal opens with form
3. User fills: name, code, description, address
4. Form submits to `POST /businesses/:businessId/warehouses`
5. Backend validates code uniqueness
6. Warehouse created and saved
7. Modal closes, list refreshes

### Assigning Product to Warehouse

1. User edits product
2. Selects warehouse from dropdown
3. Form submits with `warehouse_id`
4. Product updated with warehouse reference
5. Product now appears in warehouse stock

### Viewing Warehouse Stock

1. User clicks "View Stock" on warehouse card
2. Navigate to `/warehouses/:id`
3. Load warehouse details and products
4. Display products table with stock levels
5. Highlight low stock items

### Stock Movement with Warehouse

1. User creates manual stock movement
2. Selects warehouse from dropdown
3. Movement created with `warehouse_id`
4. Movement tracked per warehouse
5. Product stock updated

---

## Business Rules

### Warehouse Management

1. **Code Uniqueness:** Warehouse codes must be unique per business
2. **Soft Delete:** Warehouses can be deactivated (is_active = false) instead of deleted
3. **Product Assignment:** Products can be assigned to zero or one warehouse
4. **Movement Tracking:** Stock movements can optionally reference a warehouse

### Stock Tracking

1. **Product Stock:** Product quantity is global, not per warehouse
2. **Warehouse View:** Warehouse stock shows all products assigned to it
3. **Low Stock Alert:** Based on product's min_threshold, regardless of warehouse
4. **Movement History:** Movements can be filtered by warehouse

---

## Security

### Authentication & Authorization

- All endpoints require JWT authentication
- Role-based access control:
  - Read operations: All business members
  - Write operations: Owners and Admins only

### Data Isolation

- All queries filter by `business_id`
- Users can only access warehouses of their business
- Foreign key constraints ensure data integrity

---

## Performance Considerations

### Database Indexes

- `business_id` indexed for fast filtering
- `(business_id, code)` unique index for code validation
- `(business_id, is_active)` for active warehouse queries

### Query Optimization

- Warehouse stock query uses single JOIN with category
- Products ordered by name for consistent display
- Pagination not implemented (assumed small number of warehouses)

---

## Future Enhancements

### Potential Features

1. **Multi-Warehouse Stock:**
   - Track quantity per warehouse
   - Inter-warehouse transfers
   - Warehouse-specific stock movements

2. **Warehouse Capacity:**
   - Maximum capacity tracking
   - Space utilization metrics
   - Capacity alerts

3. **Warehouse Zones:**
   - Sub-locations within warehouses
   - Aisle/Shelf/Bin organization
   - Pick path optimization

4. **Warehouse Staff:**
   - Assign users to warehouses
   - Warehouse-specific permissions
   - Activity tracking per warehouse

5. **Advanced Reporting:**
   - Stock value per warehouse
   - Movement history per warehouse
   - Warehouse performance metrics

6. **Barcode Integration:**
   - Warehouse barcode labels
   - Mobile scanning for movements
   - Location verification

---

## Testing

### Backend Tests

**Unit Tests:**
```typescript
describe('WarehousesService', () => {
  it('should create warehouse with unique code')
  it('should throw error for duplicate code')
  it('should get warehouse stock')
  it('should filter by business_id')
})
```

**Integration Tests:**
```typescript
describe('Warehouses API', () => {
  it('POST /warehouses - creates warehouse')
  it('GET /warehouses/:id/stock - returns products')
  it('PUT /warehouses/:id - updates warehouse')
  it('DELETE /warehouses/:id - removes warehouse')
})
```

### Frontend Tests

**Component Tests:**
```typescript
describe('Warehouses Page', () => {
  it('renders warehouse list')
  it('opens create modal')
  it('submits form successfully')
  it('navigates to detail page')
})

describe('Warehouse Detail Page', () => {
  it('displays warehouse info')
  it('shows products table')
  it('highlights low stock items')
})
```

---

## Troubleshooting

### Common Issues

**Issue:** Duplicate code error
- **Cause:** Warehouse code already exists for business
- **Solution:** Use a different code or update existing warehouse

**Issue:** Products not showing in warehouse stock
- **Cause:** Products not assigned to warehouse
- **Solution:** Edit products and select warehouse

**Issue:** Cannot delete warehouse
- **Cause:** Database constraint or permission issue
- **Solution:** Check if products are assigned, verify user role

**Issue:** Warehouse dropdown empty
- **Cause:** No active warehouses or API error
- **Solution:** Create warehouses, check API response

---

## Migration Guide

### Existing Data

**Products without Warehouse:**
- All existing products have `warehouse_id = NULL`
- This is valid and expected
- Assign warehouses as needed

**Stock Movements without Warehouse:**
- All existing movements have `warehouse_id = NULL`
- Historical data remains valid
- New movements can include warehouse

### Rollback

If needed, run down migration:
```bash
npm run migration:revert
```

This will:
1. Remove warehouse columns from products and stock_movements
2. Drop warehouses table
3. Restore database to previous state

---

## API Reference Summary

### Warehouses Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/businesses/:businessId/warehouses` | GET | List warehouses |
| `/businesses/:businessId/warehouses/:id` | GET | Get warehouse |
| `/businesses/:businessId/warehouses/:id/stock` | GET | Get stock |
| `/businesses/:businessId/warehouses` | POST | Create warehouse |
| `/businesses/:businessId/warehouses/:id` | PUT | Update warehouse |
| `/businesses/:businessId/warehouses/:id` | DELETE | Delete warehouse |

### Updated Endpoints

**Products:**
- Accept `warehouse_id` in create/update DTOs

**Stock Movements:**
- Accept `warehouse_id` in create DTO

---

## Conclusion

The Warehouse feature provides a solid foundation for multi-location inventory management. It's designed to be:

- ✅ Non-breaking: All new fields are nullable
- ✅ Scalable: Indexed for performance
- ✅ Secure: Role-based access control
- ✅ User-friendly: Intuitive UI with clear workflows
- ✅ Extensible: Ready for future enhancements

For questions or issues, refer to the main Stock module documentation or contact the development team.
