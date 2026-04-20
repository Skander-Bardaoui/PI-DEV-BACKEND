# 📦 MODULE PURCHASES - DOCUMENTATION COMPLÈTE

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du module](#architecture-du-module)
3. [Entités et modèles de données](#entités-et-modèles-de-données)
4. [Fonctionnalités détaillées](#fonctionnalités-détaillées)
5. [Intelligence Artificielle](#intelligence-artificielle)
6. [APIs et endpoints](#apis-et-endpoints)
7. [Processus métier](#processus-métier)
8. [Technologies utilisées](#technologies-utilisées)
9. [Q&A - Questions fréquentes](#qa---questions-fréquentes)

---

## 🎯 Vue d'ensemble

Le module **Purchases** (Achats) est un système complet de gestion des achats qui couvre l'ensemble du cycle de vie des achats, de la gestion des fournisseurs jusqu'au paiement des factures.

### Objectifs principaux
- Gérer les fournisseurs et leurs informations
- Créer et suivre les bons de commande (Purchase Orders)
- Enregistrer les réceptions de marchandises
- Gérer les factures fournisseurs
- Effectuer le rapprochement 3 voies (BC/BR/Facture)
- Gérer les litiges et résolutions
- Analyser la performance des fournisseurs
- Automatiser les processus avec l'IA

### Modules connectés
- **Payments Module** : Gestion des paiements fournisseurs
- **Stock Module** : Mouvements de stock lors des réceptions
- **Business Module** : Multi-tenant (chaque entreprise a ses données)

---


## 🏗️ Architecture du module

### Structure des dossiers

```
PI-DEV-BACKEND/src/Purchases/
├── controllers/          # 13 contrôleurs REST API
├── services/            # 19 services métier
├── entities/            # 9 entités TypeORM
├── dto/                 # Data Transfer Objects
├── enum/                # Énumérations (statuts)
├── utils/               # Utilitaires (JSON parser)
├── purchases.module.ts  # Configuration du module
└── purchases.service.ts # Service principal

PI-DEV-FRONT/src/
├── pages/backoffice/purchases/  # 11 pages
├── components/purchases/        # 30 composants
└── hooks/                       # Hooks React Query
```

### Contrôleurs (13)
1. **suppliers.controller** - Gestion des fournisseurs
2. **supplier-pos.controller** - Bons de commande
3. **goods-receipts.controller** - Réceptions de marchandises
4. **purchase-invoices.controller** - Factures fournisseurs
5. **supplier-portal.controller** - Portail fournisseur
6. **three-way-matching.controller** - Rapprochement 3 voies
7. **dispute-resolution.controller** - Gestion des litiges
8. **purchase-alerts.controller** - Alertes et notifications
9. **supplier-scoring.controller** - Notation des fournisseurs
10. **supplier-onboarding.controller** - Intégration fournisseurs
11. **purchase-ai-assistant.controller** - Assistant IA
12. **ocr.controller** - OCR des factures
13. **upload.controller** - Upload de fichiers

### Services (19)
1. **suppliers.service** - CRUD fournisseurs
2. **supplier-pos.service** - CRUD bons de commande
3. **goods-receipts.service** - CRUD réceptions
4. **purchase-invoices.service** - CRUD factures
5. **supplier-portal.service** - Portail fournisseur
6. **three-way-matching.service** - Rapprochement
7. **three-way-matching-ai.service** - Rapprochement IA
8. **dispute-resolution.service** - Litiges
9. **purchase-alerts.service** - Alertes
10. **supplier-scoring.service** - Notation
11. **supplier-ai-insights.service** - Insights IA
12. **supplier-recommendation.service** - Recommandations
13. **supplier-onboarding.service** - Onboarding
14. **purchase-ai-assistant.service** - Assistant IA
15. **purchase-mail.service** - Emails
16. **ocr.service** - OCR Tesseract
17. **purchase-ocr-ai.service** - OCR + IA
18. **po-ai-generator.service** - Génération BC par IA
19. **purchases.service** - Service principal

---


## 📊 Entités et modèles de données

### 1. Supplier (Fournisseur)
**Table**: `suppliers`

**Champs principaux**:
- `id` (UUID) - Identifiant unique
- `business_id` (UUID) - Multi-tenant
- `name` (string) - Nom du fournisseur
- `matricule_fiscal` (string) - Numéro fiscal
- `email`, `phone` - Coordonnées
- `address` (JSONB) - Adresse complète
- `rib`, `bank_name` - Coordonnées bancaires
- `payment_terms` (int) - Délai de paiement (jours)
- `category` (string) - Catégorie
- `is_active` (boolean) - Actif/Archivé
- `notes` (text) - Notes

**Relations**:
- `supplier_pos[]` - Bons de commande
- `purchase_invoices[]` - Factures
- `goods_receipts[]` - Réceptions

### 2. SupplierPO (Bon de commande)
**Table**: `supplier_pos`

**Champs principaux**:
- `id` (UUID)
- `po_number` (string) - Ex: ACH-2024-0001
- `status` (enum) - DRAFT, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
- `business_id`, `supplier_id` (UUID)
- `expected_delivery` (date)
- `sent_at` (timestamp)
- `subtotal_ht`, `tax_amount`, `timbre_fiscal`, `net_amount` (decimal)
- `notes`, `pdf_url`

**Relations**:
- `supplier` - Fournisseur
- `items[]` - Lignes du BC
- `goods_receipts[]` - Réceptions
- `purchase_invoices[]` - Factures

### 3. SupplierPOItem (Ligne de BC)
**Table**: `supplier_po_items`

**Champs**:
- `id` (UUID)
- `supplier_po_id` (UUID)
- `product_id` (UUID, nullable)
- `description` (string)
- `quantity`, `unit_price`, `tax_rate` (decimal)
- `line_total_ht`, `line_total_ttc` (decimal)

### 4. GoodsReceipt (Bon de réception)
**Table**: `goods_receipts`

**Champs**:
- `id` (UUID)
- `gr_number` (string) - Ex: BR-2024-0001
- `business_id`, `supplier_po_id`, `supplier_id` (UUID)
- `receipt_date` (date)
- `received_by` (UUID) - Utilisateur
- `notes`

**Relations**:
- `supplier_po` - BC source
- `supplier` - Fournisseur
- `items[]` - Lignes reçues
- `receiver` - Utilisateur

### 5. GoodsReceiptItem (Ligne de réception)
**Table**: `goods_receipt_items`

**Champs**:
- `id` (UUID)
- `goods_receipt_id` (UUID)
- `supplier_po_item_id` (UUID)
- `product_id` (UUID, nullable)
- `received_quantity` (decimal)
- `description`

### 6. PurchaseInvoice (Facture fournisseur)
**Table**: `purchase_invoices`

**Champs**:
- `id` (UUID)
- `invoice_number_supplier` (string) - N° sur facture papier
- `status` (enum) - PENDING, APPROVED, PAID, DISPUTED, CANCELLED
- `business_id`, `supplier_id`, `supplier_po_id` (UUID)
- `invoice_date`, `due_date` (date)
- `subtotal_ht`, `tax_amount`, `timbre_fiscal`, `net_amount` (decimal)
- `paid_amount` (decimal) - Mis à jour par PaymentsModule
- `receipt_url` (string) - Scan de la facture
- `dispute_reason` (text)

**Propriétés calculées**:
- `remaining_amount` - Montant restant à payer
- `is_overdue` - Facture en retard

### 7. PurchaseAlert (Alerte)
**Table**: `purchase_alerts`

**Champs**:
- `id` (UUID)
- `business_id` (UUID)
- `type` (string) - Type d'alerte
- `severity` (enum) - INFO, WARNING, ERROR, CRITICAL
- `status` (enum) - UNREAD, READ, DISMISSED
- `title`, `message` (string)
- `metadata` (JSONB)
- `related_entity_type`, `related_entity_id` (string)

### 8. DisputeResponse (Réponse litige)
**Table**: `dispute_responses`

**Champs**:
- `id` (UUID)
- `purchase_invoice_id` (UUID)
- `business_id` (UUID)
- `message` (text)
- `attachments` (JSONB)
- `created_by` (UUID)

### 9. SupplierPortalToken (Token portail)
**Table**: `supplier_portal_tokens`

**Champs**:
- `id` (UUID)
- `supplier_id` (UUID)
- `token` (string)
- `expires_at` (timestamp)

---


## 🎯 Fonctionnalités détaillées

### 1. 👥 Gestion des fournisseurs

#### Fonctionnalités
- ✅ Créer/Modifier/Supprimer (soft delete) des fournisseurs
- ✅ Recherche et filtrage (nom, catégorie, statut)
- ✅ Pagination (10 par page)
- ✅ Tri par nom, catégorie, délai paiement
- ✅ Archivage/Restauration
- ✅ Export PDF du relevé fournisseur
- ✅ Invitation fournisseur par email

#### Pages frontend
- **SuppliersPage.tsx** - Liste des fournisseurs
- **SupplierModal.tsx** - Formulaire création/édition
- **SupplierInviteModal.tsx** - Invitation par email

#### APIs
```
GET    /api/purchases/suppliers
POST   /api/purchases/suppliers
GET    /api/purchases/suppliers/:id
PATCH  /api/purchases/suppliers/:id
DELETE /api/purchases/suppliers/:id (soft delete)
POST   /api/purchases/suppliers/:id/restore
```

#### Processus
1. Utilisateur clique "Nouveau fournisseur"
2. Remplit le formulaire (nom, email, RIB, délai paiement, etc.)
3. Backend valide et crée l'entité Supplier
4. Fournisseur apparaît dans la liste

---

### 2. 📝 Bons de commande (Purchase Orders)

#### Fonctionnalités
- ✅ Créer des BC manuellement
- ✅ Générer des BC avec l'IA (PoAiGeneratorService)
- ✅ Numérotation automatique (ACH-2024-0001)
- ✅ Gestion des statuts (DRAFT → SENT → CONFIRMED → RECEIVED)
- ✅ Calcul automatique des montants (HT, TVA, Timbre, TTC)
- ✅ Envoi par email au fournisseur
- ✅ Génération PDF
- ✅ Suivi des réceptions partielles/complètes

#### Pages frontend
- **SupplierPOsPage.tsx** - Liste des BC
- **SupplierPOModal.tsx** - Création/édition
- **AiPOGeneratorModal.tsx** - Génération IA
- **SupplierPODetailModal.tsx** - Détails

#### APIs
```
GET    /api/purchases/supplier-pos
POST   /api/purchases/supplier-pos
GET    /api/purchases/supplier-pos/:id
PATCH  /api/purchases/supplier-pos/:id
DELETE /api/purchases/supplier-pos/:id
POST   /api/purchases/supplier-pos/:id/send
POST   /api/purchases/supplier-pos/:id/confirm
POST   /api/purchases/supplier-pos/:id/cancel
POST   /api/purchases/supplier-pos/generate-with-ai
```

#### Processus création BC
1. Utilisateur sélectionne un fournisseur
2. Ajoute des lignes (produit, quantité, prix)
3. Système calcule automatiquement:
   - `line_total_ht` = quantity × unit_price
   - `line_total_ttc` = line_total_ht × (1 + tax_rate/100)
   - `subtotal_ht` = Σ line_total_ht
   - `tax_amount` = Σ (line_total_ttc - line_total_ht)
   - `net_amount` = subtotal_ht + tax_amount + timbre_fiscal (1 DT)
4. Statut = DRAFT
5. Utilisateur peut envoyer → Statut = SENT
6. Email envoyé au fournisseur avec PDF

#### Génération IA
- Service: **PoAiGeneratorService**
- IA utilisée: **Google Gemini**
- Prompt: Analyse l'historique d'achats et génère un BC optimisé
- Retourne: Liste de produits avec quantités suggérées

---

### 3. 📦 Réceptions de marchandises (Goods Receipts)

#### Fonctionnalités
- ✅ Créer un bon de réception depuis un BC
- ✅ Numérotation automatique (BR-2024-0001)
- ✅ Réception partielle ou complète
- ✅ Mise à jour automatique du statut BC
- ✅ Création automatique de mouvements de stock
- ✅ Traçabilité (qui a reçu, quand)

#### Pages frontend
- **GoodsReceiptsPage.tsx** - Liste des réceptions
- **GoodsReceiptModal.tsx** - Création

#### APIs
```
GET    /api/purchases/goods-receipts
POST   /api/purchases/goods-receipts
GET    /api/purchases/goods-receipts/:id
DELETE /api/purchases/goods-receipts/:id
```

#### Processus réception
1. Utilisateur ouvre un BC (statut CONFIRMED)
2. Clique "Créer réception"
3. Saisit les quantités reçues pour chaque ligne
4. Système:
   - Crée GoodsReceipt + GoodsReceiptItems
   - Crée StockMovement (type: PURCHASE_RECEIPT)
   - Met à jour le stock des produits
   - Calcule si BC partiellement/complètement reçu
   - Met à jour statut BC (PARTIALLY_RECEIVED ou RECEIVED)
5. Bon de réception enregistré

---

### 4. 🧾 Factures fournisseurs (Purchase Invoices)

#### Fonctionnalités
- ✅ Créer facture manuellement
- ✅ Créer facture depuis un BC
- ✅ OCR de factures (scan → extraction données)
- ✅ Enrichissement IA des données OCR
- ✅ Gestion des statuts (PENDING → APPROVED → PAID)
- ✅ Calcul automatique date d'échéance
- ✅ Suivi des paiements (paid_amount)
- ✅ Gestion des litiges (DISPUTED)
- ✅ Upload du scan de facture

#### Pages frontend
- **PurchaseInvoicesPage.tsx** - Liste des factures
- **PurchaseInvoiceModal.tsx** - Création/édition
- **OcrInvoiceModal.tsx** - OCR + IA
- **InvoiceDetailModal.tsx** - Détails
- **DisputeModal.tsx** - Créer un litige

#### APIs
```
GET    /api/purchases/purchase-invoices
POST   /api/purchases/purchase-invoices
GET    /api/purchases/purchase-invoices/:id
PATCH  /api/purchases/purchase-invoices/:id
DELETE /api/purchases/purchase-invoices/:id
POST   /api/purchases/purchase-invoices/:id/approve
POST   /api/purchases/purchase-invoices/:id/dispute
POST   /api/purchases/purchase-invoices/:id/resolve-dispute
POST   /api/purchases/ocr/extract
```

#### Processus création facture
1. Utilisateur clique "Nouvelle facture"
2. Sélectionne fournisseur
3. Saisit:
   - N° facture fournisseur
   - Date facture
   - Montants (HT, TVA, Timbre)
4. Système calcule:
   - `net_amount` = subtotal_ht + tax_amount + timbre_fiscal
   - `due_date` = invoice_date + supplier.payment_terms jours
5. Upload scan facture (optionnel)
6. Statut = PENDING
7. Utilisateur peut approuver → APPROVED
8. Paiement effectué → PAID (via PaymentsModule)

#### OCR + IA
- **Service OCR**: OcrService (Tesseract.js)
- **Service IA**: PurchaseOcrAiService (Google Gemini)
- **Processus**:
  1. Upload image/PDF de facture
  2. Tesseract extrait le texte brut
  3. Gemini analyse le texte et extrait:
     - N° facture
     - Date
     - Fournisseur
     - Montants (HT, TVA, TTC)
     - Lignes de produits
  4. Score de confiance OCR + IA
  5. Pré-remplit le formulaire

---


### 5. 🔄 Rapprochement 3 voies (Three-Way Matching)

#### Concept
Le rapprochement 3 voies vérifie la cohérence entre:
1. **Bon de commande** (ce qu'on a commandé)
2. **Bon de réception** (ce qu'on a reçu)
3. **Facture** (ce qu'on doit payer)

#### Fonctionnalités
- ✅ Rapprochement automatique
- ✅ Détection des écarts (quantité, prix, montant)
- ✅ Analyse IA des écarts (ThreeWayMatchingAIService)
- ✅ Recommandations IA
- ✅ Statut: MATCHED, PARTIAL_MATCH, MISMATCHED
- ✅ Seuils de tolérance configurables

#### Pages frontend
- **ThreeWayMatchingPage.tsx** - Interface de rapprochement
- **ThreeWayMatchModal.tsx** - Détails du rapprochement
- **ThreeWayMatchingAIPanel.tsx** - Analyse IA
- **ThreeWayMatchBadge.tsx** - Badge de statut

#### APIs
```
POST   /api/purchases/three-way-matching/match
GET    /api/purchases/three-way-matching/:invoiceId
POST   /api/purchases/three-way-matching/:invoiceId/ai-analysis
```

#### Processus
1. Facture créée (liée à un BC)
2. Système lance le rapprochement automatique
3. Compare:
   - Quantités: BC vs BR vs Facture
   - Prix unitaires: BC vs Facture
   - Montants totaux
4. Calcule les écarts en %
5. Détermine le statut:
   - **MATCHED**: Écarts < 2%
   - **PARTIAL_MATCH**: Écarts 2-10%
   - **MISMATCHED**: Écarts > 10%
6. Si écarts détectés:
   - Alerte créée
   - IA analyse et recommande des actions
   - Utilisateur peut créer un litige

#### Analyse IA
- **Service**: ThreeWayMatchingAIService
- **IA**: Google Gemini
- **Analyse**:
  - Identifie les écarts critiques
  - Explique les causes probables
  - Recommande des actions (accepter, contester, corriger)
  - Évalue le risque financier

---

### 6. ⚠️ Gestion des litiges (Dispute Resolution)

#### Fonctionnalités
- ✅ Créer un litige sur une facture
- ✅ Statut facture → DISPUTED
- ✅ Ajouter des réponses/commentaires
- ✅ Joindre des pièces justificatives
- ✅ Résoudre le litige
- ✅ Historique complet des échanges

#### Pages frontend
- **DisputeModal.tsx** - Créer un litige
- **DisputeResolutionModal.tsx** - Gérer le litige
- **DisputeResponsesPanel.tsx** - Historique
- **DisputesSlideOver.tsx** - Vue latérale

#### APIs
```
POST   /api/purchases/disputes
GET    /api/purchases/disputes/:invoiceId
POST   /api/purchases/disputes/:invoiceId/responses
PATCH  /api/purchases/disputes/:invoiceId/resolve
```

#### Processus
1. Utilisateur détecte un problème sur une facture
2. Clique "Créer un litige"
3. Saisit la raison du litige
4. Système:
   - Met facture en statut DISPUTED
   - Crée une alerte
   - Envoie email au fournisseur (optionnel)
5. Échanges de messages/documents
6. Résolution:
   - Facture corrigée → PENDING
   - Facture annulée → CANCELLED
   - Litige accepté → APPROVED

---

### 7. 📊 Notation des fournisseurs (Supplier Scoring)

#### Fonctionnalités
- ✅ Score automatique 0-100
- ✅ Critères multiples:
  - Qualité des livraisons (90%)
  - Respect des délais (95%)
  - Conformité des factures (85%)
  - Taux de litiges (5%)
- ✅ Historique des scores
- ✅ Comparaison entre fournisseurs
- ✅ Badges de performance

#### Pages frontend
- **SupplierScoreModal.tsx** - Détails du score
- **SupplierScoreBadge.tsx** - Badge visuel
- **SupplierRankingPage.tsx** - Classement

#### APIs
```
GET    /api/purchases/supplier-scoring/:supplierId
GET    /api/purchases/supplier-scoring/ranking
```

#### Calcul du score
```typescript
score = (
  delivery_quality * 0.30 +
  on_time_delivery * 0.25 +
  invoice_accuracy * 0.25 +
  (100 - dispute_rate) * 0.20
)
```

**Critères**:
- **delivery_quality**: % de réceptions sans écart
- **on_time_delivery**: % de livraisons à temps
- **invoice_accuracy**: % de factures sans erreur
- **dispute_rate**: % de factures en litige

---

### 8. 🤖 Intelligence IA des fournisseurs

#### Fonctionnalités
- ✅ Analyse de performance
- ✅ Recommandations d'amélioration
- ✅ Prédictions de risques
- ✅ Suggestions de fournisseurs alternatifs
- ✅ Insights sur les tendances

#### Pages frontend
- **SupplierIntelligencePage.tsx** - Dashboard IA
- **SupplierAIInsightsModal.tsx** - Insights détaillés
- **SupplierRecommendationPanel.tsx** - Recommandations

#### Services IA
- **SupplierAiInsightsService**: Analyse globale
- **SupplierRecommendationService**: Recommandations

#### APIs
```
GET    /api/purchases/supplier-scoring/:supplierId/ai-insights
GET    /api/purchases/supplier-scoring/recommendations
```

#### Analyses fournies
1. **Performance globale**
   - Score de fiabilité
   - Tendance (amélioration/dégradation)
   - Comparaison avec la moyenne

2. **Risques identifiés**
   - Retards fréquents
   - Erreurs de facturation
   - Litiges récurrents

3. **Recommandations**
   - Renégocier les délais
   - Diversifier les fournisseurs
   - Améliorer la communication

4. **Prédictions**
   - Risque de rupture
   - Évolution des prix
   - Capacité de livraison

---

### 9. 💬 Assistant IA conversationnel

#### Fonctionnalités
- ✅ Chat en langage naturel
- ✅ Réponses contextuelles
- ✅ Accès aux données en temps réel
- ✅ Détection d'intention
- ✅ Réponses ultra-courtes (< 100 chars)

#### Pages frontend
- **PurchaseAIAssistant.tsx** - Interface de chat

#### Service
- **PurchaseAiAssistantService**
- **IA**: Google Gemini

#### APIs
```
POST   /api/purchases/ai-assistant/chat
```

#### Exemples de questions
- "Combien de factures en retard ?"
- "Quel est mon meilleur fournisseur ?"
- "Montant total des achats ce mois ?"
- "Combien de litiges en cours ?"
- "Quels BC en attente de réception ?"

#### Processus
1. Utilisateur pose une question
2. Service détecte l'intention:
   - `invoice_status`: Questions sur factures
   - `supplier_performance`: Performance fournisseurs
   - `purchase_summary`: Résumés d'achats
   - `dispute_info`: Informations litiges
   - `general`: Questions générales
3. Récupère les données nécessaires
4. Gemini génère une réponse courte
5. Réponse affichée dans le chat

---

### 10. 🔔 Alertes et notifications

#### Fonctionnalités
- ✅ Alertes automatiques
- ✅ 4 niveaux de sévérité (INFO, WARNING, ERROR, CRITICAL)
- ✅ Notification en temps réel
- ✅ Badge de compteur
- ✅ Marquer comme lu/ignoré
- ✅ Filtrage par type/sévérité

#### Pages frontend
- **AlertsBell.tsx** - Icône de notification
- **AlertsPanel.tsx** - Panneau latéral

#### Types d'alertes
- **INVOICE_OVERDUE**: Facture en retard
- **INVOICE_DUE_SOON**: Échéance proche (7 jours)
- **THREE_WAY_MISMATCH**: Écart rapprochement
- **DISPUTE_CREATED**: Nouveau litige
- **PO_PENDING_RECEIPT**: BC en attente de réception
- **SUPPLIER_PERFORMANCE_DROP**: Baisse de performance

#### APIs
```
GET    /api/purchases/alerts
PATCH  /api/purchases/alerts/:id/read
PATCH  /api/purchases/alerts/:id/dismiss
DELETE /api/purchases/alerts/:id
```

---

### 11. 🌐 Portail fournisseur

#### Fonctionnalités
- ✅ Accès sécurisé par token JWT
- ✅ Consultation des BC
- ✅ Confirmation de BC
- ✅ Consultation des factures
- ✅ Réponse aux litiges
- ✅ Pas de mot de passe requis

#### Pages frontend
- **SupplierPortalPage.tsx** - Interface fournisseur

#### APIs
```
POST   /api/purchases/supplier-portal/generate-link
GET    /api/purchases/supplier-portal/verify-token
GET    /api/purchases/supplier-portal/purchase-orders
POST   /api/purchases/supplier-portal/purchase-orders/:id/confirm
GET    /api/purchases/supplier-portal/invoices
```

#### Processus
1. Entreprise invite un fournisseur
2. Email envoyé avec lien unique
3. Lien contient un token JWT (validité 72h)
4. Fournisseur clique sur le lien
5. Accès direct sans mot de passe
6. Peut voir ses BC et factures
7. Peut confirmer les BC
8. Peut répondre aux litiges

---

### 12. 📤 Onboarding fournisseurs

#### Fonctionnalités
- ✅ Formulaire d'inscription fournisseur
- ✅ Validation des informations
- ✅ Upload de documents (RIB, Kbis, etc.)
- ✅ Approbation par l'entreprise
- ✅ Création automatique du fournisseur

#### Pages frontend
- **SupplierOnboardingController** (public)

#### APIs
```
POST   /api/purchases/supplier-onboarding/register
GET    /api/purchases/supplier-onboarding/pending
POST   /api/purchases/supplier-onboarding/:id/approve
POST   /api/purchases/supplier-onboarding/:id/reject
```

---


## 🤖 Intelligence Artificielle

### IA utilisée: Google Gemini

Tous les services IA du module utilisent **Google Gemini** (modèle: gemini-1.5-flash).

### Services IA (7)

#### 1. **PurchaseOcrAiService**
- **Fonction**: Enrichissement des données OCR
- **Input**: Texte brut extrait par Tesseract
- **Output**: Données structurées (JSON)
- **Extraction**:
  - N° facture
  - Date
  - Fournisseur
  - Montants (HT, TVA, TTC)
  - Lignes de produits
  - Score de confiance (0-100%)

**Prompt**:
```
Tu es un expert en analyse de factures. Analyse ce texte OCR et extrais:
- invoice_number
- invoice_date
- supplier_name
- amounts (subtotal_ht, tax_amount, net_amount)
- line_items[]
- confidence_score

Retourne UNIQUEMENT un JSON valide.
```

#### 2. **ThreeWayMatchingAIService**
- **Fonction**: Analyse des écarts de rapprochement
- **Input**: Données BC, BR, Facture + écarts détectés
- **Output**: Analyse + recommandations
- **Analyse**:
  - Gravité des écarts
  - Causes probables
  - Impact financier
  - Actions recommandées

**Prompt**:
```
Analyse ces écarts de rapprochement 3 voies:
- BC: [données]
- BR: [données]
- Facture: [données]
- Écarts: [liste]

Fournis:
1. Analyse de la gravité
2. Causes probables
3. Recommandations d'action
4. Risque financier
```

#### 3. **PoAiGeneratorService**
- **Fonction**: Génération automatique de BC
- **Input**: Historique d'achats + contexte
- **Output**: Liste de produits suggérés
- **Logique**:
  - Analyse les achats récurrents
  - Détecte les patterns
  - Suggère quantités optimales
  - Calcule les prix moyens

**Prompt**:
```
Analyse cet historique d'achats et génère un bon de commande optimisé:
- Historique: [données]
- Fournisseur: [nom]
- Période: [dates]

Retourne une liste de produits avec quantités suggérées.
```

#### 4. **SupplierAiInsightsService**
- **Fonction**: Insights sur la performance fournisseur
- **Input**: Données fournisseur + historique
- **Output**: Analyse complète
- **Insights**:
  - Score de fiabilité
  - Tendances
  - Risques identifiés
  - Recommandations d'amélioration
  - Prédictions

**Prompt**:
```
Analyse la performance de ce fournisseur:
- Nom: [nom]
- Score: [score]
- Historique: [données]
- Litiges: [nombre]
- Retards: [nombre]

Fournis:
1. Analyse de performance
2. Risques identifiés
3. Recommandations
4. Prédictions
```

#### 5. **SupplierRecommendationService**
- **Fonction**: Recommandations de fournisseurs
- **Input**: Critères de recherche
- **Output**: Liste de fournisseurs recommandés
- **Critères**:
  - Catégorie de produits
  - Budget
  - Délais
  - Localisation
  - Performance historique

#### 6. **PurchaseAiAssistantService**
- **Fonction**: Assistant conversationnel
- **Input**: Question en langage naturel
- **Output**: Réponse courte (< 100 chars)
- **Détection d'intention**:
  - invoice_status
  - supplier_performance
  - purchase_summary
  - dispute_info
  - general

**Prompt**:
```
Tu es un assistant pour le module Achats.
Réponds en MAXIMUM 100 caractères.

Question: [question]
Données: [données contextuelles]

Réponds de façon concise et précise.
```

#### 7. **DisputeResolutionService** (avec IA)
- **Fonction**: Suggestions de résolution de litiges
- **Input**: Détails du litige
- **Output**: Recommandations
- **Analyse**:
  - Gravité du litige
  - Historique similaire
  - Solutions possibles
  - Impact sur la relation fournisseur

---

## 📡 APIs et endpoints

### Base URL
```
/api/purchases
```

### Endpoints par contrôleur

#### Suppliers
```
GET    /suppliers                    # Liste paginée
POST   /suppliers                    # Créer
GET    /suppliers/:id                # Détails
PATCH  /suppliers/:id                # Modifier
DELETE /suppliers/:id                # Archiver (soft delete)
POST   /suppliers/:id/restore        # Restaurer
GET    /suppliers/:id/export-pdf     # Export PDF
```

#### Supplier POs
```
GET    /supplier-pos                 # Liste
POST   /supplier-pos                 # Créer
GET    /supplier-pos/:id             # Détails
PATCH  /supplier-pos/:id             # Modifier
DELETE /supplier-pos/:id             # Supprimer
POST   /supplier-pos/:id/send        # Envoyer au fournisseur
POST   /supplier-pos/:id/confirm     # Confirmer
POST   /supplier-pos/:id/cancel      # Annuler
POST   /supplier-pos/generate-with-ai # Générer avec IA
```

#### Goods Receipts
```
GET    /goods-receipts               # Liste
POST   /goods-receipts               # Créer
GET    /goods-receipts/:id           # Détails
DELETE /goods-receipts/:id           # Supprimer
```

#### Purchase Invoices
```
GET    /purchase-invoices            # Liste
POST   /purchase-invoices            # Créer
GET    /purchase-invoices/:id        # Détails
PATCH  /purchase-invoices/:id        # Modifier
DELETE /purchase-invoices/:id        # Supprimer
POST   /purchase-invoices/:id/approve # Approuver
POST   /purchase-invoices/:id/dispute # Créer litige
POST   /purchase-invoices/:id/resolve-dispute # Résoudre
```

#### Three-Way Matching
```
POST   /three-way-matching/match     # Lancer rapprochement
GET    /three-way-matching/:invoiceId # Résultat
POST   /three-way-matching/:invoiceId/ai-analysis # Analyse IA
```

#### Disputes
```
POST   /disputes                     # Créer litige
GET    /disputes/:invoiceId          # Détails
POST   /disputes/:invoiceId/responses # Ajouter réponse
PATCH  /disputes/:invoiceId/resolve  # Résoudre
```

#### Alerts
```
GET    /alerts                       # Liste
PATCH  /alerts/:id/read              # Marquer lu
PATCH  /alerts/:id/dismiss           # Ignorer
DELETE /alerts/:id                   # Supprimer
```

#### Supplier Scoring
```
GET    /supplier-scoring/:supplierId # Score détaillé
GET    /supplier-scoring/ranking     # Classement
GET    /supplier-scoring/:supplierId/ai-insights # Insights IA
GET    /supplier-scoring/recommendations # Recommandations
```

#### OCR
```
POST   /ocr/extract                  # Extraire données facture
```

#### AI Assistant
```
POST   /ai-assistant/chat            # Poser une question
```

#### Supplier Portal
```
POST   /supplier-portal/generate-link # Générer lien
GET    /supplier-portal/verify-token # Vérifier token
GET    /supplier-portal/purchase-orders # Liste BC
POST   /supplier-portal/purchase-orders/:id/confirm # Confirmer BC
GET    /supplier-portal/invoices     # Liste factures
```

#### Supplier Onboarding
```
POST   /supplier-onboarding/register # Inscription
GET    /supplier-onboarding/pending  # En attente
POST   /supplier-onboarding/:id/approve # Approuver
POST   /supplier-onboarding/:id/reject # Rejeter
```

---


## 🔄 Processus métier

### Processus complet d'achat

```
1. CRÉATION FOURNISSEUR
   ↓
2. CRÉATION BON DE COMMANDE
   - Statut: DRAFT
   - Ajout de lignes
   - Calcul automatique des montants
   ↓
3. ENVOI BC AU FOURNISSEUR
   - Statut: SENT
   - Email + PDF envoyé
   - Fournisseur peut confirmer via portail
   ↓
4. CONFIRMATION FOURNISSEUR
   - Statut: CONFIRMED
   - BC prêt pour réception
   ↓
5. RÉCEPTION MARCHANDISES
   - Création Bon de Réception (BR)
   - Saisie quantités reçues
   - Création mouvements de stock
   - Statut BC: PARTIALLY_RECEIVED ou RECEIVED
   ↓
6. RÉCEPTION FACTURE FOURNISSEUR
   - Création facture (manuelle ou OCR)
   - Lien avec BC
   - Calcul date d'échéance
   - Statut: PENDING
   ↓
7. RAPPROCHEMENT 3 VOIES
   - Comparaison BC / BR / Facture
   - Détection écarts
   - Analyse IA si écarts
   - Statut: MATCHED / PARTIAL_MATCH / MISMATCHED
   ↓
8a. SI ÉCARTS ACCEPTABLES
    - Approbation facture
    - Statut: APPROVED
    ↓
8b. SI ÉCARTS IMPORTANTS
    - Création litige
    - Statut: DISPUTED
    - Échanges avec fournisseur
    - Résolution
    ↓
9. PAIEMENT FACTURE
   - Via PaymentsModule
   - Mise à jour paid_amount
   - Statut: PAID
   ↓
10. CLÔTURE
    - BC complètement reçu et facturé
    - Facture payée
    - Mise à jour score fournisseur
```

### Workflow des statuts

#### Bon de commande (SupplierPO)
```
DRAFT → SENT → CONFIRMED → PARTIALLY_RECEIVED → RECEIVED
                    ↓
                CANCELLED
```

#### Facture (PurchaseInvoice)
```
PENDING → APPROVED → PAID
    ↓
DISPUTED → APPROVED → PAID
    ↓
CANCELLED
```

#### Rapprochement (ThreeWayMatch)
```
MATCHED         # Écarts < 2%
PARTIAL_MATCH   # Écarts 2-10%
MISMATCHED      # Écarts > 10%
```

---

## 🛠️ Technologies utilisées

### Backend

#### Framework
- **NestJS** - Framework Node.js
- **TypeScript** - Langage typé
- **TypeORM** - ORM pour PostgreSQL

#### Base de données
- **PostgreSQL** - Base de données relationnelle
- **JSONB** - Stockage de données flexibles

#### IA et ML
- **Google Gemini** (gemini-1.5-flash) - Tous les services IA
- **Tesseract.js** - OCR (reconnaissance de texte)

#### Emails
- **Nodemailer** - Envoi d'emails
- **Handlebars** - Templates d'emails

#### Fichiers
- **Multer** - Upload de fichiers
- **Sharp** - Traitement d'images
- **PDFKit** - Génération de PDF

#### Sécurité
- **JWT** - Authentification
- **bcrypt** - Hachage de mots de passe
- **class-validator** - Validation des données

#### Autres
- **@nestjs/schedule** - Tâches planifiées (cron)
- **@nestjs/axios** - Requêtes HTTP
- **date-fns** - Manipulation de dates

### Frontend

#### Framework
- **React** - Bibliothèque UI
- **TypeScript** - Langage typé
- **Vite** - Build tool

#### State Management
- **React Query** (TanStack Query) - Gestion des données serveur
- **Zustand** - State management local

#### UI
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Icônes
- **Headless UI** - Composants accessibles

#### Formulaires
- **React Hook Form** - Gestion de formulaires
- **Zod** - Validation de schémas

#### Autres
- **Axios** - Requêtes HTTP
- **date-fns** - Manipulation de dates
- **react-router-dom** - Routing

---


## ❓ Q&A - Questions fréquentes

### Questions générales

**Q: Qu'est-ce que le module Purchases ?**
R: C'est un système complet de gestion des achats qui couvre tout le cycle : fournisseurs, bons de commande, réceptions, factures, paiements, avec de l'IA intégrée.

**Q: Quelles sont les principales fonctionnalités ?**
R: Gestion fournisseurs, BC, réceptions, factures, rapprochement 3 voies, litiges, scoring fournisseurs, OCR, assistant IA, portail fournisseur.

**Q: Le module est-il multi-tenant ?**
R: Oui, chaque entreprise (business_id) a ses propres données isolées.

---

### Fournisseurs

**Q: Comment créer un fournisseur ?**
R: Via SuppliersPage → "Nouveau fournisseur" → Remplir le formulaire → Enregistrer.

**Q: Peut-on archiver un fournisseur ?**
R: Oui, c'est un soft delete. Le fournisseur reste en base mais is_active = false. On peut le restaurer.

**Q: Comment inviter un fournisseur ?**
R: Via SupplierInviteModal → Saisir email → Un lien unique est envoyé avec un token JWT valide 72h.

**Q: Qu'est-ce que le score fournisseur ?**
R: Un score 0-100 calculé automatiquement basé sur : qualité livraisons (30%), respect délais (25%), conformité factures (25%), taux litiges (20%).

---

### Bons de commande

**Q: Comment créer un BC ?**
R: SupplierPOsPage → "Nouveau BC" → Sélectionner fournisseur → Ajouter lignes → Enregistrer.

**Q: Peut-on générer un BC avec l'IA ?**
R: Oui, via AiPOGeneratorModal. L'IA analyse l'historique et suggère des produits/quantités optimales.

**Q: Comment envoyer un BC au fournisseur ?**
R: Cliquer "Envoyer" sur un BC en statut DRAFT. Un email avec PDF est envoyé automatiquement.

**Q: Qu'est-ce que le timbre fiscal ?**
R: En Tunisie, c'est une taxe fixe de 1,000 DT ajoutée à chaque BC/facture.

**Q: Comment annuler un BC ?**
R: Cliquer "Annuler" sur un BC. Statut passe à CANCELLED. Impossible si déjà reçu ou facturé.

---

### Réceptions

**Q: Comment créer un bon de réception ?**
R: Depuis un BC confirmé → "Créer réception" → Saisir quantités reçues → Enregistrer.

**Q: Peut-on faire des réceptions partielles ?**
R: Oui, on peut recevoir moins que commandé. Le BC passe en PARTIALLY_RECEIVED. On peut créer plusieurs BR pour un même BC.

**Q: Que se passe-t-il au niveau du stock ?**
R: Un StockMovement (type: PURCHASE_RECEIPT) est créé automatiquement pour chaque ligne reçue, mettant à jour le stock.

**Q: Qui peut créer une réception ?**
R: Tout utilisateur authentifié. Le champ received_by enregistre l'utilisateur.

---

### Factures

**Q: Comment créer une facture ?**
R: PurchaseInvoicesPage → "Nouvelle facture" → Sélectionner fournisseur → Saisir montants → Enregistrer.

**Q: Peut-on créer une facture depuis un BC ?**
R: Oui, depuis un BC → "Créer facture". Les données sont pré-remplies.

**Q: Comment fonctionne l'OCR ?**
R: Upload scan facture → Tesseract extrait le texte → Gemini analyse et extrait les données structurées → Formulaire pré-rempli.

**Q: Quel est le score de confiance OCR ?**
R: Un score 0-100% indiquant la fiabilité de l'extraction. < 70% = vérification manuelle recommandée.

**Q: Comment calculer la date d'échéance ?**
R: due_date = invoice_date + supplier.payment_terms jours. Exemple : facture du 01/01 + 30 jours = échéance 31/01.

**Q: Qu'est-ce qu'une facture en litige ?**
R: Une facture avec des erreurs/problèmes. Statut = DISPUTED. On peut échanger avec le fournisseur pour résoudre.

---

### Rapprochement 3 voies

**Q: Qu'est-ce que le rapprochement 3 voies ?**
R: Vérification de cohérence entre BC (commandé), BR (reçu), Facture (à payer). Détecte les écarts de quantité/prix/montant.

**Q: Quand est-il effectué ?**
R: Automatiquement lors de la création d'une facture liée à un BC.

**Q: Quels sont les seuils de tolérance ?**
R: MATCHED (< 2%), PARTIAL_MATCH (2-10%), MISMATCHED (> 10%).

**Q: Que fait l'IA dans le rapprochement ?**
R: Elle analyse les écarts, identifie les causes probables, évalue le risque financier, et recommande des actions (accepter/contester/corriger).

**Q: Peut-on forcer l'approbation malgré des écarts ?**
R: Oui, l'utilisateur peut approuver manuellement après avoir vérifié. L'IA donne juste des recommandations.

---

### Litiges

**Q: Comment créer un litige ?**
R: Depuis une facture → "Créer litige" → Saisir la raison → Enregistrer. Statut facture → DISPUTED.

**Q: Peut-on joindre des documents ?**
R: Oui, dans DisputeResponsesPanel, on peut ajouter des pièces justificatives (photos, PDF, etc.).

**Q: Comment résoudre un litige ?**
R: Après échanges, cliquer "Résoudre" → Choisir l'action (corriger facture, annuler, accepter) → Statut facture mis à jour.

**Q: Le fournisseur est-il notifié ?**
R: Oui, un email peut être envoyé automatiquement lors de la création du litige.

---

### Alertes

**Q: Quels types d'alertes existent ?**
R: Facture en retard, échéance proche, écart rapprochement, nouveau litige, BC en attente, baisse performance fournisseur.

**Q: Comment sont-elles créées ?**
R: Automatiquement par le système lors de certains événements (cron jobs, triggers).

**Q: Peut-on les personnaliser ?**
R: Oui, dans PurchaseAlertsService, on peut configurer les seuils et types d'alertes.

**Q: Comment les marquer comme lues ?**
R: Cliquer sur l'alerte dans AlertsPanel → Automatiquement marquée comme lue.

---

### IA et automatisation

**Q: Quelle IA est utilisée ?**
R: Google Gemini (modèle gemini-1.5-flash) pour tous les services IA.

**Q: Quels sont les services IA disponibles ?**
R: OCR enrichi, rapprochement IA, génération BC, insights fournisseurs, recommandations, assistant conversationnel, résolution litiges.

**Q: L'IA peut-elle se tromper ?**
R: Oui, c'est pourquoi on affiche toujours un score de confiance et on permet la vérification/correction manuelle.

**Q: Comment améliorer la précision de l'OCR ?**
R: Utiliser des scans de bonne qualité, bien éclairés, sans plis. Format PDF préférable aux photos.

**Q: L'assistant IA a accès à quelles données ?**
R: Toutes les données du module Purchases de l'entreprise : fournisseurs, BC, factures, litiges, paiements.

---

### Portail fournisseur

**Q: Comment un fournisseur accède au portail ?**
R: Via un lien unique envoyé par email contenant un token JWT. Pas de mot de passe requis.

**Q: Combien de temps le lien est-il valide ?**
R: 72 heures par défaut (configurable).

**Q: Que peut faire un fournisseur sur le portail ?**
R: Consulter ses BC, confirmer les BC, consulter ses factures, répondre aux litiges.

**Q: Le fournisseur peut-il modifier les BC ?**
R: Non, il peut seulement les consulter et les confirmer.

---

### Paiements

**Q: Comment payer une facture ?**
R: Via le module Payments (SupplierPaymentsPage). Le module Purchases met à jour automatiquement paid_amount.

**Q: Peut-on payer partiellement ?**
R: Oui, paid_amount est incrémenté à chaque paiement. Quand paid_amount = net_amount, statut → PAID.

**Q: Que se passe-t-il si on paie trop ?**
R: Le système accepte mais remaining_amount devient négatif (crédit fournisseur).

---

### Performance et optimisation

**Q: Comment sont gérées les performances avec beaucoup de données ?**
R: Pagination (10-20 items/page), index sur les colonnes fréquemment recherchées, eager loading contrôlé.

**Q: Les calculs sont-ils en temps réel ?**
R: Oui, les montants sont recalculés à chaque modification. Les scores fournisseurs sont mis à jour périodiquement (cron).

**Q: Peut-on exporter les données ?**
R: Oui, export PDF pour les relevés fournisseurs. Export Excel/CSV peut être ajouté.

---

### Sécurité

**Q: Les données sont-elles sécurisées ?**
R: Oui, multi-tenant strict (business_id), authentification JWT, validation des données, protection CSRF.

**Q: Qui peut accéder au module ?**
R: Utilisateurs authentifiés de l'entreprise. Permissions par rôle (à implémenter si besoin).

**Q: Les fichiers uploadés sont-ils sécurisés ?**
R: Oui, validation du type de fichier, taille limitée, stockage sécurisé, URLs signées.

---

### Intégration

**Q: Comment intégrer avec d'autres modules ?**
R: Via les exports du module (services, repositories). Exemple : PaymentsModule importe PurchasesModule.

**Q: Peut-on utiliser une autre IA que Gemini ?**
R: Oui, il suffit de modifier les services IA pour utiliser OpenAI, Claude, etc.

**Q: Peut-on connecter un ERP externe ?**
R: Oui, via les APIs REST. Toutes les fonctionnalités sont accessibles via API.

---

### Troubleshooting

**Q: L'OCR ne fonctionne pas bien**
R: Vérifier la qualité du scan, essayer avec un PDF, vérifier que Tesseract est installé, augmenter le timeout.

**Q: Les emails ne sont pas envoyés**
R: Vérifier la configuration SMTP dans .env, vérifier les logs, tester avec un service comme Mailtrap.

**Q: Les montants ne sont pas corrects**
R: Vérifier les taux de TVA, le timbre fiscal (1 DT), les arrondis (3 décimales).

**Q: Le rapprochement échoue**
R: Vérifier que la facture est bien liée à un BC, que le BC a des réceptions, que les données sont cohérentes.

**Q: L'IA ne répond pas**
R: Vérifier la clé API Gemini dans .env, vérifier les quotas, vérifier les logs d'erreur.

---

## 📝 Notes importantes

### Conventions de nommage
- **Entités**: PascalCase (Supplier, SupplierPO)
- **Tables**: snake_case (suppliers, supplier_pos)
- **Colonnes**: snake_case (business_id, net_amount)
- **Services**: PascalCase + Service (SuppliersService)
- **Contrôleurs**: PascalCase + Controller (SuppliersController)

### Formats de données
- **Dates**: ISO 8601 (YYYY-MM-DD)
- **Timestamps**: ISO 8601 avec timezone (timestamptz)
- **Montants**: Decimal(15,3) - 3 décimales pour les dinars tunisiens
- **UUIDs**: v4

### Règles métier
- Timbre fiscal = 1,000 DT (Tunisie)
- Délai paiement par défaut = 30 jours
- Seuils rapprochement: < 2% OK, 2-10% Warning, > 10% Error
- Token portail fournisseur = 72h de validité

### Bonnes pratiques
- Toujours valider les données côté serveur
- Utiliser les transactions pour les opérations critiques
- Logger les erreurs et actions importantes
- Tester les calculs de montants
- Vérifier les permissions avant les actions sensibles

---

## 🚀 Évolutions futures possibles

1. **Gestion des contrats fournisseurs**
   - Contrats cadres
   - Renouvellements automatiques
   - Alertes d'expiration

2. **Prévisions et budgets**
   - Prévisions d'achats par IA
   - Suivi budgétaire
   - Alertes de dépassement

3. **Catalogue produits**
   - Catalogue centralisé
   - Comparaison de prix
   - Historique de prix

4. **Workflow d'approbation**
   - Approbation multi-niveaux
   - Règles d'approbation automatique
   - Délégations

5. **Analytics avancés**
   - Dashboards personnalisés
   - Rapports automatiques
   - KPIs en temps réel

6. **Intégrations**
   - ERP (SAP, Odoo, etc.)
   - Comptabilité (Sage, QuickBooks)
   - E-procurement

7. **Mobile**
   - Application mobile
   - Scan de factures mobile
   - Notifications push

---

## 📞 Support

Pour toute question ou problème :
- Consulter cette documentation
- Vérifier les logs (backend et frontend)
- Contacter l'équipe de développement

---

**Dernière mise à jour**: Avril 2026
**Version du module**: 1.0.0
**Auteur**: Équipe PI-DEV

