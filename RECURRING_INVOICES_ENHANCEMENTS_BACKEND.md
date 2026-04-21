# Factures Récurrentes - Améliorations Backend

## Modifications effectuées

### 1. Migration (1775300000000-AddRecurringInvoiceEnhancements.ts)
- ✅ Ajout colonne `status` (ACTIVE, PAUSED, INACTIVE)
- ✅ Migration données existantes (is_active → status)
- ✅ Ajout colonnes `discount_type` et `discount_value`
- ✅ Ajout FK `recurring_invoice_id` sur table invoices
- ✅ Index pour performances

### 2. Entité RecurringInvoice
- ✅ Enum `RecurringInvoiceStatus` (ACTIVE, PAUSED, INACTIVE)
- ✅ Enum `DiscountType` (PERCENTAGE, FIXED)
- ✅ Champs `status`, `discount_type`, `discount_value`
- ✅ Hook `@BeforeUpdate` pour synchroniser is_active avec status

### 3. Entité Invoice
- ✅ Champ `recurring_invoice_id` (nullable)
- ✅ Relation ManyToOne vers RecurringInvoice

### 4. DTOs
- ✅ CreateRecurringInvoiceDto: ajout discount_type et discount_value avec validation
- ✅ QueryRecurringInvoicesDto: status, frequency, search, page, limit
- ✅ BulkUpdateRecurringInvoicesDto: ids[], action (activate/pause/delete)

### 5. Service RecurringInvoicesService
- ✅ Validation remises dans create()
- ✅ findAll() avec filtres avancés (status, frequency, search)
- ✅ pause() et resume() pour gérer le statut PAUSED
- ✅ getStats() - statistiques complètes avec revenu mensuel prévisionnel
- ✅ bulkUpdate() - actions en masse
- ✅ getInvoiceHistory() - historique des factures générées
- ✅ applyDiscount() - calcul des remises
- ✅ normalizeToMonthly() - normalisation par fréquence

### 6. Contrôleur RecurringInvoicesController
- ✅ GET /stats - statistiques
- ✅ POST /:id/pause - mettre en pause
- ✅ POST /:id/resume - reprendre
- ✅ PATCH /bulk - actions en masse
- ✅ GET /:id/invoices - historique

### 7. CRON RecurringInvoiceCronService
- ✅ Filtre sur status = ACTIVE (ignore PAUSED)
- ✅ Application des remises lors de la génération
- ✅ Ajout recurring_invoice_id sur les factures générées
- ✅ Logs détaillés (remises appliquées, erreurs)

## Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/businesses/:id/recurring-invoices` | Liste avec filtres |
| GET | `/businesses/:id/recurring-invoices/stats` | Statistiques |
| GET | `/businesses/:id/recurring-invoices/:id` | Détail |
| POST | `/businesses/:id/recurring-invoices` | Créer |
| PATCH | `/businesses/:id/recurring-invoices/:id` | Modifier |
| DELETE | `/businesses/:id/recurring-invoices/:id` | Supprimer |
| POST | `/businesses/:id/recurring-invoices/:id/activate` | Activer |
| POST | `/businesses/:id/recurring-invoices/:id/pause` | Mettre en pause |
| POST | `/businesses/:id/recurring-invoices/:id/resume` | Reprendre |
| POST | `/businesses/:id/recurring-invoices/:id/deactivate` | Désactiver |
| PATCH | `/businesses/:id/recurring-invoices/bulk` | Actions en masse |
| GET | `/businesses/:id/recurring-invoices/:id/invoices` | Historique |

## Prochaines étapes (Frontend)

1. ✅ Prévisualisation dates (FAIT)
2. Mise à jour types TypeScript
3. Mise à jour API client
4. Mise à jour hooks React Query
5. Stats Banner component
6. Filtres avancés + recherche
7. Actions en masse (bulk)
8. Drawer historique
9. Gestion des remises dans le modal
10. Mise à jour de la page principale

## Tests recommandés

- [ ] Migration sur base de données de test
- [ ] Création avec remises (pourcentage et fixe)
- [ ] Pause/Resume d'une facture récurrente
- [ ] Actions en masse (activer, pause, supprimer)
- [ ] Génération CRON avec remises
- [ ] Statistiques (revenu mensuel prévisionnel)
- [ ] Historique des factures générées
- [ ] Filtres avancés (status, frequency, search)
