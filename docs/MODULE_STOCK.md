# Module Stock - Documentation Complète

## Vue d'ensemble

Le module Stock est un système complet de gestion d'inventaire et de suivi des mouvements de stock pour l'application SaaS. Il gère les produits, les catégories de produits, et tous les mouvements de stock (entrées, sorties, ajustements) avec une traçabilité complète.

## Architecture du Module

### Structure des Dossiers

```
src/stock/
├── controllers/           # Contrôleurs REST API
│   ├── products.controller.ts
│   ├── product-categories.controller.ts
│   └── stock-movements.controller.ts
├── services/             # Logique métier
│   ├── products.service.ts
│   ├── product-categories.service.ts
│   └── stock-movements/
│       └── stock-movements.service.ts
├── entities/             # Entités TypeORM (modèles de données)
│   ├── product.entity.ts
│   ├── product-category.entity.ts
│   └── stock-movement.entity.ts
├── dto/                  # Data Transfer Objects (validation)
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── create-product-category.dto.ts
│   ├── update-product-category.dto.ts
│   └── create-stock-movement.dto.ts
├── enums/               # Énumérations
│   └── stock-movement-type.enum.ts
└── stock.module.ts      # Module principal
```

---

## 1. Entités (Modèles de Données)

### 1.1 Product (Produit)

**Table:** `products`

Représente un produit dans le système avec toutes ses caractéristiques commerciales et de gestion de stock.

#### Champs Principaux

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `business_id` | UUID | Référence vers l'entreprise propriétaire |
| `name` | VARCHAR(255) | Nom du produit |
| `sku` | VARCHAR(100) | Référence unique du produit (Stock Keeping Unit) |
| `description` | TEXT | Description détaillée (optionnel) |
| `price` | DECIMAL(12,3) | Prix de vente HT |
| `cost` | DECIMAL(12,3) | Prix d'achat/coût HT (optionnel) |
| `quantity` | DECIMAL(15,3) | Quantité en stock actuelle |
| `min_quantity` | DECIMAL(15,3) | Seuil d'alerte de stock minimum |
| `category_id` | UUID | Référence vers la catégorie (optionnel) |
| `default_supplier_id` | UUID | Fournisseur par défaut (optionnel) |
| `unit` | VARCHAR(20) | Unité de mesure (défaut: 'pcs') |
| `barcode` | VARCHAR(100) | Code-barres (optionnel) |
| `weight` | DECIMAL(10,3) | Poids du produit (optionnel) |
| `dimensions` | JSONB | Dimensions (longueur, largeur, hauteur) |
| `tax_rate` | DECIMAL(5,2) | Taux de TVA (défaut: 19%) |
| `track_inventory` | BOOLEAN | Activer le suivi de stock (défaut: true) |
| `type` | VARCHAR(20) | Type de produit (défaut: 'product') |
| `is_active` | BOOLEAN | Produit actif (défaut: true) |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de dernière modification |

#### Relations

- **ManyToOne** → `Business` : Appartient à une entreprise
- **ManyToOne** → `ProductCategory` : Appartient à une catégorie (optionnel)
- **ManyToOne** → `Supplier` : Fournisseur par défaut (optionnel)
- **OneToMany** → `StockMovement` : Historique des mouvements de stock
- **OneToMany** → `SalesOrderItem` : Lignes de commandes de vente
- **OneToMany** → `QuoteItem` : Lignes de devis
- **OneToMany** → `DeliveryNoteItem` : Lignes de bons de livraison
- **OneToMany** → `SupplierPOItem` : Lignes de commandes fournisseur
- **OneToMany** → `GoodsReceiptItem` : Lignes de réceptions de marchandises

#### Index

- `business_id` + `is_active` : Recherche rapide des produits actifs
- `business_id` + `sku` : Recherche par référence
- `category_id` : Recherche par catégorie

---

### 1.2 ProductCategory (Catégorie de Produit)

**Table:** `product_categories`

Permet d'organiser les produits en catégories hiérarchiques.

#### Champs Principaux

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `business_id` | UUID | Référence vers l'entreprise |
| `name` | VARCHAR(255) | Nom de la catégorie |
| `description` | TEXT | Description (optionnel) |
| `parent_id` | UUID | Catégorie parente pour hiérarchie (optionnel) |
| `code` | VARCHAR(50) | Code de la catégorie (optionnel) |
| `sort_order` | INTEGER | Ordre d'affichage (défaut: 0) |
| `image_url` | VARCHAR(500) | URL de l'image (optionnel) |
| `is_active` | BOOLEAN | Catégorie active (défaut: true) |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de modification |

