# Purchase Order Services Support

## Overview
This document describes the enhancement made to the purchase order (Bon de Commande) system to support both **products** and **services** in line items.

## Changes Made

### 1. Frontend Changes

#### New Component: `ItemSelectorPurchase.tsx`
- **Location**: `PI-DEV-FRONT/src/components/purchases/ItemSelectorPurchase.tsx`
- **Purpose**: Dynamic selector that switches between products and services based on item type
- **Features**:
  - Supports both `PRODUCT` and `SERVICE` item types
  - Fetches appropriate items from the API based on type
  - Returns structured `SelectedItem` with all necessary fields
  - Displays price and stock information (for products)

#### Updated Component: `SupplierPOModal.tsx`
- **Changes**:
  - Added `Type` dropdown column before the item selector
  - Replaced `ProductSelectorPurchase` with `ItemSelectorPurchase`
  - Updated form to handle `item_type` field
  - Changed column header from "Produit" to "Article"
  - Changed "Qté" to "Qté / Durée" to accommodate services
  - Updated default values to include `item_type: 'PRODUCT'`

#### Schema Updates: `purchases.schemas.ts`
- **Changes**:
  - Added `item_type` field to `poItemSchema` with enum validation
  - Default value: `'PRODUCT'`
  - Validation: Must be either `'PRODUCT'` or `'SERVICE'`

#### Type Updates: `supplier-po.ts`
- **Changes**:
  - Added `item_type` field to `SupplierPOItem` interface
  - Added `item_type` field to `CreateSupplierPOItemDto` interface
  - Type: `'PRODUCT' | 'SERVICE'`

### 2. Backend Changes

#### DTO Updates: `create-supplier-po-item.dto.ts`
- **Changes**:
  - Added `ItemType` enum with values `PRODUCT` and `SERVICE`
  - Added `item_type` field with `@IsEnum` validation
  - Field is optional and defaults to `PRODUCT`

#### Entity Updates: `supplier-po-item.entity.ts`
- **Changes**:
  - Added `item_type` column
  - Type: `varchar(20)`
  - Default: `'PRODUCT'`
  - Stores either `'PRODUCT'` or `'SERVICE'`

#### Database Migration: `migration-add-item-type-to-po-items.sql`
- **Changes**:
  - Adds `item_type` column to `supplier_po_items` table
  - Sets default value to `'PRODUCT'`
  - Adds check constraint to ensure only valid values
  - Updates existing records to have `'PRODUCT'` as item_type
  - Adds column comment for documentation

### 3. Service Layer
No changes required - the existing `SupplierPOsService` already handles items dynamically through the `calcTotals` method, which works with any item structure.

## UI Behavior

### Column Structure
The purchase order line items now have the following columns:

| Column | Description | Behavior |
|--------|-------------|----------|
| **Type** | Dropdown to select item type | Options: "Produit" or "Service" |
| **Article** | Dynamic selector | Shows products when Type=Produit, services when Type=Service |
| **Qté** | Quantity (products only) | Visible only for products; Hidden for services (auto-set to 1) |
| **Prix HT** | Unit price excluding tax | Auto-filled from selected item, editable |
| **TVA** | Tax rate | Dropdown with standard rates (0%, 7%, 13%, 19%) |
| **Total HT** | Line total | Calculated automatically |

### User Flow

1. **Add a new line**: Click "Ajouter" button
2. **Select Type**: Choose "Produit" or "Service" from dropdown
3. **Select Article**: 
   - If Type = Produit: List shows all active products with stock info
   - If Type = Service: List shows all active services
4. **Enter Quantity** (Products only): 
   - For products: Enter quantity to order
   - For services: Quantity is automatically set to 1 (hidden)
5. **Verify/Edit Price**: Price is auto-filled but can be adjusted
6. **Select Tax Rate**: Choose appropriate VAT rate

### Service-Specific Features

When a service is selected:
- Price is auto-filled from `price_ht` field
- Description may include duration notes
- No stock information is displayed
- Quantity field is hidden and automatically set to 1
- Total is calculated as: Price HT × 1

## Database Schema

### Table: `supplier_po_items`

```sql
CREATE TABLE supplier_po_items (
  id UUID PRIMARY KEY,
  supplier_po_id UUID NOT NULL,
  item_type VARCHAR(20) DEFAULT 'PRODUCT',  -- NEW FIELD
  product_id UUID,
  description VARCHAR(500) NOT NULL,
  quantity_ordered DECIMAL(15,3) NOT NULL,
  quantity_received DECIMAL(15,3) DEFAULT 0,
  unit_price_ht DECIMAL(15,3) NOT NULL,
  tax_rate_value DECIMAL(5,2) NOT NULL,
  line_total_ht DECIMAL(15,3) NOT NULL,
  line_tax DECIMAL(15,3) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  CONSTRAINT chk_item_type CHECK (item_type IN ('PRODUCT', 'SERVICE'))
);
```

