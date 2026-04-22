# Documentation - Factures Récurrentes

## Vue d'ensemble

Le système de factures récurrentes permet de générer automatiquement des factures à intervalles réguliers pour les abonnements et services récurrents. Les factures sont créées automatiquement via un job CRON qui s'exécute quotidiennement.

---

## Architecture

### Backend (NestJS)

#### Entités

**RecurringInvoice** (`src/sales/entities/recurring-invoice.entity.ts`)
```typescript
- id: UUID
- business_id: UUID
- client_id: UUID
- description: string (100 caractères max)
- frequency: enum (DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
- start_date: date
- end_date: date (nullable)
- next_invoice_date: date
- last_generated_date: date (nullable)
- amount: decimal(10,3)
- tax_rate: decimal(5,2) - défaut 19%
- notes: text (nullable)
- is_active: boolean - défaut true
- invoices_generated: int - défaut 0
- created_at: timestamp
- updated_at: timestamp
```

**Relations:**
- `business`: ManyToOne → Business
- `client`: ManyToOne → Client

#### Fréquences disponibles

```typescript
enum RecurringFrequency {
  DAILY = 'DAILY',           // Quotidien
  WEEKLY = 'WEEKLY',         // Hebdomadaire
  MONTHLY = 'MONTHLY',       // Mensuel
  QUARTERLY = 'QUARTERLY',   // Trimestriel
  YEARLY = 'YEARLY'          // Annuel
}
```

#### DTOs

**CreateRecurringInvoiceDto**
```typescript
{
  client_id: string (UUID, requis)
  description: string (requis)
  frequency: RecurringFrequency (requis)
  start_date: Date (requis)
  end_date?: Date (optionnel)
  amount: number (requis)
  tax_rate?: number (optionnel, défaut 19)
  notes?: string (optionnel)
  is_active?: boolean (optionnel, défaut true)
}
```

**UpdateRecurringInvoiceDto**
- Tous les champs de CreateRecurringInvoiceDto en optionnel

#### Endpoints API

**Base URL:** `/businesses/:businessId/recurring-invoices`

| Méthode | Endpoint | Rôles autorisés | Description |
|---------|----------|-----------------|-------------|
| POST | `/` | OWNER, ADMIN, ACCOUNTANT | Créer une facture récurrente |
| GET | `/` | OWNER, ADMIN, ACCOUNTANT, MEMBER | Lister les factures récurrentes |
| GET | `/:id` | OWNER, ADMIN, ACCOUNTANT, MEMBER | Obtenir une facture récurrente |
| PATCH | `/:id` | OWNER, ADMIN, ACCOUNTANT | Modifier une facture récurrente |
| DELETE | `/:id` | OWNER, ADMIN | Supprimer une facture récurrente |
| POST | `/:id/activate` | OWNER, ADMIN, ACCOUNTANT | Activer une facture récurrente |
| POST | `/:id/deactivate` | OWNER, ADMIN, ACCOUNTANT | Désactiver une facture récurrente |

#### Query Parameters (GET /)

```typescript
{
  is_active?: boolean    // Filtrer par statut actif/inactif
  page?: number         // Numéro de page (défaut: 1)
  limit?: number        // Éléments par page (défaut: 20)
}
```

#### Réponse paginée

```typescript
{
  data: RecurringInvoice[]
  total: number
  page: number
  limit: number
  total_pages: number
}
```

#### Service - RecurringInvoicesService

**Méthodes principales:**

- `create(businessId, dto)` - Crée une facture récurrente
- `findAll(businessId, query)` - Liste avec pagination et filtres
- `findOne(businessId, id)` - Récupère une facture récurrente
- `update(businessId, id, dto)` - Met à jour une facture récurrente
- `remove(businessId, id)` - Supprime une facture récurrente
- `activate(businessId, id)` - Active une facture récurrente
- `deactivate(businessId, id)` - Désactive une facture récurrente
- `calculateNextDate(currentDate, frequency)` - Calcule la prochaine date de génération

**Logique de calcul de la prochaine date:**

```typescript
switch (frequency) {
  case DAILY: next.setDate(next.getDate() + 1)
  case WEEKLY: next.setDate(next.getDate() + 7)
  case MONTHLY: next.setMonth(next.getMonth() + 1)
  case QUARTERLY: next.setMonth(next.getMonth() + 3)
  case YEARLY: next.setFullYear(next.getFullYear() + 1)
}
```

#### Service CRON - RecurringInvoiceCronService

**Planification:** Tous les jours à 1h du matin (`@Cron(CronExpression.EVERY_DAY_AT_1AM)`)

**Processus de génération:**