#### Relations

- **ManyToOne** → `Business` : Appartient à une entreprise
- **ManyToOne** → `ProductCategory` (parent) : Catégorie parente
- **OneToMany** → `ProductCategory` (children) : Sous-catégories
- **OneToMany** → `Product` : Produits de cette catégorie

#### Index

- `business_id` + `is_active` : Recherche des catégories actives
- `business_id` + `name` : Recherche par nom
- `parent_id` : Navigation hiérarchique

---

### 1.3 StockMovement (Mouvement de Stock)

**Table:** `stock_movements`

Enregistre tous les mouvements de stock avec traçabilité complète.

#### Champs Principaux

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `business_id` | UUID | Référence vers l'entreprise |
| `product_id` | UUID | Référence vers le produit |
| `type` | ENUM | Type de mouvement (voir StockMovementType) |
| `quantity` | DECIMAL(15,3) | Quantité du mouvement (+ ou -) |
| `quantity_before` | DECIMAL(15,3) | Stock avant le mouvement |
| `quantity_after` | DECIMAL(15,3) | Stock après le mouvement |
| `unit_cost` | DECIMAL(12,3) | Coût unitaire (optionnel) |
| `total_value` | DECIMAL(15,3) | Valeur totale du mouvement (optionnel) |
| `reference_type` | VARCHAR(50) | Type de document source (optionnel) |
| `reference_id` | UUID | ID du document source (optionnel) |
| `reference` | VARCHAR(255) | Référence textuelle (optionnel) |
| `created_by` | UUID | Utilisateur créateur (optionnel) |
| `note` | TEXT | Note/commentaire (optionnel) |
| `location` | VARCHAR(100) | Emplacement (optionnel) |
| `created_at` | TIMESTAMPTZ | Date du mouvement |

#### Relations

- **ManyToOne** → `Business` : Appartient à une entreprise
- **ManyToOne** → `Product` : Concerne un produit

#### Index

- `product_id` + `created_at` : Historique par produit
- `business_id` + `type` : Recherche par type de mouvement
- `reference_type` + `reference_id` : Traçabilité vers document source

---

## 2. Types de Mouvements de Stock

### Énumération: StockMovementType

```typescript
export enum StockMovementType {
  ENTREE_ACHAT = 'ENTREE_ACHAT',           // Entrée suite à un achat
  SORTIE_VENTE = 'SORTIE_VENTE',           // Sortie suite à une vente
  AJUSTEMENT_POSITIF = 'AJUSTEMENT_POSITIF', // Ajustement manuel positif
  AJUSTEMENT_NEGATIF = 'AJUSTEMENT_NEGATIF', // Ajustement manuel négatif
  // Valeurs legacy pour compatibilité
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}
```

### Description des Types

| Type | Impact | Utilisation |
|------|--------|-------------|
| `ENTREE_ACHAT` | +Stock | Réception de marchandises d'un fournisseur |
| `SORTIE_VENTE` | -Stock | Sortie automatique lors d'une vente |
| `AJUSTEMENT_POSITIF` | +Stock | Correction manuelle (inventaire, retour, etc.) |
| `AJUSTEMENT_NEGATIF` | -Stock | Correction manuelle (casse, perte, etc.) |

---

## 3. API Endpoints

### 3.1 Products API

**Base URL:** `/businesses/:businessId/products`

#### GET /businesses/:businessId/products
Récupère tous les produits d'une entreprise.

