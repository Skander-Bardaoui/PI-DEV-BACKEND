# Warehouse Location System - Quick Start Guide

## 🚀 What's New?

Professional warehouse location management with:
- ✅ Interactive map (Leaflet + OpenStreetMap)
- ✅ Location search (Nominatim - FREE)
- ✅ GPS coordinates storage
- ✅ Draggable markers
- ✅ Reverse geocoding
- ✅ 100% FREE - No paid APIs

## 📦 Installation

Already done! Dependencies installed:
```bash
✅ leaflet
✅ react-leaflet@4.2.1
✅ @types/leaflet
```

## 🗄️ Database Migration

Run this command:
```bash
psql -U your_user -d your_database -f migration-add-warehouse-coordinates.sql
```

This adds:
- `latitude` column (DECIMAL 10,7)
- `longitude` column (DECIMAL 10,7)

## 📁 Files Modified/Created

### Frontend
```
✅ NEW:     src/components/common/LocationPicker.tsx
✅ UPDATED: src/pages/backoffice/Warehouses.tsx
✅ UPDATED: src/types/warehouse.ts
✅ UPDATED: src/index.css (Leaflet CSS import)
```

### Backend
```
✅ UPDATED: src/stock/entities/warehouse.entity.ts
✅ UPDATED: src/stock/dto/create-warehouse.dto.ts
✅ NEW:     migration-add-warehouse-coordinates.sql
```

## 🎯 How to Use

### For End Users

#### Creating a Warehouse

1. **Click "New Warehouse"** button

2. **Fill Basic Info**:
   - Name: "Entrepôt Principal"
   - Code: "WH01"
   - Description: (optional)

3. **Set Location** - Choose ONE method:

   **Option A: Type Address**
   ```
   Adresse complète: 123 Avenue Habib Bourguiba, Tunis 1000
   ```

   **Option B: Search Location**
   ```
   1. Type in "Recherche de localisation": "Tunis"
   2. Select from dropdown
   3. Map moves automatically
   4. Marker placed
   ```

   **Option C: Click on Map**
   ```
   1. Click anywhere on the map
   2. Marker appears
   3. Address auto-filled
   4. Coordinates saved
   ```

4. **Fine-tune** (optional):
   - Drag marker to exact position
   - Or edit latitude/longitude manually

5. **Click "Créer"** to save

## 🎨 UI Preview

```
┌─────────────────────────────────────────────────────────────┐
│ Nouvel entrepôt                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nom de l'entrepôt *                                         │
│ [Entrepôt Principal_____________________________]           │
│                                                             │
│ Code *                                                      │
│ [WH01___________]                                           │
│                                                             │
│ ─────────────── Localisation ───────────────                │
│                                                             │
│ Adresse complète *                                          │
│ [123 Avenue Habib Bourguiba, Tunis 1000________]           │
│                                                             │
│ Recherche de localisation                                   │
│ [🔍 Rechercher une ville, adresse...___________]           │
│   ↓ Dropdown with results                                  │
│                                                             │
│ Carte interactive                                           │
│ ┌─────────────────────────────────────────────────────┐   │
│ │                                                     │   │
│ │              🗺️  OpenStreetMap                      │   │
│ │                                                     │   │
│ │                    📍 Marker                        │   │
│ │                                                     │   │
│ └─────────────────────────────────────────────────────┘   │
│ 💡 Cliquez sur la carte pour placer un marqueur            │
│                                                             │
│ Latitude              Longitude                             │
│ [36.8065_____]       [10.1815_____]                        │
│                                                             │
│                              [Annuler] [Créer]              │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 For Developers

### Using LocationPicker Component

```tsx
import LocationPicker from '@/components/common/LocationPicker';

