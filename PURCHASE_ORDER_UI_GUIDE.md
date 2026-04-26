# Purchase Order UI Guide - Products & Services Support

## Visual Overview

### Before (Products Only)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Nouveau Bon de Commande                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Lignes                                                              │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Produit * │ Qté * │ Prix HT * │ TVA │ Total HT │ Actions      ││
│ ├───────────┼───────┼───────────┼─────┼──────────┼──────────────┤│
│ │ [Select]  │ [___] │ [_______] │ [_] │ 0.000    │ [Delete]     ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### After (Products & Services)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Nouveau Bon de Commande                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Lignes                                                                      │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ Type *  │ Article *  │ Qté *   │ Prix HT * │ TVA │ Total HT │ ⚙      │  │
│ ├─────────┼────────────┼─────────┼───────────┼─────┼──────────┼────────┤  │
│ │ Produit │ [Select ▼] │ [_____] │ [_______] │ [_] │ 0.000    │ 🗑     │  │
│ │ Service │            │    -    │           │     │          │        │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Note: Quantity field is hidden for services (auto-set to 1)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## UI Components Breakdown

### 1. Type Dropdown (NEW)
```tsx
<select>
  <option value="PRODUCT">Produit</option>
  <option value="SERVICE">Service</option>
</select>
```

**Behavior**:
- Default: "Produit"
- When changed: Clears the Article selection
- Triggers: Article selector to reload with appropriate items

### 2. Article Selector (UPDATED)
```tsx
<ItemSelectorPurchase
  itemType={watchedItems[i]?.item_type || 'PRODUCT'}
  value={watchedItems[i]?.product_id}
  onChange={(item) => handleItemSelect(i, item)}
/>
```

**Behavior**:
- **When Type = Produit**: Shows products with stock info
  ```
  [Select a product ▼]
  - Laptop Dell XPS - 1200.000 DT (Stock: 5)
  - Mouse Logitech - 45.000 DT (Stock: 20)
  - Keyboard Mechanical - 150.000 DT (Stock: 10)
  ```

- **When Type = Service**: Shows services without stock
  ```
  [Select a service ▼]
  - IT Consulting - 150.000 DT
  - Network Setup - 300.000 DT
  - Software Installation - 100.000 DT
  ```

### 3. Quantity/Duration Field (UPDATED)
```tsx
{isService ? (
  <>
    <input type="hidden" value={1} />
    <div className="text-center text-sm text-gray-500">-</div>
  </>
) : (
  <input type="number" placeholder="Qté" />
)}
```

**Behavior**:
- **For Products**: Visible input field for quantity
  - Example: 10 units, 5 boxes, 100 pieces
- **For Services**: Hidden (displays "-")
  - Quantity automatically set to 1
  - Total = Price HT × 1

## User Workflows

### Workflow 1: Adding a Product Line
```
1. Click [+ Ajouter] button
2. Type dropdown: Select "Produit" (default)
3. Article selector: Choose "Laptop Dell XPS"
   → Price auto-fills: 1200.000 DT
4. Enter quantity: 5
5. Select TVA: 19%
6. Total HT calculated: 6000.000 DT
```

### Workflow 2: Adding a Service Line
```
1. Click [+ Ajouter] button
2. Type dropdown: Select "Service"
   → Article selector refreshes with services
   → Quantity field becomes hidden (shows "-")
3. Article selector: Choose "IT Consulting"
   → Price auto-fills: 150.000 DT
   → Quantity auto-set to 1 (hidden)
4. Select TVA: 19%
5. Total HT calculated: 150.000 DT
```

### Workflow 3: Mixed Purchase Order
```
Line 1: Product
  - Type: Produit
  - Article: Laptop Dell XPS
  - Quantity: 5
  - Price: 1200.000 DT
  - Total: 6000.000 DT

Line 2: Service
  - Type: Service
  - Article: IT Consulting
  - Quantity: 1 (hidden)
  - Price: 150.000 DT
  - Total: 150.000 DT

Line 3: Product
  - Type: Produit
  - Article: Mouse Logitech
  - Quantity: 10
  - Price: 45.000 DT
  - Total: 450.000 DT

────────────────────────────
Sous-total HT:  6600.000 TND
TVA (19%):      1254.000 TND
Timbre fiscal:     1.000 TND
────────────────────────────
Net TTC:        7855.000 TND
```

## Field Validation

### Type Field
- **Required**: Yes
- **Values**: 'PRODUCT' or 'SERVICE'
- **Default**: 'PRODUCT'
- **Error Messages**:
  - "Le type d'article est obligatoire"
  - "Type d'article invalide"

### Article Field
- **Required**: Yes
- **Validation**: Must select from dropdown
- **Error Messages**:
  - "La description est obligatoire"
  - "Veuillez sélectionner un article"

### Quantity/Duration Field
- **Required**: Yes
- **Type**: Number (decimal, 3 decimals)
- **Min**: 0.001
- **Max**: 999999.999
- **Error Messages**:
  - "La quantité est obligatoire"
  - "La quantité doit être supérieure à 0"
  - "Précision maximale : 3 décimales"

### Price Field
- **Required**: Yes
- **Type**: Number (decimal, 3 decimals)
- **Min**: 0
- **Max**: 9999999.999
- **Auto-fill**: Yes (from selected item)
- **Editable**: Yes
- **Error Messages**:
  - "Le prix unitaire est obligatoire"
  - "Le prix unitaire doit être supérieur à 0"
  - "Le prix unitaire ne peut pas dépasser 9999999.999 TND"

## Responsive Design