**Query Parameters:**
- `is_active` (optional): `true` | `false` - Filtrer par statut actif

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Produit A",
    "reference": "SKU-001",
    "sale_price_ht": 100.000,
    "purchase_price_ht": 60.000,
    "current_stock": 50.000,
    "min_stock_threshold": 10.000,
    "is_stockable": true,
    "category": { "id": "uuid", "name": "Catégorie" }
  }
]
```

#### GET /businesses/:businessId/products/alerts
Récupère les produits en alerte de stock (stock ≤ seuil minimum).

#### GET /businesses/:businessId/products/:id
Récupère un produit spécifique.

#### POST /businesses/:businessId/products
Crée un nouveau produit.

**Body:**
```json
{
  "name": "Nouveau Produit",
  "reference": "SKU-002",
  "sale_price_ht": 150.000,
  "purchase_price_ht": 90.000,
  "current_stock": 100.000,
  "min_stock_threshold": 20.000,
  "category_id": "uuid",
  "tax_rate": 19.00,
  "is_stockable": true
}
```

#### PUT /businesses/:businessId/products/:id
Met à jour un produit existant.

#### DELETE /businesses/:businessId/products/:id
Supprime un produit.

**Permissions:** BUSINESS_OWNER, BUSINESS_ADMIN

---

### 3.2 Product Categories API

**Base URL:** `/businesses/:businessId/categories`

#### GET /businesses/:businessId/categories
Récupère toutes les catégories.

**Query Parameters:**
- `is_active` (optional): Filtrer par statut

#### GET /businesses/:businessId/categories/:id
Récupère une catégorie spécifique.

#### POST /businesses/:businessId/categories
Crée une nouvelle catégorie.

**Body:**
```json
{
  "name": "Électronique",
  "description": "Produits électroniques",
  "is_active": true
}
```

#### PUT /businesses/:businessId/categories/:id
Met à jour une catégorie.

#### DELETE /businesses/:businessId/categories/:id
Supprime une catégorie.

---

### 3.3 Stock Movements API

**Base URL:** `/businesses/:businessId/stock-movements`

#### GET /businesses/:businessId/stock-movements
Récupère l'historique des mouvements de stock.

**Query Parameters:**
- `product_id` (optional): Filtrer par produit
- `type` (optional): Filtrer par type de mouvement
- `limit` (optional): Nombre de résultats (défaut: 20)
- `offset` (optional): Pagination (défaut: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "type": "SORTIE_VENTE",
      "quantity": -5.000,
      "stock_before": 50.000,
      "stock_after": 45.000,
      "note": "Sortie vente - Commande CMD-2026-0001",
      "created_at": "2026-03-29T10:30:00Z",
      "product": {
        "name": "Produit A",
        "reference": "SKU-001"
      }
    }
  ],
  "total": 150
}
```

#### GET /businesses/:businessId/stock-movements/:id
Récupère un mouvement spécifique.

#### POST /businesses/:businessId/stock-movements/manual
Crée un mouvement de stock manuel.

**Body:**
```json
{
  "product_id": "uuid",
  "type": "AJUSTEMENT_POSITIF",
  "quantity": 10.000,
  "note": "Inventaire - correction"
}
```

#### DELETE /businesses/:businessId/stock-movements/:id
Supprime un mouvement manuel (uniquement les mouvements de type MANUAL).

**Permissions:** BUSINESS_OWNER, BUSINESS_ADMIN

---

## 4. Intégrations avec Autres Modules

### 4.1 Module Sales (Ventes)

#### Intégration Automatique: Sortie Vente

Lorsqu'une commande de vente (`SalesOrder`) passe au statut `IN_PROGRESS`, le système crée automatiquement des mouvements de stock de type `SORTIE_VENTE` pour chaque produit de la commande.

**Processus:**
1. Commande créée avec statut `CONFIRMED`
2. Utilisateur démarre la commande → statut `IN_PROGRESS`
3. Pour chaque ligne de commande (`SalesOrderItem`) avec un `productId`:
   - Création automatique d'un `StockMovement`
   - Type: `SORTIE_VENTE`
   - Quantité: quantité de la ligne de commande (négative)
   - Référence: `SALES_ORDER` + ID de la commande
   - Note: "Sortie vente - Commande {orderNumber}"

**Code (SalesOrdersService.startProgress):**
```typescript
for (const item of order.items) {
  if (item.productId) {
    await this.stockMovementsService.createManual(businessId, {
      product_id: item.productId,
      type: StockMovementType.SORTIE_VENTE,
      quantity: Number(item.quantity),
      source_type: 'SALES_ORDER',
      source_id: order.id,
      note: `Sortie vente - Commande ${order.orderNumber}`,
    });
  }
}
```

**Entités Liées:**
- `SalesOrder` : Commande de vente
- `SalesOrderItem` : Ligne de commande (contient `productId`)
- `Quote` : Devis (peut contenir des produits)
- `DeliveryNote` : Bon de livraison
- `Invoice` : Facture

---

### 4.2 Module Purchases (Achats)

#### Intégration: Entrée Achat

Lors de la réception de marchandises (`GoodsReceipt`), des mouvements de type `ENTREE_ACHAT` sont créés.

