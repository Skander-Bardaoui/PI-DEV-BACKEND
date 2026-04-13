# Workflow Visuel - Gestion des Litiges

## 🎯 Vue d'ensemble du Processus

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DÉTECTION AUTOMATIQUE DU LITIGE                  │
│                                                                     │
│  Rapprochement 3-voies (BC + BL + Facture)                        │
│  ↓                                                                 │
│  Écart détecté → Statut: DISPUTED                                 │
│  ↓                                                                 │
│  Notification Business Owner                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   PAGE: GESTION DES LITIGES                         │
│                   Route: /app/purchases/disputes                    │
│                                                                     │
│  📋 Liste des factures en litige                                   │
│  🔍 Filtres par catégorie                                          │
│  📊 Statistiques (jours en litige, montants)                       │
│  ⚡ Actions rapides: Résoudre | Contacter                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    [Clic: Résoudre le litige]
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   MODAL: RÉSOLUTION DE LITIGE                       │
│                                                                     │
│  📄 Informations détaillées:                                       │
│     • Numéro facture, fournisseur                                  │
│     • Montants (facturé vs attendu)                                │
│     • Écart (montant + %)                                          │
│     • Catégorie et jours en litige                                 │
│                                                                     │
│  🎯 Actions suggérées (par priorité):                              │
│     🔴 Action prioritaire haute                                     │
│     🟡 Action prioritaire moyenne                                   │
│     🟢 Action prioritaire basse                                     │
│                                                                     │
│  📝 Formulaire de résolution:                                      │
│     • Sélection de l'action                                        │
│     • Champs spécifiques (montants, notes)                         │
│     • Option: Notifier le fournisseur                              │
│                                                                     │
│  ✅ Bouton: Confirmer la résolution                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    [Sélection de l'action]
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ↓                                           ↓
┌──────────────────┐                    ┌──────────────────┐
│  ACTIONS SANS    │                    │  ACTIONS AVEC    │
│  EMAIL           │                    │  EMAIL           │
└──────────────────┘                    └──────────────────┘
        │                                           │
        ↓                                           ↓
┌──────────────────┐                    ┌──────────────────┐
│ • APPROVE_AS_IS  │                    │ • CONTACT_       │
│   → APPROVED     │                    │   SUPPLIER       │
│                  │                    │   → Email envoyé │
│ • CORRECT_       │                    │                  │
│   AMOUNTS        │                    │ • REQUEST_       │
│   → APPROVED     │                    │   CREDIT_NOTE    │
│                  │                    │   → Email envoyé │
│ • WAIT_FOR_      │                    │                  │
│   DELIVERY       │                    │ • REQUEST_       │
│   → DISPUTED     │                    │   CORRECTED_     │
│                  │                    │   INVOICE        │
│ • REJECT_        │                    │   → Email envoyé │
│   INVOICE        │                    │                  │
│   → PENDING      │                    │ • REJECT_        │
└──────────────────┘                    │   INVOICE        │
                                        │   (avec notif)   │
                                        └──────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      RÉSOLUTION CONFIRMÉE                           │
│                                                                     │
│  ✅ Statut mis à jour                                              │
│  📧 Email envoyé (si demandé)                                      │
│  📝 Notes ajoutées à l'historique                                  │
│  🔄 Facture retourne dans le workflow normal                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Catégories de Litiges et Actions Suggérées

### 1. PRICE_DISCREPANCY (Écart de Prix)

```
Détection: Montant facturé ≠ Montant BC
         ↓
┌─────────────────────────────────────┐
│ Actions suggérées:                  │
│                                     │
│ 🔴 REQUEST_CREDIT_NOTE              │
│    Si: Montant facturé > Attendu    │
│    Délai: 3-5 jours                 │
│                                     │
│ 🔴 CONTACT_SUPPLIER                 │
│    Pour: Explication de l'écart     │
│    Délai: 1-2 jours                 │
└─────────────────────────────────────┘
```

### 2. QUANTITY_MISMATCH (Écart de Quantité)

```
Détection: Quantité facturée ≠ Quantité BC
         ↓
┌─────────────────────────────────────┐
│ Actions suggérées:                  │
│                                     │
│ 🔴 REQUEST_CORRECTED_INVOICE        │
│    Pour: Nouvelle facture correcte  │
│    Délai: 5-7 jours                 │
│                                     │
│ 🟡 CORRECT_AMOUNTS                  │
│    Pour: Correction système         │
│    Délai: Immédiat                  │
└─────────────────────────────────────┘
```

### 3. PARTIAL_DELIVERY (Livraison Partielle)

```
Détection: Quantité reçue < Quantité facturée
         ↓
┌─────────────────────────────────────┐
│ Actions suggérées:                  │
│                                     │
│ 🟡 WAIT_FOR_DELIVERY                │
│    Pour: Attendre livraison complète│
│    Délai: 2-3 jours                 │
│                                     │
│ 🟢 APPROVE_AS_IS                    │
│    Si: Livraison partielle OK       │
│    Délai: Immédiat                  │
└─────────────────────────────────────┘
```

### 4. CALCULATION_ERROR (Erreur de Calcul)

```
Détection: Erreur TVA, totaux, etc.
         ↓
┌─────────────────────────────────────┐
│ Actions suggérées:                  │
│                                     │
│ 🔴 CORRECT_AMOUNTS                  │
│    Pour: Correction immédiate       │
│    Délai: Immédiat                  │
│                                     │
│ 🟡 REQUEST_CORRECTED_INVOICE        │
│    Pour: Demande au fournisseur     │
│    Délai: 1-2 jours                 │
└─────────────────────────────────────┘
```

### 5. DUPLICATE_INVOICE (Facture en Double)

```
Détection: Même numéro de facture déjà traité
         ↓
┌─────────────────────────────────────┐
│ Action suggérée:                    │
│                                     │
│ 🔴 REJECT_INVOICE                   │
│    Pour: Rejet du doublon           │
│    Délai: Immédiat                  │
└─────────────────────────────────────┘
```

---

## 🔄 Flux de Communication avec le Fournisseur

### Scénario: Demande de Clarification

```
Business Owner                    Système                    Fournisseur
      │                              │                            │
      │ 1. Sélectionne              │                            │
      │    CONTACT_SUPPLIER          │                            │
      │─────────────────────────────>│                            │
      │                              │                            │
      │                              │ 2. Génère email            │
      │                              │    de clarification        │
      │                              │                            │
      │                              │ 3. Envoie email            │
      │                              │───────────────────────────>│
      │                              │                            │
      │                              │                            │ 4. Lit l'email
      │                              │                            │    Analyse le litige
      │                              │                            │
      │                              │ 5. Répond par email        │
      │<─────────────────────────────────────────────────────────│
      │                              │                            │
      │ 6. Lit la réponse            │                            │
      │    Analyse les justificatifs │                            │
      │                              │                            │
      │ 7. Retourne sur              │                            │
      │    page litiges              │                            │
      │                              │                            │
      │ 8. Choisit action finale     │                            │
      │    (APPROVE, REJECT, etc.)   │                            │
      │─────────────────────────────>│                            │
      │                              │                            │
      │                              │ 9. Traite l'action         │
      │                              │    Met à jour statut       │
      │                              │                            │
      │                              │ 10. Email de confirmation  │
      │                              │───────────────────────────>│
      │                              │                            │
```

---

## 📱 Interface Utilisateur

### Page: Gestion des Litiges

```
┌────────────────────────────────────────────────────────────────────┐
│  🚨 Gestion des Litiges                                            │
│  5 facture(s) en litige                                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🔍 Filtrer par catégorie:                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐                   │
│  │ Tous (5) │ Prix (2) │ Qté (2)  │ Calcul(1)│                   │
│  └──────────┴──────────┴──────────┴──────────┘                   │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📄 Facture: FAC-2024-001                                     │ │
│  │ Fournisseur: ACME Corp                                       │ │
│  │                                                              │ │
│  │ 🔴 Écart de Prix                    ⏱️ 5 jours en litige    │ │
│  │                                                              │ │
│  │ 💰 Montant facturé: 1,200.000 TND                           │ │
│  │ 💰 Montant attendu: 1,000.000 TND                           │ │
│  │ ⚠️  Écart: +200.000 TND (+20%)                              │ │
│  │                                                              │ │
│  │ 📝 Motif: Prix unitaire supérieur au BC                     │ │
│  │                                                              │ │
│  │ ┌──────────────────────┬──────────────────┐                │ │
│  │ │ ✅ Résoudre le litige │ 📧 Contacter     │                │ │
│  │ └──────────────────────┴──────────────────┘                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📄 Facture: FAC-2024-002                                     │ │
│  │ ...                                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Modal: Résolution de Litige

```
┌────────────────────────────────────────────────────────────────────┐
│  🚨 Résolution de Litige                                      ✕    │
│  Facture FAC-2024-001 - ACME Corp                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ⚠️  INFORMATIONS DU LITIGE                                        │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Catégorie: 🔴 Écart de Prix                                  │ │
│  │ En litige depuis: 5 jours                                    │ │
│  │                                                              │ │
│  │ 💰 Montant facturé:  1,200.000 TND                          │ │
│  │ 💰 Montant attendu:  1,000.000 TND                          │ │
│  │ ⚠️  Écart:           +200.000 TND (+20%)                     │ │
│  │                                                              │ │
│  │ 📝 Motif: Prix unitaire supérieur au BC                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  🎯 ACTIONS SUGGÉRÉES (par priorité)                              │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🔴 Demander un avoir                              [Sélectionné]│ │
│  │ Demander un avoir de 200.000 TND au fournisseur              │ │
│  │ ⏱️ Délai estimé: 3-5 jours                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🔴 Contacter le fournisseur                                  │ │
│  │ Demander une explication sur l'écart de prix                 │ │
│  │ ⏱️ Délai estimé: 1-2 jours                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  📝 DÉTAILS DE LA RÉSOLUTION                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Notes (optionnel):                                           │ │
│  │ ┌──────────────────────────────────────────────────────────┐ │ │
│  │ │ Frais de transport non prévus...                         │ │ │
│  │ └──────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │ ☑️ Envoyer un email au fournisseur (supplier@acme.com)      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┬──────────────────┐                     │
│  │ ✅ Confirmer         │ ❌ Annuler       │                     │
│  └──────────────────────┴──────────────────┘                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📧 Templates d'Emails

### Email: Demande de Clarification

```
┌────────────────────────────────────────────────────────────────────┐
│ De: noreply@yourbusiness.com                                       │
│ À: supplier@acme.com                                               │
│ Objet: Clarification requise - Facture FAC-2024-001               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Bonjour ACME Corp,                                                 │
│                                                                    │
│ Nous avons besoin de clarifications concernant la facture         │
│ FAC-2024-001.                                                      │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Catégorie: Écart de Prix                                     │ │
│ │ Montant facturé: 1,200.000 TND                               │ │
│ │ Montant attendu: 1,000.000 TND                               │ │
│ │ Écart: +200.000 TND (+20%)                                   │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ Raison du litige:                                                  │
│ Prix unitaire supérieur au bon de commande                        │
│                                                                    │
│ Notes:                                                             │
│ Merci de nous expliquer cet écart de prix.                        │
│                                                                    │
│ Merci de nous répondre par email avec vos explications.           │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │          📧 Répondre par Email                               │ │
│ │  mailto:accounting@yourbusiness.com?subject=RE: Facture...   │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ Cordialement,                                                      │
│ Your Business Name                                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Codes Couleur

### Priorités

- 🔴 **Haute** - Action urgente requise
- 🟡 **Moyenne** - Action recommandée
- 🟢 **Basse** - Action optionnelle

### Catégories

- 🔴 **PRICE_DISCREPANCY** - Rouge
- 🟠 **QUANTITY_MISMATCH** - Orange
- 🟡 **PARTIAL_DELIVERY** - Jaune
- 🔵 **CALCULATION_ERROR** - Bleu
- 🟣 **UNAUTHORIZED_CHARGE** - Violet
- ⚫ **DUPLICATE_INVOICE** - Gris
- 🟤 **QUALITY_ISSUE** - Rose
- ⚪ **OTHER** - Gris clair

### Statuts

- 🚨 **DISPUTED** - En litige (Orange)
- ✅ **APPROVED** - Approuvé (Vert)
- ⏸️ **PENDING** - En attente (Gris)
- ❌ **REJECTED** - Rejeté (Rouge)

---

## 📊 Dashboard Litiges (Future)

```
┌────────────────────────────────────────────────────────────────────┐
│  📊 Tableau de Bord - Litiges                                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┬──────────┬──────────┬──────────┐                   │
│  │ Actifs   │ Résolus  │ Montant  │ Temps    │                   │
│  │   5      │   12     │ 5,200 TND│ 3.2 jours│                   │
│  └──────────┴──────────┴──────────┴──────────┘                   │
│                                                                    │
│  📈 Litiges par Catégorie                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Prix:      ████████░░ 40%                                    │ │
│  │ Quantité:  ██████░░░░ 30%                                    │ │
│  │ Calcul:    ████░░░░░░ 20%                                    │ │
│  │ Autres:    ██░░░░░░░░ 10%                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  🏆 Top Fournisseurs avec Litiges                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 1. ACME Corp        - 3 litiges                              │ │
│  │ 2. Supplier XYZ     - 2 litiges                              │ │
│  │ 3. Provider ABC     - 1 litige                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

**Dernière mise à jour:** 3 avril 2026
**Version:** 1.0
