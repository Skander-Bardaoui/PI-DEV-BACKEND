# Guide Complet - Gestion des Litiges de Factures

## Vue d'ensemble

Ce guide décrit le workflow complet de gestion des litiges de factures fournisseurs, depuis la détection automatique jusqu'à la résolution finale.

---

## 🔄 Workflow Complet

### 1. Détection Automatique du Litige

Lorsqu'une facture fournisseur est rapprochée avec un bon de commande (3-way matching), le système détecte automatiquement les écarts et crée un litige si nécessaire.

**Déclenchement automatique:**
- Écart de prix > seuil configuré
- Écart de quantité détecté
- Erreur de calcul (TVA, totaux)
- Livraison partielle ou manquante

**Statut de la facture:** `DISPUTED`

**Catégories de litiges:**
- `PRICE_DISCREPANCY` - Écart de prix
- `QUANTITY_MISMATCH` - Écart de quantité
- `CALCULATION_ERROR` - Erreur de calcul
- `PARTIAL_DELIVERY` - Livraison partielle
- `MISSING_DELIVERY` - Livraison manquante
- `UNAUTHORIZED_CHARGE` - Frais non autorisés
- `DUPLICATE_INVOICE` - Facture en double
- `QUALITY_ISSUE` - Problème de qualité
- `OTHER` - Autre

---

### 2. Notification du Business Owner

