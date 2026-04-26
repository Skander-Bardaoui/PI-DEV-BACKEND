# Warehouse Location System - Visual Guide

## 🎨 User Interface Walkthrough

### 1. Warehouses List Page

```
┌────────────────────────────────────────────────────────────────────┐
│  Warehouses                                    [+ New Warehouse]   │
│  Manage your storage locations                                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │ 🏢 Entrepôt      │  │ 🏢 Entrepôt      │  │ 🏢 Entrepôt      ││
│  │    Principal     │  │    Secondaire    │  │    Nord          ││
│  │                  │  │                  │  │                  ││
│  │ WH01             │  │ WH02             │  │ WH03             ││
│  │ [Active]         │  │ [Active]         │  │ [Inactive]       ││
│  │                  │  │                  │  │                  ││
│  │ 📍 Tunis         │  │ 📍 Sfax          │  │ 📍 Bizerte       ││
│  │                  │  │                  │  │                  ││
│  │ [📦 View Stock]  │  │ [📦 View Stock]  │  │ [📦 View Stock]  ││
│  │ [✏️ Edit] [🗑️]   │  │ [✏️ Edit] [🗑️]   │  │ [✏️ Edit] [🗑️]   ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2. Create Warehouse Modal - Basic Info

```
┌────────────────────────────────────────────────────────────────────┐
│  Nouvel entrepôt                                              [✕]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Nom de l'entrepôt *                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Entrepôt Principal                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Code *                                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ WH01                                                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Description                                                       │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Entrepôt principal situé au centre-ville                    │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ─────────────────── Localisation ────────────────────            │
│                                                                    │
│  [Scroll down to see location picker...]                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 3. Location Picker - Address Input

```
┌────────────────────────────────────────────────────────────────────┐
│  ─────────────────── Localisation ────────────────────            │
│                                                                    │
│  Adresse complète *                                                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 123 Avenue Habib Bourguiba, Tunis 1000                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  💡 Saisissez l'adresse complète ou utilisez la carte ci-dessous  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 4. Location Search Bar

```
┌────────────────────────────────────────────────────────────────────┐
│  Recherche de localisation                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Rechercher une ville, adresse...                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ↓ When typing "Tunis"...                                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📍 Tunis, Tunisia                                            │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ 📍 Tunis Governorate, Tunisia                                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ 📍 Avenue Habib Bourguiba, Tunis, Tunisia                    │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ 📍 Tunis-Carthage International Airport, Tunisia             │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ 📍 Medina of Tunis, Tunisia                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ↓ Click any result to select                                      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 5. Interactive Map

```
┌────────────────────────────────────────────────────────────────────┐
│  Carte interactive                                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  ╔════════════════════════════════════════════════════╗     │ │
│  │  ║                                                    ║     │ │
│  │  ║         🗺️  OpenStreetMap                          ║     │ │
│  │  ║                                                    ║     │ │
│  │  ║              ┌─────────────┐                       ║     │ │
│  │  ║              │   Tunis     │                       ║     │ │
│  │  ║              │             │                       ║     │ │
│  │  ║              │      📍     │  ← Draggable Marker   ║     │ │
│  │  ║              │             │                       ║     │ │
│  │  ║              └─────────────┘                       ║     │ │
│  │  ║                                                    ║     │ │
│  │  ║  [+] [-]  Zoom controls                           ║     │ │
│  │  ║                                                    ║     │ │
│  │  ╚════════════════════════════════════════════════════╝     │ │
│  │                                                              │ │
│  │  © OpenStreetMap contributors                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│  💡 Cliquez sur la carte pour placer un marqueur ou faites        │
│     glisser le marqueur existant                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6. Coordinates Display

```
┌────────────────────────────────────────────────────────────────────┐
│  Latitude                          Longitude                       │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐│
│  │ 36.8065                      │ │ 10.1815                      ││
│  └──────────────────────────────┘ └──────────────────────────────┘│
│                                                                    │
│  ✅ Coordinates auto-filled when:                                  │
│     • Selecting search result                                      │
│     • Clicking on map                                              │
│     • Dragging marker                                              │
│                                                                    │
│  ✏️ Can also be edited manually                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 7. Form Actions

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ☑️ Actif                                                           │
│                                                                    │
│  ─────────────────────────────────────────────────────────────    │
│                                                                    │
│                                          [Annuler]  [Créer]        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## 🎬 User Interaction Flows

### Flow 1: Search and Select

```
User Action                    System Response
───────────────────────────────────────────────────────────────────

1. Type "Tunis" in search     → Debounce 500ms
                              → Call Nominatim API
                              → Show loading spinner

2. Results appear             → Display 5 results
                              → Show dropdown

3. Click "Tunis, Tunisia"     → Close dropdown
                              → Move map to location
                              → Place marker
                              → Fill address field
                              → Fill coordinates
                              → Zoom to level 15
```

### Flow 2: Click on Map

```
User Action                    System Response
───────────────────────────────────────────────────────────────────

1. Click on map               → Place marker at clicked point
                              → Get coordinates (lat, lng)
                              → Call reverse geocoding API

2. API responds               → Fill address field
                              → Fill coordinate fields
                              → Show marker at position
```

### Flow 3: Drag Marker

```
User Action                    System Response
───────────────────────────────────────────────────────────────────

1. Grab marker                → Marker follows cursor
                              → Map stays centered

2. Release marker             → Get new coordinates
                              → Call reverse geocoding API
                              → Update address field
                              → Update coordinate fields
```

### Flow 4: Manual Coordinate Entry