function MyForm() {
  const [location, setLocation] = useState({
    address: '',
    latitude: 36.8065,
    longitude: 10.1815,
  });

  return (
    <LocationPicker
      value={location}
      onChange={setLocation}
      disabled={false}
    />
  );
}
```

### API Endpoints

**Create Warehouse**:
```typescript
POST /api/businesses/:businessId/warehouses
{
  "name": "Entrepôt Principal",
  "code": "WH01",
  "address": "123 Avenue Habib Bourguiba, Tunis",
  "latitude": 36.8065,
  "longitude": 10.1815,
  "is_active": true
}
```

**Update Warehouse**:
```typescript
PUT /api/businesses/:businessId/warehouses/:id
{
  "address": "New address",
  "latitude": 36.8100,
  "longitude": 10.1900
}
```

## 🌍 APIs Used (All FREE)

### OpenStreetMap Tiles
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```
- **Cost**: FREE
- **Limit**: Unlimited
- **Attribution**: Required

### Nominatim Search
```
https://nominatim.openstreetmap.org/search
  ?format=json
  &q=Tunis
  &limit=5
```
- **Cost**: FREE
- **Limit**: 1 request/second
- **Debounced**: 500ms (implemented)

### Nominatim Reverse Geocoding
```
https://nominatim.openstreetmap.org/reverse
  ?format=json
  &lat=36.8065
  &lon=10.1815
```
- **Cost**: FREE
- **Limit**: 1 request/second

## ✅ Testing Checklist

Quick tests to verify everything works:

```
□ Open Warehouses page
□ Click "New Warehouse"
□ See map displayed
□ Type in search bar
□ See search results
□ Click a result
□ Map moves to location
□ Click on map
□ Marker appears
□ Drag marker
□ Position updates
□ Fill form and save
□ Verify coordinates saved in DB
□ Edit warehouse
□ See existing location on map
```

## 🐛 Common Issues

### Map not showing?
```bash
# Check Leaflet CSS is imported
# File: src/index.css
@import 'leaflet/dist/leaflet.css';
```

### Marker icon missing?
Already fixed in LocationPicker.tsx - icon URLs configured.

### Search not working?
Check browser console for network errors. Nominatim should work without CORS issues.

### Coordinates not saving?
Verify backend migration ran successfully:
```sql
SELECT latitude, longitude FROM warehouses LIMIT 1;
```

## 📊 Database Schema

```sql
warehouses
├── id (UUID)
├── business_id (UUID)
├── name (VARCHAR)
├── code (VARCHAR)
├── description (TEXT)
├── address (TEXT)
├── latitude (DECIMAL 10,7)  ← NEW
├── longitude (DECIMAL 10,7) ← NEW
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## 🎓 Tips & Tricks

### For Users
1. **Use Search**: Faster than typing full address
2. **Drag Marker**: More precise than clicking
3. **Zoom In**: Use mouse wheel for better accuracy
4. **Save Coordinates**: They're useful for future features

### For Developers
1. **Debouncing**: Already implemented (500ms)
2. **Caching**: Consider caching frequent searches
3. **Error Handling**: Graceful degradation if API fails
4. **Rate Limiting**: Respect Nominatim's 1 req/sec limit

## 📚 Documentation

- **Full Guide**: `WAREHOUSE_LOCATION_SYSTEM.md`
- **Component**: `src/components/common/LocationPicker.tsx`
- **Migration**: `migration-add-warehouse-coordinates.sql`

## 🎉 Benefits

### vs Google Maps
- ✅ **FREE** (Google charges $7/1000 requests)
- ✅ No API key needed
- ✅ No billing setup
- ✅ No usage limits (within fair use)

### vs Manual Entry
- ✅ More accurate
- ✅ Faster (search + click)
- ✅ Visual confirmation
- ✅ GPS coordinates for future features

## 🚀 Next Steps

1. **Run migration** (if not done)
2. **Test the feature** (create a warehouse)
3. **Train users** (show them the 3 methods)
4. **Monitor usage** (check Nominatim rate limits)

## 💡 Future Ideas

- Show all warehouses on one map
- Calculate distances between warehouses
- Delivery radius visualization
- Route planning
- Geofencing

---

**Ready to use!** 🎊

For questions, check `WAREHOUSE_LOCATION_SYSTEM.md` or contact the dev team.
