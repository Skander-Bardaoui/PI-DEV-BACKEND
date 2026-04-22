# Purchase Orders - Products & Services Quick Reference

## 🎯 What Changed?

Purchase orders now support **both products and services** in line items.

## 📋 Quick Comparison

| Feature | Products | Services |
|---------|----------|----------|
| **Type Selection** | "Produit" | "Service" |
| **Quantity Field** | ✅ Visible (user enters) | ❌ Hidden (auto = 1) |
| **Stock Display** | ✅ Shows stock level | ❌ No stock |
| **Price Source** | `purchase_price_ht` or `sale_price_ht` | `sale_price_ht` |
| **Calculation** | Qty × Price | 1 × Price |

## 🔧 For Developers

### Frontend Files
```
NEW:     ItemSelectorPurchase.tsx
UPDATED: SupplierPOModal.tsx
UPDATED: purchases.schemas.ts
UPDATED: supplier-po.ts
```

### Backend Files
```
UPDATED: create-supplier-po-item.dto.ts
UPDATED: supplier-po-item.entity.ts
NEW:     migration-add-item-type-to-po-items.sql
```

### Key Code Snippets

#### Conditional Quantity Field
```tsx
{isService ? (
  <>
    <input type="hidden" value={1} />
    <div className="text-center">-</div>
  </>
) : (
  <input type="number" {...register(`items.${i}.quantity_ordered`)} />
)}
```

#### Item Type Validation
```typescript
@IsEnum(ItemType, { message: 'Type must be PRODUCT or SERVICE' })
item_type?: ItemType;
```

#### Database Column
```sql
ALTER TABLE supplier_po_items 
ADD COLUMN item_type VARCHAR(20) DEFAULT 'PRODUCT'
CHECK (item_type IN ('PRODUCT', 'SERVICE'));
```

## 👤 For Users

### Adding a Product
1. Type: Select **"Produit"**
2. Article: Choose product from list
3. Quantity: Enter amount (e.g., 5)
4. Price: Auto-filled (editable)
5. Total: Calculated (5 × price)

### Adding a Service
1. Type: Select **"Service"**
2. Article: Choose service from list
3. Quantity: Hidden (auto = 1)
4. Price: Auto-filled (editable)
5. Total: Same as price (1 × price)

## 🧪 Testing

### Quick Test Checklist
```
□ Select "Produit" → See products with stock
□ Select "Service" → See services without stock
□ Product line → Quantity field visible
□ Service line → Quantity field shows "-"
□ Create PO with products only
□ Create PO with services only
□ Create PO with both (mixed)
□ Verify totals calculate correctly
```

## 🚀 Deployment

### 1. Database
```bash
psql -U user -d database -f migration-add-item-type-to-po-items.sql
```

### 2. Backend
```bash
cd PI-DEV-BACKEND
npm install && npm run build
```

### 3. Frontend
```bash
cd PI-DEV-FRONT
npm install && npm run build
```

## 📊 API Quick Reference

### Request Body
```json
{
  "supplier_id": "uuid",
  "items": [
    {
      "item_type": "PRODUCT",
      "product_id": "uuid",
      "description": "Laptop",
      "quantity_ordered": 5,
      "unit_price_ht": 1200.000,
      "tax_rate_value": 19
    },
    {
      "item_type": "SERVICE",
      "product_id": "uuid",
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
  "id": "uuid",
  "po_number": "ACH-2026-00123",
  "items": [
    {
      "item_type": "PRODUCT",
      "quantity_ordered": 5,
      "line_total_ht": 6000.000
    },
    {
      "item_type": "SERVICE",
      "quantity_ordered": 1,
      "line_total_ht": 150.000
    }
  ],
  "subtotal_ht": 6150.000,
  "tax_amount": 1168.500,
  "net_amount": 7319.500
}
```

## ❓ FAQ

### Q: Why is quantity always 1 for services?
**A:** Services don't have quantities like physical products. The price represents the full service cost. If you need multiple instances, create multiple lines.

### Q: Can I change the quantity for services?
**A:** No, it's automatically set to 1 and hidden from the UI to keep the interface simple and prevent confusion.

### Q: What happens to existing purchase orders?
**A:** They continue to work normally. Old records automatically get `item_type = 'PRODUCT'` as the default value.

### Q: Can I mix products and services in one PO?
**A:** Yes! You can have any combination of products and services in a single purchase order.

### Q: How do I know if an item is a product or service?
**A:** Check the `item_type` field in the database or API response. In the UI, the Type dropdown shows the selection.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Type dropdown not showing | Clear browser cache |
| Services not in list | Check if services are marked as active |
| Quantity field still visible for services | Refresh the page |
| Validation error on item_type | Ensure value is 'PRODUCT' or 'SERVICE' |
| Migration fails | Check if column already exists |

## 📚 Documentation

- **Complete Guide**: `PURCHASE_ORDER_SERVICES_SUPPORT.md`
- **UI Guide**: `PURCHASE_ORDER_UI_GUIDE.md`
- **Flow Diagram**: `PURCHASE_ORDER_FLOW_DIAGRAM.md`
- **Summary**: `SERVICES_IN_PURCHASE_ORDERS_SUMMARY.md`

## 💡 Tips

- Always select the type before choosing the article
- For services, the price should include everything (no quantity multiplier)
- Use clear descriptions for services to avoid confusion
- Check stock levels for products before ordering
- Verify prices are correct before submitting

## 🎓 Training Resources

### For End Users
1. Watch the demo video (if available)
2. Read the UI Guide
3. Try creating a test PO with both types
4. Practice with sample data

### For Developers
1. Review the technical documentation
2. Study the code changes
3. Run the test suite
4. Deploy to staging first

## 📞 Support

For questions or issues:
- Technical: Contact development team
- Business: Contact product owner
- Urgent: Create a support ticket

---

**Last Updated**: April 2026
**Version**: 1.0
**Status**: ✅ Production Ready