```
User Action                    System Response
───────────────────────────────────────────────────────────────────

1. Type latitude: 36.8100     → Update internal state
                              → Move map to new position
                              → Move marker to new position

2. Type longitude: 10.1900    → Update internal state
                              → Move map to new position
                              → Move marker to new position

3. (Optional) Blur field      → Could trigger reverse geocoding
                              → Update address field
```

## 🎨 Visual States

### Loading State

```
┌────────────────────────────────────────────────────────────────────┐
│  Recherche de localisation                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ ⏳ Tunis                                                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Searching...                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### Empty State (No Results)

```
┌────────────────────────────────────────────────────────────────────┐
│  Recherche de localisation                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🔍 xyz123                                                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  No results found. Try a different search term.                    │
└────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠️ Unable to load map                                             │
│                                                                    │
│  Please check your internet connection and try again.              │
│                                                                    │
│  [Retry]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

### Success State (After Save)

```
┌────────────────────────────────────────────────────────────────────┐
│  ✅ Warehouse created successfully!                                │
│                                                                    │
│  Entrepôt Principal (WH01)                                         │
│  📍 123 Avenue Habib Bourguiba, Tunis 1000                         │
│  🌍 36.8065, 10.1815                                               │
└────────────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Design

### Desktop (> 1024px)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Nouvel entrepôt                                               [✕]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Name Field]                    [Code Field]                       │
│                                                                     │
│  [Description Field - Full Width]                                   │
│                                                                     │
│  [Address Field - Full Width]                                       │
│                                                                     │
│  [Search Bar - Full Width]                                          │
│                                                                     │
│  [Map - Full Width, 400px height]                                   │
│                                                                     │
│  [Latitude Field]                [Longitude Field]                  │
│                                                                     │
│                                          [Cancel]  [Create]         │
└─────────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌──────────────────────────────────────────────────────────┐
│  Nouvel entrepôt                                    [✕]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Name Field - Full Width]                               │
│  [Code Field - Full Width]                               │
│  [Description Field - Full Width]                        │
│  [Address Field - Full Width]                            │
│  [Search Bar - Full Width]                               │
│  [Map - Full Width, 350px height]                        │
│  [Latitude Field]    [Longitude Field]                   │
│                                                          │
│                              [Cancel]  [Create]          │
└──────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌────────────────────────────────────┐
│  Nouvel entrepôt              [✕]  │
├────────────────────────────────────┤
│                                    │
│  [Name - Full Width]               │
│  [Code - Full Width]               │
│  [Description - Full Width]        │
│  [Address - Full Width]            │
│  [Search - Full Width]             │
│  [Map - Full Width, 300px]         │
│  [Latitude - Full Width]           │
│  [Longitude - Full Width]          │
│                                    │
│  [Cancel - Full Width]             │
│  [Create - Full Width]             │
└────────────────────────────────────┘
```

## 🎯 Key Features Visualization

### Feature 1: Search Autocomplete

```
Type: "Tun"
     ↓
┌─────────────────────────────┐
│ 🔍 Tun                      │
└─────────────────────────────┘
     ↓ (500ms debounce)
     ↓
┌─────────────────────────────┐
│ 📍 Tunis, Tunisia           │ ← Click
│ 📍 Tunisia                  │
│ 📍 Tunis Governorate        │
└─────────────────────────────┘
     ↓
Map moves to Tunis
Marker placed
Address filled
Coordinates filled
```

### Feature 2: Draggable Marker

```
Initial Position          Dragging              Final Position
     📍                      📍                      📍
     │                       │                       │
     │                       │ ─────→                │
     │                       │                       │
   Tunis                  Moving                  Sfax
(36.8065, 10.1815)                          (34.7406, 10.7603)
                                                     ↓
                                            Reverse geocoding
                                            Address updated
                                            Coordinates updated
```

### Feature 3: Reverse Geocoding

```
Click on Map
     ↓
Get Coordinates
(36.8065, 10.1815)
     ↓
Call Nominatim API
     ↓
Receive Address
"Avenue Habib Bourguiba, Tunis"
     ↓
Fill Address Field
Fill Coordinate Fields
```

## 🎨 Color Scheme

```
Primary Blue:    #3B82F6  (Buttons, links)
Success Green:   #10B981  (Active badges)
Warning Orange:  #F59E0B  (Alerts)
Error Red:       #EF4444  (Errors)
Gray Scale:      #F9FAFB → #111827 (Backgrounds, text)
Map Marker:      #DC2626  (Red marker icon)
```

## 📐 Spacing & Layout

```
Modal Width:     max-w-4xl (896px)
Modal Height:    max-h-[90vh]
Map Height:      400px (desktop), 350px (tablet), 300px (mobile)
Input Height:    py-2 (32px)
Button Height:   py-2 (32px)
Spacing:         gap-4 (16px) between sections
Border Radius:   rounded-lg (8px)
```

## 🎭 Animations

```
Search Dropdown:  Fade in (150ms)
Map Marker:       Bounce on place
Loading Spinner:  Rotate 360° (1s infinite)
Hover Effects:    Scale 1.02, transition 200ms
Modal:            Fade in background, slide in content
```

## 💡 UX Tips

### Visual Feedback
```
✅ Hover: Button background changes
✅ Focus: Blue ring appears
✅ Loading: Spinner shows
✅ Success: Green checkmark
✅ Error: Red border + message
```

### Accessibility
```
✅ Keyboard navigation
✅ Screen reader labels
✅ High contrast colors
✅ Focus indicators
✅ Error announcements
```

### Performance
```
✅ Debounced search (500ms)
✅ Lazy load map tiles
✅ Memoized components
✅ Optimized re-renders
```

---

**This visual guide helps users and developers understand the complete UI/UX flow!** 🎨