### Desktop View (> 1024px)
```
┌────────────────────────────────────────────────────────────────────┐
│ Type    │ Article              │ Qté   │ Prix HT  │ TVA │ ...     │
├─────────┼──────────────────────┼───────┼──────────┼─────┼─────────┤
│ Produit │ Laptop Dell XPS      │   5   │ 1200.000 │ 19% │ ...     │
│ Service │ IT Consulting        │   -   │  150.000 │ 19% │ ...     │
└────────────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1024px)
```
┌──────────────────────────────────────────────────────────┐
│ Type    │ Article              │ Qté  │ Prix    │ ...   │
├─────────┼──────────────────────┼──────┼─────────┼───────┤
│ Produit │ Laptop Dell XPS      │  5   │ 1200.00 │ ...   │
│ Service │ IT Consulting        │  2   │  150.00 │ ...   │
└──────────────────────────────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌────────────────────────────┐
│ Ligne 1                    │
│ Type: Produit              │
│ Article: Laptop Dell XPS   │
│ Quantité: 5                │
│ Prix HT: 1200.000 DT       │
│ TVA: 19%                   │
│ Total: 6000.000 DT         │
│ [Supprimer]                │
├────────────────────────────┤
│ Ligne 2                    │
│ Type: Service              │
│ Article: IT Consulting     │
│ Quantité: 1 (auto)         │
│ Prix HT: 150.000 DT        │
│ TVA: 19%                   │
│ Total: 150.000 DT          │
│ [Supprimer]                │
└────────────────────────────┘
```

## Accessibility Features

### Keyboard Navigation
- **Tab**: Move between fields
- **Shift+Tab**: Move backwards
- **Enter**: Submit form
- **Escape**: Close modal
- **Arrow Keys**: Navigate dropdowns

### Screen Reader Support
```html
<select aria-label="Type d'article">
  <option>Produit</option>
  <option>Service</option>
</select>

<select aria-label="Sélectionner un article">
  <option>Laptop Dell XPS - 1200.000 DT</option>
</select>

<input 
  type="number" 
  aria-label="Quantité ou durée"
  aria-describedby="qty-help"
/>
```

### Color Contrast
- **Type Dropdown**: High contrast border
- **Error States**: Red border + red text (WCAG AA compliant)
- **Focus States**: Blue outline (2px solid)
- **Disabled States**: Gray background + reduced opacity

## Error Handling

### Validation Errors
```tsx
// Example error display
{errors.items?.[i]?.item_type && (
  <p className="text-red-500 text-xs mt-0.5">
    {errors.items[i]?.item_type?.message}
  </p>
)}
```

### Network Errors
```tsx
// Loading state
<select disabled={loading}>
  <option>Chargement...</option>
</select>

// Error state
<div className="text-red-600 text-sm">
  Erreur lors du chargement des articles
</div>
```

## Performance Considerations

### Lazy Loading
- Items are loaded only when dropdown is opened
- Cached after first load
- Refreshed when item type changes

### Debouncing
- Search/filter inputs debounced (300ms)
- Prevents excessive API calls

### Memoization
- Item lists memoized to prevent re-renders
- Calculations cached until values change

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| IE 11   | -       | ❌ Not supported |

## Testing Scenarios

### Manual Testing Checklist
- [ ] Type dropdown displays correctly
- [ ] Switching type updates article selector
- [ ] Product list shows stock information
- [ ] Service list shows without stock info
- [ ] Price auto-fills on selection
- [ ] Quantity/Duration placeholder changes
- [ ] Validation errors display correctly
- [ ] Can add multiple lines
- [ ] Can delete lines (except last one)
- [ ] Totals calculate correctly
- [ ] Form submits successfully
- [ ] Mixed products/services work together

### Automated Testing
```typescript
describe('ItemSelectorPurchase', () => {
  it('should load products when type is PRODUCT', async () => {
    // Test implementation
  });

  it('should load services when type is SERVICE', async () => {
    // Test implementation
  });

  it('should auto-fill price on selection', async () => {
    // Test implementation
  });
});
```

## Tips & Best Practices

### For Users
1. **Select Type First**: Always choose the type before selecting the article
2. **Verify Prices**: Auto-filled prices can be edited if needed
3. **Use Descriptions**: Add notes in the description field for clarity
4. **Check Stock**: For products, verify stock availability before ordering
5. **Service Quantity**: Services always have quantity = 1 (price represents the full service cost)

### For Developers
1. **Type Safety**: Always use TypeScript types for item_type
2. **Validation**: Validate item_type on both frontend and backend
3. **Default Values**: Always provide default value 'PRODUCT'
4. **Error Handling**: Handle API errors gracefully
5. **Testing**: Test both product and service flows thoroughly

## Future UI Enhancements

### Planned Features
1. **Service Duration Picker**: Visual duration selector
2. **Service Calendar**: Link to scheduling system
3. **Bulk Add**: Add multiple items at once
4. **Templates**: Save common product/service combinations
5. **Quick Search**: Search articles by name or SKU
6. **Favorites**: Mark frequently ordered items
7. **Recent Items**: Show recently ordered products/services
8. **Price History**: Display price trends

### Mockups
```
┌─────────────────────────────────────────────────────────┐
│ Quick Add Templates                                     │
├─────────────────────────────────────────────────────────┤
│ [Office Setup Package]  [IT Support Bundle]            │
│ [Monthly Maintenance]   [Custom...]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Recent Items                                            │
├─────────────────────────────────────────────────────────┤
│ ⭐ Laptop Dell XPS (Last ordered: 2 days ago)          │
│ ⭐ IT Consulting (Last ordered: 1 week ago)            │
└─────────────────────────────────────────────────────────┘
```