## Migration Instructions

### 1. Run Database Migration
```bash
psql -U your_user -d your_database -f migration-add-item-type-to-po-items.sql
```

### 2. Verify Migration
```sql
-- Check that column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'supplier_po_items' AND column_name = 'item_type';

-- Check that existing records have default value
SELECT item_type, COUNT(*) 
FROM supplier_po_items 
GROUP BY item_type;
```

### 3. Deploy Frontend Changes
```bash
cd PI-DEV-FRONT
npm install
npm run build
```

### 4. Deploy Backend Changes
```bash
cd PI-DEV-BACKEND
npm install
npm run build
npm run start:prod
```

## Testing Checklist

### Frontend Testing
- [ ] Type dropdown appears in purchase order modal
- [ ] Selecting "Produit" shows product list
- [ ] Selecting "Service" shows service list
- [ ] Switching type clears the selected item
- [ ] Price auto-fills when item is selected
- [ ] Form validation works correctly
- [ ] Can create PO with products only
- [ ] Can create PO with services only
- [ ] Can create PO with mixed products and services

### Backend Testing
- [ ] API accepts `item_type` field in POST request
- [ ] Default value `'PRODUCT'` is applied when not specified
- [ ] Validation rejects invalid item types
- [ ] Database stores item_type correctly
- [ ] Existing POs still work correctly
- [ ] PDF generation includes item type information

### Integration Testing
- [ ] Create PO with service items
- [ ] View PO details showing service items
- [ ] Edit PO with service items
- [ ] Generate PDF for PO with services
- [ ] Send PO email with services
- [ ] Supplier portal displays services correctly

## API Examples

### Create Purchase Order with Services

```typescript
POST /api/businesses/:businessId/supplier-pos

{
  "supplier_id": "uuid-here",
  "expected_delivery": "2026-05-01",
  "notes": "Mixed order with products and services",
  "items": [
    {
      "item_type": "PRODUCT",
      "product_id": "product-uuid",
      "description": "Product Name",
      "quantity_ordered": 10,
      "unit_price_ht": 50.000,
      "tax_rate_value": 19
    },
    {
      "item_type": "SERVICE",
      "product_id": "service-uuid",
      "description": "Consulting Service",
      "quantity_ordered": 1,
      "unit_price_ht": 150.000,
      "tax_rate_value": 19
    }
  ]
}
```

### Response

```typescript
{
  "id": "po-uuid",
  "po_number": "ACH-2026-00123",
  "status": "DRAFT",
  "items": [
    {
      "id": "item-uuid-1",
      "item_type": "PRODUCT",
      "description": "Product Name",
      "quantity_ordered": 10,
      "unit_price_ht": 50.000,
      "line_total_ht": 500.000
    },
    {
      "id": "item-uuid-2",
      "item_type": "SERVICE",
      "description": "Consulting Service",
      "quantity_ordered": 1,
      "unit_price_ht": 150.000,
      "line_total_ht": 150.000
    }
  ],
  "subtotal_ht": 650.000,
  "tax_amount": 123.500,
  "net_amount": 774.500
}
```

## Future Enhancements

### Potential Improvements
1. **Service Duration Display**: Show duration notes below service name
2. **Service Categories**: Filter services by category
3. **Service Templates**: Quick-add common service packages
4. **Service Scheduling**: Link services to calendar/scheduling system
5. **Service Delivery Tracking**: Track service completion vs. product delivery
6. **Separate Reporting**: Generate reports for products vs. services separately

### Considerations
- Services don't affect inventory/stock levels
- Services may have different delivery/completion tracking
- Services might need different approval workflows
- Consider adding service-specific fields (duration, location, technician, etc.)

## Troubleshooting

### Issue: Type dropdown not showing
**Solution**: Clear browser cache and reload the page

### Issue: Services not appearing in selector
**Solution**: Verify services are marked as active in the Services module

### Issue: Migration fails
**Solution**: Check if column already exists, drop and recreate if necessary

### Issue: Validation errors on item_type
**Solution**: Ensure value is exactly 'PRODUCT' or 'SERVICE' (case-sensitive)

## Support

For questions or issues, contact the development team or refer to:
- Frontend documentation: `PI-DEV-FRONT/README.md`
- Backend documentation: `PI-DEV-BACKEND/README.md`
- Services module documentation: `PI-DEV-BACKEND/docs/`