Le business owner reçoit une notification (dans l'application et/ou par email) l'informant du nouveau litige.

**Informations fournies:**
- Numéro de facture
- Fournisseur
- Montant facturé vs montant attendu
- Écart (montant et pourcentage)
- Catégorie du litige
- Raison détaillée

---

### 3. Accès à la Page de Gestion des Litiges

Le business owner accède à la page dédiée via:
- Menu: **Achats > Gestion des Litiges**
- Route: `/app/purchases/disputes`

**Fonctionnalités de la page:**
- Liste de toutes les factures en litige
- Filtrage par catégorie de litige
- Affichage du nombre de jours en litige
- Montants et écarts clairement affichés
- Actions rapides: Résoudre ou Contacter le fournisseur

---

### 4. Analyse du Litige

Le business owner clique sur "Résoudre le litige" pour ouvrir le modal de résolution.

**Informations affichées:**
- Détails complets du litige
- Catégorie et priorité
- Montants (facturé, attendu, écart)
- Jours en litige
- Email du fournisseur

**Actions suggérées (par priorité):**

Le système analyse automatiquement le litige et suggère les actions les plus appropriées selon la catégorie:

#### Pour PRICE_DISCREPANCY (Écart de prix):
1. 🔴 **Demander un avoir** - Si le montant facturé est supérieur
2. 🔴 **Contacter le fournisseur** - Pour clarification

#### Pour QUANTITY_MISMATCH (Écart de quantité):
1. 🔴 **Demander facture rectificative** - Facture avec quantités correctes
2. 🟡 **Corriger les montants** - Correction dans le système

#### Pour PARTIAL_DELIVERY (Livraison partielle):
1. 🟡 **Attendre la livraison complète** - Mise en attente
2. 🟢 **Approuver la livraison partielle** - Si acceptable

#### Pour CALCULATION_ERROR (Erreur de calcul):
1. 🔴 **Corriger les montants** - Correction immédiate
2. 🟡 **Demander facture rectificative** - Demande au fournisseur

#### Pour DUPLICATE_INVOICE (Facture en double):
1. 🔴 **Rejeter le doublon** - Rejet immédiat

---

### 5. Actions de Résolution Disponibles

#### A. APPROVE_AS_IS - Approuver malgré l'écart
**Quand l'utiliser:**
- L'écart est justifié (frais de transport, etc.)
- Accord préalable avec le fournisseur
- Écart négligeable accepté

**Résultat:**
- Statut: `DISPUTED` → `APPROVED`
- La facture peut être payée
- Notes ajoutées à l'historique

---

#### B. CORRECT_AMOUNTS - Corriger les montants
**Quand l'utiliser:**
- Erreur de saisie détectée
- Calcul incorrect (TVA, totaux)
- Montants à ajuster dans le système

**Formulaire requis:**
- Sous-total HT (optionnel)
- Montant TVA (optionnel)
- Timbre fiscal (optionnel)

**Résultat:**
- Montants mis à jour dans le système
- Statut: `DISPUTED` → `APPROVED`
- Recalcul automatique du net_amount

---

#### C. REQUEST_CREDIT_NOTE - Demander un avoir
**Quand l'utiliser:**
- Montant facturé supérieur au montant dû
- Produits retournés
- Remise non appliquée

**Résultat:**
- Email automatique envoyé au fournisseur
- Statut: reste `DISPUTED` (en attente d'avoir)
- Note: "[En attente d'avoir]"

**Email envoyé au fournisseur:**
```
Objet: Demande d'avoir - Facture [NUMERO]

Bonjour [Fournisseur],

Nous avons détecté un écart sur la facture [NUMERO].

Montant facturé: XXX TND
Montant attendu: XXX TND
Écart: +XXX TND

Merci de nous faire parvenir un avoir pour régulariser cette situation.

Cordialement,
[Business Name]
```

---

#### D. REQUEST_CORRECTED_INVOICE - Demander facture rectificative
**Quand l'utiliser:**
- Quantités incorrectes
- Prix unitaires erronés
- Besoin d'une nouvelle facture conforme

**Résultat:**
- Email automatique envoyé au fournisseur
- Statut: reste `DISPUTED` (en attente de correction)
- Note: "[En attente de facture rectificative]"

**Email envoyé au fournisseur:**
```
Objet: Demande de facture rectificative - [NUMERO]

Bonjour [Fournisseur],

La facture [NUMERO] présente des écarts par rapport à notre bon de commande.

Merci de nous faire parvenir une facture rectificative avec les montants corrects.

Détails de l'écart:
- Montant facturé: XXX TND
- Montant attendu: XXX TND

Cordialement,
[Business Name]
```

---

#### E. REJECT_INVOICE - Rejeter la facture
**Quand l'utiliser:**
- Facture en double
- Facture non autorisée
- Produits non commandés
- Qualité non conforme

**Résultat:**
- Statut: `DISPUTED` → `PENDING` (pour archivage)
- Email de notification au fournisseur
- Note: "[Rejetée]"

**Email envoyé au fournisseur:**
```
Objet: Rejet de facture - [NUMERO]

Bonjour [Fournisseur],

Nous sommes au regret de vous informer que la facture [NUMERO] a été rejetée.

Raison: [Notes du business owner]

Merci de ne pas procéder au paiement de cette facture.

Cordialement,
[Business Name]
```

---

#### F. WAIT_FOR_DELIVERY - Attendre la livraison complète
**Quand l'utiliser:**
- Livraison partielle en cours
- Produits en attente de réception
- Livraison échelonnée prévue

**Résultat:**
- Statut: reste `DISPUTED`
- Note: "[En attente de livraison]"
- Pas d'email envoyé (attente passive)

---

#### G. CONTACT_SUPPLIER - Contacter le fournisseur pour clarification
**Quand l'utiliser:**
- Besoin d'explications
- Écart non compris
- Clarification requise avant décision

**Résultat:**
- Email de demande de clarification envoyé
- Statut: reste `DISPUTED`
- Fournisseur peut répondre par email

**Email envoyé au fournisseur:**
```
Objet: Clarification requise - Facture [NUMERO]

Bonjour [Fournisseur],

Nous avons besoin de clarifications concernant la facture [NUMERO].

Catégorie: [Catégorie du litige]
Montant facturé: XXX TND
Montant attendu: XXX TND
Écart: XXX TND ([X]%)

Raison du litige: [Raison détaillée]

Notes: [Notes du business owner]

Merci de nous répondre par email avec vos explications.

Cordialement,
[Business Name]

---
Pour répondre, cliquez sur "Répondre par Email" ci-dessous:
[Bouton: Répondre par Email]
```

---

### 6. Réponse du Fournisseur (Email uniquement)

Le fournisseur reçoit l'email et répond directement par email (pas de portail).

**Contenu de la réponse:**
- Explication de l'écart
- Justification des montants
- Proposition de solution
- Documents justificatifs (pièces jointes)

**Traitement de la réponse:**
1. Le business owner reçoit l'email de réponse
2. Il analyse la réponse et les justificatifs
3. Il retourne sur la page de gestion des litiges
4. Il choisit l'action appropriée selon la réponse

---

### 7. Résolution Finale

Après avoir choisi une action, le business owner:

1. **Remplit les détails** (si nécessaire):
   - Montants corrigés (pour CORRECT_AMOUNTS)
   - Notes explicatives (optionnel)

2. **Choisit la notification**:
   - ☑️ Envoyer un email au fournisseur (recommandé)
   - ☐ Ne pas notifier

3. **Confirme la résolution**:
   - Clic sur "Confirmer la résolution"
   - Le système traite l'action
   - La facture change de statut
   - Email envoyé si demandé

---

## 📊 Scénarios Complets

### Scénario 1: Écart de Prix Justifié

**Situation:** Facture de 1,200 TND au lieu de 1,000 TND (frais de transport ajoutés)

**Workflow:**
1. Système détecte l'écart → Statut `DISPUTED`
2. Business owner ouvre le litige
3. Voit: Écart de +200 TND (20%)
4. Action suggérée: "Contacter le fournisseur"
5. Envoie email de clarification
6. Fournisseur répond: "Frais de transport urgents ajoutés"
7. Business owner accepte → Action: "Approuver malgré l'écart"
8. Ajoute note: "Frais de transport urgents acceptés"
9. Confirme → Statut `APPROVED`
10. Facture peut être payée

---

### Scénario 2: Erreur de Quantité

**Situation:** Facture pour 100 unités, BC pour 80 unités

**Workflow:**
1. Système détecte l'écart → Statut `DISPUTED`
2. Business owner ouvre le litige
3. Voit: Écart de quantité (100 vs 80)
4. Action suggérée: "Demander facture rectificative"
5. Envoie demande au fournisseur
6. Fournisseur envoie nouvelle facture pour 80 unités
7. Business owner reçoit nouvelle facture
8. Rejette l'ancienne: Action "Rejeter la facture"
9. Traite la nouvelle facture normalement

---

### Scénario 3: Erreur de Calcul TVA

**Situation:** TVA calculée à 20% au lieu de 19%

**Workflow:**
1. Système détecte l'écart → Statut `DISPUTED`
2. Business owner ouvre le litige
3. Voit: Erreur de calcul TVA
4. Action suggérée: "Corriger les montants"
5. Saisit les montants corrects:
   - Sous-total HT: 1,000 TND
   - TVA: 190 TND (au lieu de 200)
   - Timbre: 1 TND
6. Confirme → Système recalcule: 1,191 TND
7. Statut `APPROVED`
8. Email envoyé au fournisseur avec les montants corrigés

---

### Scénario 4: Livraison Partielle

**Situation:** Facture pour 100 unités, seulement 60 reçues

**Workflow:**
1. Système détecte l'écart → Statut `DISPUTED`
2. Business owner ouvre le litige
3. Voit: Livraison partielle (60/100)
4. Action suggérée: "Attendre la livraison complète"
5. Choisit cette action
6. Statut reste `DISPUTED` avec note "[En attente de livraison]"
7. Quand les 40 unités restantes arrivent:
   - Crée un bon de réception complémentaire
   - Retourne sur le litige
   - Action: "Approuver malgré l'écart"
   - Statut `APPROVED`

---

### Scénario 5: Facture en Double

**Situation:** Même facture reçue deux fois

**Workflow:**
1. Système détecte le doublon → Statut `DISPUTED`
2. Business owner ouvre le litige
3. Voit: Catégorie "Facture en double"
4. Action suggérée: "Rejeter le doublon"
5. Confirme le rejet
6. Email envoyé au fournisseur
7. Statut `PENDING` (archivée)
8. Première facture reste valide

---

## 🔔 Notifications et Alertes

### Notifications Business Owner

**Quand:**
- Nouveau litige détecté
- Litige non résolu depuis > 7 jours
- Réponse fournisseur reçue (email)

**Où:**
- Badge sur l'icône "Gestion des Litiges" dans le menu
- Notification dans l'application
- Email (optionnel)

### Notifications Fournisseur

**Quand:**
- Demande de clarification
- Demande d'avoir
- Demande de facture rectificative
- Rejet de facture
- Résolution avec correction de montants

**Contenu:**
- Détails du litige
- Action demandée
- Montants concernés
- Instructions pour répondre

---

## 📈 Statistiques et Reporting

### Métriques Disponibles

- Nombre de litiges actifs
- Nombre de litiges par catégorie
- Temps moyen de résolution
- Montant total en litige
- Taux de résolution par action
- Fournisseurs avec le plus de litiges

### Exports

- Liste des litiges (CSV, Excel)
- Rapport mensuel des litiges
- Historique par fournisseur

---

## 🔧 Configuration

### Seuils de Détection

Configurable dans les paramètres business:
- Seuil d'écart de prix (% ou montant)
- Seuil d'écart de quantité
- Délai d'alerte (jours)

### Templates d'Emails

Personnalisables pour chaque type de notification:
- Demande de clarification
- Demande d'avoir
- Demande de facture rectificative
- Rejet de facture

---

## 🎯 Bonnes Pratiques

### Pour le Business Owner

1. **Traiter rapidement** - Résoudre les litiges dans les 48h
2. **Documenter** - Toujours ajouter des notes explicatives
3. **Communiquer** - Contacter le fournisseur en cas de doute
4. **Vérifier** - Contrôler les montants avant correction
5. **Archiver** - Conserver les emails et justificatifs

### Pour les Fournisseurs

1. **Répondre vite** - Répondre aux demandes sous 24-48h
2. **Justifier** - Fournir des explications claires
3. **Documenter** - Joindre les pièces justificatives
4. **Corriger** - Envoyer rapidement les documents rectificatifs

---

## 🔐 Permissions

### Qui peut faire quoi?

| Action | Business Owner | Accountant | Team Member |
|--------|---------------|------------|-------------|
| Voir les litiges | ✅ | ✅ | ❌ |
| Résoudre un litige | ✅ | ✅ | ❌ |
| Approuver malgré écart | ✅ | ✅ | ❌ |
| Corriger les montants | ✅ | ✅ | ❌ |
| Rejeter une facture | ✅ | ✅ | ❌ |
| Contacter fournisseur | ✅ | ✅ | ❌ |

---

## 📞 Support

En cas de problème ou question:
- Documentation: `/docs/GUIDE_GESTION_LITIGES_COMPLETE.md`
- Support technique: support@example.com
- Hotline: +216 XX XXX XXX

---

**Dernière mise à jour:** 3 avril 2026
**Version:** 1.0