1. Récupère toutes les factures récurrentes actives dont `next_invoice_date <= aujourd'hui`
2. Pour chaque facture récurrente:
   - Vérifie si `end_date` est dépassée → désactive si oui
   - Génère un numéro de facture unique (format: `INV-YYYY-XXXXX`)
   - Calcule les montants:
     - `subtotal_ht` = montant de la facture récurrente
     - `tax_amount` = subtotal_ht × (tax_rate / 100)
     - `timbre_fiscal` = 1.000 DT
     - `total_ttc` = subtotal_ht + tax_amount
     - `net_amount` = total_ttc + timbre_fiscal
   - Crée une facture avec statut DRAFT
   - Crée un item de facture avec la description
   - Met à jour la facture récurrente:
     - `last_generated_date` = aujourd'hui
     - `next_invoice_date` = calculée selon la fréquence
     - `invoices_generated` += 1
3. Toutes les opérations sont effectuées dans une transaction

**Gestion des erreurs:**
- Chaque facture récurrente est traitée indépendamment
- Les erreurs sont loggées mais n'interrompent pas le traitement des autres

---

### Frontend (React + TypeScript)

#### Types

**RecurringInvoice** (`src/types/recurring-invoice.ts`)
```typescript
interface RecurringInvoice {
  id: string
  business_id: string
  client_id: string
  client: any
  description: string
  frequency: RecurringFrequency
  start_date: string
  end_date: string | null
  next_invoice_date: string
  last_generated_date: string | null
  amount: number
  tax_rate: number
  notes: string | null
  is_active: boolean
  invoices_generated: number
  created_at: string
  updated_at: string
}
```

**Labels de fréquence:**
```typescript
RECURRING_FREQUENCY_LABELS = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  YEARLY: 'Annuel'
}
```

#### API Client (`src/api/recurring-invoices.ts`)

**Fonctions disponibles:**

```typescript
getRecurringInvoices(businessId, params?)
getRecurringInvoice(businessId, id)
createRecurringInvoice(businessId, dto)
updateRecurringInvoice(businessId, id, dto)
deleteRecurringInvoice(businessId, id)
activateRecurringInvoice(businessId, id)
deactivateRecurringInvoice(businessId, id)
```

#### Hooks React Query (`src/hooks/useRecurringInvoices.ts`)

**Hooks de requête:**
- `useRecurringInvoices(businessId, params)` - Liste avec cache
- `useRecurringInvoice(businessId, id)` - Détail avec cache

**Hooks de mutation:**
- `useCreateRecurringInvoice(businessId)` - Création avec invalidation du cache
- `useUpdateRecurringInvoice(businessId, id)` - Modification avec invalidation
- `useDeleteRecurringInvoice(businessId)` - Suppression avec invalidation
- `useActivateRecurringInvoice(businessId)` - Activation avec invalidation
- `useDeactivateRecurringInvoice(businessId)` - Désactivation avec invalidation

**Gestion des notifications:**
- Succès: Toast de confirmation
- Erreur: Toast avec message d'erreur détaillé

#### Composants

**RecurringInvoiceModal** (`src/components/sales/RecurringInvoiceModal.tsx`)

Formulaire de création/modification avec:
- Sélection du client (dropdown)
- Description de la facture
- Fréquence de récurrence (dropdown)
- Montant HT
- Dates de début et fin
- Taux de TVA (0%, 7%, 13%, 19%)
- Notes optionnelles
- Calcul automatique des totaux:
  - Montant HT
  - TVA
  - Timbre fiscal (1.000 DT)
  - Total TTC

**Validation:**
- Client requis
- Description requise
- Fréquence requise
- Date de début requise
- Montant requis

**RecurringInvoicesPage** (`src/pages/backoffice/sales/RecurringInvoicesPage.tsx`)

Page de gestion avec:
- Liste paginée des factures récurrentes
- Filtres: Toutes / Actives / Inactives
- Colonnes affichées:
  - Numéro séquentiel
  - Client
  - Description + notes
  - Fréquence (badge coloré)
  - Montant HT
  - Prochaine facture (avec icône calendrier)
  - Nombre de factures générées (badge)
  - Statut (Active/Inactive)
  - Actions (Modifier, Activer/Désactiver, Supprimer)
- Pagination complète (Première, Précédent, Pages, Suivant, Dernière)
- Compteur de résultats

**Actions disponibles:**
- Créer une nouvelle facture récurrente
- Modifier une facture existante
- Activer/Désactiver une facture
- Supprimer une facture

---

## Flux de travail

### 1. Création d'une facture récurrente

```
Utilisateur → Formulaire → Validation → API POST
→ Création en base → next_invoice_date = start_date
→ Confirmation → Rafraîchissement de la liste
```

### 2. Génération automatique (CRON)

```
1h du matin → Recherche factures actives dues
→ Pour chaque facture:
   - Vérifier end_date
   - Générer numéro facture
   - Calculer montants
   - Créer facture (DRAFT)
   - Créer item facture
   - Mettre à jour facture récurrente
   - Calculer next_invoice_date
→ Log résultats
```

### 3. Activation/Désactivation

```
Utilisateur → Clic bouton → API POST activate/deactivate
→ Mise à jour is_active → Confirmation
→ Rafraîchissement de la liste
```

---

## Calculs financiers

### Montants de la facture générée

