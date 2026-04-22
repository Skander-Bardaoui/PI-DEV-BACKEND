# Services in Purchase Orders - Implementation Summary

## Quick Overview

The purchase order system now supports both **products** and **services** in line items.

## Key Changes

### UI Changes
- ✅ Added **Type** dropdown (Produit/Service) before item selector
- ✅ Dynamic **Article** selector that switches between products and services
- ✅ **Quantity field hidden** for services (auto-set to 1)
- ✅ Quantity field visible only for products
- ✅ Column header changed from "Produit" to "Article"

### Backend Changes
- ✅ Added `item_type` field to `CreateSupplierPOItemDto`
- ✅ Added `item_type` column to `supplier_po_items` table
- ✅ Database migration script created
- ✅ Validation for item_type ('PRODUCT' or 'SERVICE')

### Business Logic
- **Products**: User enters quantity, total = quantity × price
- **Services**: Quantity is always 1 (hidden), total = price × 1

## Visual Example

### Product Line
```
Type: Produit
Article: Laptop Dell XPS
Quantity: 5 ← User enters this
Price: 1200.000 DT
Total: 6000.000 DT (5 × 1200)
```

### Service Line
```
Type: Service
Article: IT Consulting
Quantity: - (hidden, auto = 1)
Price: 150.000 DT
Total: 150.000 DT (1 × 150)
```

## Files Modified

### Frontend
1. `PI-DEV-FRONT/src/components/purchases/ItemSelectorPurchase.tsx` (NEW)
2. `PI-DEV-FRONT/src/components/purchases/SupplierPOModal.tsx` (UPDATED)
3. `PI-DEV-FRONT/src/schemas/purchases.schemas.ts` (UPDATED)
4. `PI-DEV-FRONT/src/types/supplier-po.ts` (UPDATED)

### Backend
1. `PI-DEV-BACKEND/src/Purchases/dto/create-supplier-po-item.dto.ts` (UPDATED)
2. `PI-DEV-BACKEND/src/Purchases/entities/supplier-po-item.entity.ts` (UPDATED)
3. `PI-DEV-BACKEND/migration-add-item-type-to-po-items.sql` (NEW)

### Documentation
1. `PI-DEV-BACKEND/PURCHASE_ORDER_SERVICES_SUPPORT.md` (NEW)
2. `PI-DEV-BACKEND/PURCHASE_ORDER_UI_GUIDE.md` (NEW)
3. `PI-DEV-BACKEND/SERVICES_IN_PURCHASE_ORDERS_SUMMARY.md` (NEW)

## Migration Steps

### 1. Database Migration
```bash
psql -U your_user -d your_database -f migration-add-item-type-to-po-items.sql
```

### 2. Backend Deployment
```bash
cd PI-DEV-BACKEND
npm install
npm run build
```

### 3. Frontend Deployment
```bash
cd PI-DEV-FRONT
npm install
npm run build
```

## Testing Checklist

- [ ] Can select "Produit" type and see products
- [ ] Can select "Service" type and see services
- [ ] Quantity field visible for products
- [ ] Quantity field hidden for services (shows "-")
- [ ] Price auto-fills when item selected
- [ ] Can create PO with products only
- [ ] Can create PO with services only
- [ ] Can create PO with mixed products and services
- [ ] Totals calculate correctly
- [ ] Form validation works
- [ ] Can save and view created POs

## API Example

### Request
```json
POST /api/businesses/:businessId/supplier-pos
{
  "supplier_id": "uuid",
  "expected_delivery": "2026-05-01",
  "items": [
    {
      "item_type": "PRODUCT",
      "product_id": "product-uuid",
      "description": "Laptop",
      "quantity_ordered": 5,
      "unit_price_ht": 1200.000,
      "tax_rate_value": 19
    },
    {
      "item_type": "SERVICE",
      "product_id": "service-uuid",
      "description": "IT Consulting",
      "quantity_ordered": 1,
      "unit_price_ht": 150.000,
      "tax_rate_value": 19
    }
  ]
}
```

### Response
```json
{
  "id": "po-uuid",
  "po_number": "ACH-2026-00123",
  "status": "DRAFT",
  "items": [
    {
      "item_type": "PRODUCT",
      "description": "Laptop",
      "quantity_ordered": 5,
      "line_total_ht": 6000.000
    },
    {
      "item_type": "SERVICE",
      "description": "IT Consulting",
      "quantity_ordered": 1,
      "line_total_ht": 150.000
    }
  ],
  "subtotal_ht": 6150.000,
  "tax_amount": 1168.500,
  "net_amount": 7319.500
}
```

## Important Notes

### Why Quantity = 1 for Services?
- Services don't have quantities like physical products
- The price represents the full service cost
- Setting quantity to 1 keeps the calculation simple: Total = Price × 1
- If you need multiple service instances, create multiple lines

### Backward Compatibility
- Existing purchase orders will work without changes
- Old records will have `item_type = 'PRODUCT'` by default
- No data migration needed for existing records

### Future Enhancements
- Service scheduling integration
- Service delivery tracking
- Service-specific fields (duration, location, technician)
- Service templates and packages

## Support

For detailed documentation, see:
- `PURCHASE_ORDER_SERVICES_SUPPORT.md` - Complete technical documentation
- `PURCHASE_ORDER_UI_GUIDE.md` - UI/UX guide with examples

For questions or issues, contact the development team.