**Entités Liées:**
- `SupplierPO` : Commande fournisseur
- `SupplierPOItem` : Ligne de commande fournisseur
- `GoodsReceipt` : Réception de marchandises
- `GoodsReceiptItem` : Ligne de réception
- `Supplier` : Fournisseur (référencé dans Product.default_supplier_id)

---

### 4.3 Module Businesses

Chaque produit, catégorie et mouvement de stock est lié à une entreprise (`Business`) via `business_id`.

**Isolation des Données:**
- Tous les endpoints filtrent automatiquement par `businessId`
- Les utilisateurs ne peuvent accéder qu'aux données de leur entreprise
- Suppression en cascade lors de la suppression d'une entreprise

---

## 5. Services (Logique Métier)

### 5.1 ProductsService

**Méthodes Principales:**

| Méthode | Description |
|---------|-------------|
| `findAll(businessId, isActive?)` | Liste tous les produits |
| `findOne(businessId, id)` | Récupère un produit |
| `findAlerts(businessId)` | Produits en alerte de stock |
| `create(businessId, dto)` | Crée un produit |
| `update(businessId, id, dto)` | Met à jour un produit |
| `remove(businessId, id)` | Supprime un produit |

**Logique d'Alerte:**
```typescript
// Produits avec stock ≤ seuil minimum
quantity <= min_quantity AND track_inventory = true AND is_active = true
```

---

### 5.2 ProductCategoriesService

**Méthodes Principales:**

| Méthode | Description |
|---------|-------------|
| `findAll(businessId, isActive?)` | Liste toutes les catégories |
| `findOne(businessId, id)` | Récupère une catégorie |
| `create(businessId, dto)` | Crée une catégorie |
| `update(businessId, id, dto)` | Met à jour une catégorie |
| `remove(businessId, id)` | Supprime une catégorie |

---

### 5.3 StockMovementsService

**Méthodes Principales:**

| Méthode | Description |
|---------|-------------|
| `findAll(businessId, filters)` | Liste les mouvements avec filtres |
| `findOne(businessId, id)` | Récupère un mouvement |
| `createManual(businessId, dto)` | Crée un mouvement manuel |
| `remove(businessId, id)` | Supprime un mouvement manuel |

**Logique de Création:**
1. Récupère le produit et son stock actuel (`quantity_before`)
2. Calcule le changement de quantité selon le type:
   - `SORTIE_VENTE`, `AJUSTEMENT_NEGATIF`, `OUT` → quantité négative
   - `ENTREE_ACHAT`, `AJUSTEMENT_POSITIF`, `IN` → quantité positive
3. Calcule le nouveau stock (`quantity_after = quantity_before + quantity`)
4. Crée le mouvement avec traçabilité
5. Met à jour le stock du produit

**Sécurité:**
- Seuls les mouvements de type `MANUAL` peuvent être supprimés
- La suppression inverse le mouvement sur le produit

---

## 6. Transformation des Données (Frontend ↔ Backend)

Le contrôleur Products effectue une transformation bidirectionnelle pour maintenir la compatibilité avec le frontend.

### Mapping Frontend → Backend

| Frontend | Backend |
|----------|---------|
| `reference` | `sku` |
| `sale_price_ht` | `price` |
| `purchase_price_ht` | `cost` |
| `current_stock` | `quantity` |
| `min_stock_threshold` | `min_quantity` |
| `is_stockable` | `track_inventory` |

### Mapping Backend → Frontend

Transformation inverse pour les réponses API.

---

## 7. Permissions et Sécurité

### Rôles Autorisés

| Action | Rôles |
|--------|-------|
| Lecture (GET) | BUSINESS_OWNER, BUSINESS_ADMIN, ACCOUNTANT, TEAM_MEMBER |
| Création (POST) | BUSINESS_OWNER, BUSINESS_ADMIN |
| Modification (PUT) | BUSINESS_OWNER, BUSINESS_ADMIN |
| Suppression (DELETE) | BUSINESS_OWNER, BUSINESS_ADMIN |

### Guards Appliqués

- `AuthGuard('jwt')` : Authentification requise
- `RolesGuard` : Vérification des rôles
- Isolation par `businessId` : Chaque requête filtre par entreprise

---

## 8. Cas d'Usage Principaux

