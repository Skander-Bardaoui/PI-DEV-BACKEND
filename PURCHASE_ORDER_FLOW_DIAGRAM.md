# Purchase Order Flow - Products & Services

## User Interface Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nouveau Bon de Commande                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  User clicks [+ Ajouter] to add a new line                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Select Type                                            │
│  ┌──────────────┐                                               │
│  │ Type: [▼]    │  Options: Produit / Service                   │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐   ┌───────────────────┐
        │   Type = PRODUCT  │   │   Type = SERVICE  │
        └───────────────────┘   └───────────────────┘
                    │                   │
                    ▼                   ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Step 2a: Select Product     │ │ Step 2b: Select Service     │
│ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │
│ │ Article: [▼]            │ │ │ │ Article: [▼]            │ │
│ │ - Laptop (Stock: 5)     │ │ │ │ - IT Consulting         │ │
│ │ - Mouse (Stock: 20)     │ │ │ │ - Network Setup         │ │
│ │ - Keyboard (Stock: 10)  │ │ │ │ - Software Install      │ │
│ └─────────────────────────┘ │ │ └─────────────────────────┘ │
└─────────────────────────────┘ └─────────────────────────────┘
                    │                   │
                    ▼                   ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Step 3a: Enter Quantity     │ │ Step 3b: Quantity Hidden    │
│ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │
│ │ Qté: [_____]            │ │ │ │ Qté: -                  │ │
│ │ User enters: 5          │ │ │ │ Auto-set to: 1 (hidden) │ │
│ └─────────────────────────┘ │ │ └─────────────────────────┘ │
└─────────────────────────────┘ └─────────────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Price Auto-fills (editable)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Prix HT: [1200.000] DT                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: Select Tax Rate                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TVA: [19%] ▼  (Options: 0%, 7%, 13%, 19%)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: Total Calculated Automatically                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Total HT: 6000.000 DT  (for product: 5 × 1200)          │  │
│  │ Total HT:  150.000 DT  (for service: 1 × 150)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User submits form
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SupplierPOModal.tsx                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Form Data:                                                │ │
│  │ {                                                         │ │
│  │   supplier_id: "uuid",                                    │ │
│  │   items: [                                                │ │
│  │     {                                                     │ │
│  │       item_type: "PRODUCT",                               │ │
│  │       product_id: "uuid",                                 │ │
│  │       description: "Laptop",                              │ │
│  │       quantity_ordered: 5,                                │ │
│  │       unit_price_ht: 1200.000,                            │ │
│  │       tax_rate_value: 19                                  │ │
│  │     },                                                    │ │
│  │     {                                                     │ │
│  │       item_type: "SERVICE",                               │ │
│  │       product_id: "uuid",                                 │ │
│  │       description: "IT Consulting",                       │ │
│  │       quantity_ordered: 1,  ← Auto-set                    │ │
│  │       unit_price_ht: 150.000,                             │ │
│  │       tax_rate_value: 19                                  │ │
│  │     }                                                     │ │
│  │   ]                                                       │ │
│  │ }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/businesses/:id/supplier-pos
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend API                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Validate DTO
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CreateSupplierPOItemDto                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Validation:                                               │ │
│  │ - item_type: enum('PRODUCT', 'SERVICE') ✓                 │ │
│  │ - product_id: UUID (optional) ✓                           │ │
│  │ - description: string (required) ✓                        │ │
│  │ - quantity_ordered: number > 0 ✓                          │ │
│  │ - unit_price_ht: number >= 0 ✓                            │ │
│  │ - tax_rate_value: number (0-100) ✓                        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Calculate totals
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SupplierPOsService.calcTotals()                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ For each item:                                            │ │
│  │   line_total_ht = quantity × unit_price_ht                │ │
│  │   line_tax = line_total_ht × (tax_rate / 100)            │ │
│  │                                                           │ │
│  │ Product: 5 × 1200.000 = 6000.000                          │ │
│  │ Service: 1 × 150.000 = 150.000                            │ │
│  │                                                           │ │
│  │ subtotal_ht = 6150.000                                    │ │
│  │ tax_amount = 1168.500                                     │ │
│  │ net_amount = 7319.500                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Save to database
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Database                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Table: supplier_po_items                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ id              | uuid                                    │ │
│  │ supplier_po_id  | uuid                                    │ │
│  │ item_type       | 'PRODUCT' or 'SERVICE' ← NEW            │ │
│  │ product_id      | uuid (nullable)                         │ │
│  │ description     | varchar(500)                            │ │
│  │ quantity_ordered| decimal(15,3)                           │ │
│  │ unit_price_ht   | decimal(15,3)                           │ │
│  │ tax_rate_value  | decimal(5,2)                            │ │
│  │ line_total_ht   | decimal(15,3)                           │ │
│  │ line_tax        | decimal(15,3)                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│  SupplierPOModal (Parent Component)                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ State:                                                    │ │
│  │ - watchedItems: array of line items                      │ │
│  │ - errors: validation errors                              │ │
│  │                                                           │ │
│  │ Functions:                                                │ │
│  │ - handleItemSelect(index, item)                           │ │
│  │ - onSubmit(values)                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ For each line item:                                       │ │
│  │                                                           │ │
│  │   ┌─────────────────────────────────────────────────┐   │ │
│  │   │ Type Selector (dropdown)                        │   │ │
│  │   │ - onChange: reset item, update quantity         │   │ │
│  │   └─────────────────────────────────────────────────┘   │ │
│  │                    │                                      │ │
│  │                    ▼                                      │ │
│  │   ┌─────────────────────────────────────────────────┐   │ │
│  │   │ ItemSelectorPurchase (Child Component)          │   │ │
│  │   │ Props:                                          │   │ │
│  │   │ - itemType: 'PRODUCT' or 'SERVICE'              │   │ │
│  │   │ - value: selected item ID                       │   │ │
│  │   │ - onChange: callback function                   │   │ │
│  │   │                                                 │   │ │
│  │   │ Behavior:                                       │   │ │
│  │   │ - Fetches products or services based on type    │   │ │
│  │   │ - Returns SelectedItem object                   │   │ │
│  │   └─────────────────────────────────────────────────┘   │ │
│  │                    │                                      │ │
│  │                    ▼                                      │ │
│  │   ┌─────────────────────────────────────────────────┐   │ │
│  │   │ Quantity Field (conditional)                    │   │ │
│  │   │ if (isService):                                 │   │ │
│  │   │   - Hidden input with value=1                   │   │ │
│  │   │   - Display "-"                                 │   │ │
│  │   │ else:                                           │   │ │
│  │   │   - Visible number input                        │   │ │
│  │   └─────────────────────────────────────────────────┘   │ │
│  │                    │                                      │ │
│  │                    ▼                                      │ │
│  │   ┌─────────────────────────────────────────────────┐   │ │
│  │   │ Price, Tax, Total fields                        │   │ │
│  │   └─────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│  React Hook Form State                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  items: [                                                       │
│    {                                                            │
│      item_type: 'PRODUCT',        ← Controlled by dropdown     │
│      product_id: 'uuid',          ← Set by ItemSelector        │
│      description: 'Laptop',       ← Set by ItemSelector        │
│      quantity_ordered: 5,         ← User input (products)      │
│                                      or auto-set to 1 (services)│
│      unit_price_ht: 1200.000,     ← Set by ItemSelector        │
│      tax_rate_value: 19           ← User selection             │
│    }                                                            │
│  ]                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ watch() hook
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  watchedItems (reactive)                                        │
│  - Used to determine if quantity field should be visible       │
│  - Used to calculate totals in real-time                       │
│  - Used to pass itemType to ItemSelectorPurchase               │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User submits form                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Zod Schema Validation (Frontend)                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ poItemSchema:                                             │ │
│  │ - item_type: enum(['PRODUCT', 'SERVICE'])                 │ │
│  │ - product_id: uuid().optional()                           │ │
│  │ - description: string().min(1).max(500)                   │ │
│  │ - quantity_ordered: number().positive()                   │ │
│  │ - unit_price_ht: number().positive()                      │ │
│  │ - tax_rate_value: number().refine([0,7,13,19])           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ If valid
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Class Validator (Backend)                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CreateSupplierPOItemDto:                                  │ │
│  │ - @IsEnum(ItemType)                                       │ │
│  │ - @IsUUID() @IsOptional()                                 │ │
│  │ - @IsString() @IsNotEmpty() @MaxLength(500)              │ │
│  │ - @IsNumber() @IsPositive() @Max(999999.999)             │ │
│  │ - @IsNumber() @Min(0) @Max(9999999.999)                  │ │
│  │ - @IsNumber() @Min(0) @Max(100)                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ If valid
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database Constraints                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ - CHECK (item_type IN ('PRODUCT', 'SERVICE'))             │ │
│  │ - NOT NULL constraints                                    │ │
│  │ - Foreign key constraints                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│  Error Scenarios                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Validation   │    │ Network      │    │ Business     │
│ Error        │    │ Error        │    │ Logic Error  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Show inline  │    │ Show toast   │    │ Show modal   │
│ error below  │    │ notification │    │ with details │
│ field        │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Summary

This flow diagram shows:
1. **User interaction**: How users select type, item, and enter data
2. **Data flow**: From frontend form to backend database
3. **Component structure**: How components interact
4. **State management**: How React Hook Form manages state
5. **Validation**: Multi-layer validation (frontend, backend, database)
6. **Error handling**: Different error scenarios and responses

The key innovation is the **conditional quantity field** that:
- Shows for products (user enters value)
- Hides for services (auto-set to 1)
- Keeps the calculation logic simple and consistent