```
subtotal_ht = amount (de la facture récurrente)
tax_amount = subtotal_ht × (tax_rate / 100)
timbre_fiscal = 1.000 DT (fixe)
total_ttc = subtotal_ht + tax_amount
net_amount = total_ttc + timbre_fiscal
```

### Exemple avec montant 100 DT et TVA 19%

```
Montant HT: 100.000 DT
TVA (19%): 19.000 DT
Timbre fiscal: 1.000 DT
Total TTC: 120.000 DT
```

---

## Règles métier

1. **Activation automatique:** Une facture récurrente est active par défaut à la création
2. **Désactivation automatique:** Si `end_date` est atteinte, la facture est désactivée automatiquement
3. **Statut des factures générées:** Toutes les factures générées sont en statut DRAFT
4. **Numérotation:** Format `INV-YYYY-XXXXX` avec séquence par année et par business
5. **Échéance:** Les factures générées ont une échéance de 30 jours par défaut
6. **Item unique:** Chaque facture générée contient un seul item avec la description de la récurrence
7. **Récurrence illimitée:** Si `end_date` est null, la facture continue indéfiniment jusqu'à désactivation manuelle

---

## Permissions

| Action | OWNER | ADMIN | ACCOUNTANT | MEMBER |
|--------|-------|-------|------------|--------|
| Créer | ✅ | ✅ | ✅ | ❌ |
| Lister | ✅ | ✅ | ✅ | ✅ |
| Voir détail | ✅ | ✅ | ✅ | ✅ |
| Modifier | ✅ | ✅ | ✅ | ❌ |
| Supprimer | ✅ | ✅ | ❌ | ❌ |
| Activer/Désactiver | ✅ | ✅ | ✅ | ❌ |

---

## Monitoring et logs

### Logs CRON

Le service CRON génère des logs pour:
- Démarrage du processus
- Nombre de factures récurrentes trouvées
- Chaque facture générée avec succès
- Chaque facture désactivée (end_date atteinte)
- Erreurs de génération (sans interrompre le processus)
- Fin du processus

### Exemple de logs

```
[RecurringInvoiceCronService] Starting recurring invoice generation...
[RecurringInvoiceCronService] Found 5 recurring invoices to generate
[RecurringInvoiceCronService] Generated invoice INV-2026-00123 from recurring abc-123
[RecurringInvoiceCronService] Deactivated recurring invoice xyz-789 - end date reached
[RecurringInvoiceCronService] Recurring invoice generation completed
```

---

## Améliorations futures possibles

1. **Notifications:** Envoyer un email au client lors de la génération
2. **Prévisualisation:** Voir les prochaines dates de génération
3. **Historique:** Liste des factures générées par récurrence
4. **Templates:** Factures récurrentes avec plusieurs items
5. **Remises:** Support des remises récurrentes
6. **Devises:** Support multi-devises
7. **Webhooks:** Notification externe lors de la génération
8. **Rapports:** Statistiques sur les factures récurrentes
9. **Pause temporaire:** Suspendre sans désactiver
10. **Modification en masse:** Mettre à jour plusieurs factures récurrentes

---

## Dépendances

### Backend
- `@nestjs/common`
- `@nestjs/typeorm`
- `@nestjs/schedule` (pour le CRON)
- `typeorm`
- `class-validator`
- `class-transformer`

### Frontend
- `react`
- `react-hook-form`
- `@tanstack/react-query`
- `axios`
- `lucide-react` (icônes)

---

## Base de données

### Table: recurring_invoices

```sql
CREATE TABLE recurring_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id),
  client_id UUID REFERENCES clients(id),
  description VARCHAR(100),
  frequency VARCHAR(20) CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
  start_date DATE,
  end_date DATE,
  next_invoice_date DATE,
  last_generated_date DATE,
  amount DECIMAL(10,3),
  tax_rate DECIMAL(5,2) DEFAULT 19,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  invoices_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recurring_invoices_business ON recurring_invoices(business_id);
CREATE INDEX idx_recurring_invoices_client ON recurring_invoices(client_id);
CREATE INDEX idx_recurring_invoices_active_next ON recurring_invoices(is_active, next_invoice_date);
```

---

## Tests recommandés

### Backend
1. Création d'une facture récurrente
2. Modification d'une facture récurrente
3. Activation/Désactivation
4. Suppression
5. Génération CRON avec différentes fréquences
6. Désactivation automatique à end_date
7. Calcul des montants
8. Génération du numéro de facture
9. Gestion des erreurs

### Frontend
1. Affichage de la liste
2. Filtres (actives/inactives)
3. Pagination
4. Création via formulaire
5. Modification via formulaire
6. Validation des champs
7. Calcul des totaux en temps réel
8. Actions (activer/désactiver/supprimer)
9. Gestion des erreurs API

---

## Support et maintenance

Pour toute question ou problème:
1. Vérifier les logs du service CRON
2. Vérifier les données en base (next_invoice_date, is_active)
3. Vérifier les permissions utilisateur
4. Consulter les logs d'erreur API

**Date de dernière mise à jour:** Avril 2026