### 8.1 Création d'un Produit
1. Utilisateur crée un produit via l'interface
2. Validation des données (DTO)
3. Enregistrement en base avec `business_id`
4. Stock initial = 0 (ou valeur fournie)

### 8.2 Vente d'un Produit
1. Création d'une commande de vente avec produits
2. Commande passe en statut `IN_PROGRESS`
3. Création automatique de mouvements `SORTIE_VENTE`
4. Décrémentation du stock pour chaque produit

### 8.3 Réception de Marchandises
1. Création d'une réception de marchandises
2. Création de mouvements `ENTREE_ACHAT`
3. Incrémentation du stock

### 8.4 Ajustement Manuel
1. Utilisateur crée un mouvement manuel
2. Type: `AJUSTEMENT_POSITIF` ou `AJUSTEMENT_NEGATIF`
3. Mise à jour immédiate du stock
4. Traçabilité complète avec note

### 8.5 Alerte de Stock
1. Système vérifie `quantity <= min_quantity`
2. Endpoint `/products/alerts` retourne les produits concernés
3. Interface affiche les alertes

---

## 9. Évolutions Futures Possibles

### Fonctionnalités Potentielles

1. **Multi-emplacements**
   - Gestion de plusieurs entrepôts/emplacements
   - Transferts inter-emplacements

2. **Lots et Numéros de Série**
   - Traçabilité par lot
   - Gestion des dates d'expiration
   - Suivi des numéros de série

3. **Valorisation du Stock**
   - Méthodes: FIFO, LIFO, CUMP
   - Calcul automatique de la valeur du stock

4. **Réservations**
   - Réservation de stock pour commandes
   - Gestion des stocks disponibles vs réservés

5. **Inventaires**
   - Module d'inventaire physique
   - Comparaison stock théorique vs réel
   - Génération automatique d'ajustements

6. **Prévisions**
   - Analyse des tendances de consommation
   - Suggestions de réapprovisionnement
   - Calcul du stock de sécurité

7. **Codes-barres**
   - Génération automatique de codes-barres
   - Scan pour mouvements rapides

---

## 10. Bonnes Pratiques

### Pour les Développeurs

1. **Toujours utiliser les services** pour créer des mouvements de stock
2. **Ne jamais modifier directement** `Product.quantity` sans créer un mouvement
3. **Utiliser les transactions** pour garantir la cohérence des données
4. **Documenter les sources** des mouvements avec `reference_type` et `reference_id`
5. **Tester les cas limites** (stock négatif, quantités décimales, etc.)

### Pour les Utilisateurs

1. **Définir des seuils d'alerte** pertinents pour chaque produit
2. **Utiliser les catégories** pour organiser les produits
3. **Renseigner les fournisseurs** par défaut pour faciliter les réapprovisionnements
4. **Vérifier régulièrement** les alertes de stock
5. **Documenter les ajustements** manuels avec des notes claires

---

## 11. Dépendances du Module

### Modules Importés
- `TypeOrmModule` : Accès à la base de données
- `AuthModule` : Authentification et autorisation
- `BusinessesModule` : Gestion des entreprises

### Modules qui Importent Stock
- `SalesModule` : Pour les sorties de stock automatiques
- `PurchasesModule` : Pour les entrées de stock

### Services Exportés
- `StockMovementsService` : Utilisé par SalesModule
- `ProductsService` : Utilisé par d'autres modules
- `TypeOrmModule.forFeature([Product, ProductCategory, StockMovement])` : Accès aux repositories

---

## 12. Base de Données

### Tables Créées
- `products`
- `product_categories`
- `stock_movements`

### Contraintes
- Foreign Keys vers `businesses`, `suppliers`, `product_categories`
- Cascade DELETE sur `business_id`
- SET NULL sur `category_id`, `default_supplier_id`

### Performance
- Index sur les colonnes fréquemment recherchées
- Utilisation de DECIMAL pour précision financière
- TIMESTAMPTZ pour gestion des fuseaux horaires

---

## Conclusion

Le module Stock est un système robuste et extensible qui assure:
- ✅ Traçabilité complète des mouvements
- ✅ Intégration automatique avec les ventes
- ✅ Gestion multi-entreprises isolée
- ✅ Alertes de stock en temps réel
- ✅ API REST complète et sécurisée
- ✅ Support des quantités décimales (précision 3 décimales)
- ✅ Historique complet et auditable

Pour toute question ou amélioration, consulter l'équipe de développement.
