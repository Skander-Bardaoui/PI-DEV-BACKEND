# Guide Rapide - Gestion des Litiges

## 🚀 En 3 Étapes Simples

### Étape 1: Repérer les Litiges
```
┌─────────────────────────────────────────────────────┐
│  Factures Fournisseurs                              │
│                                                     │
│  [Guide] [Contrôle] [Scanner] [🚨 Litiges 3] ← ICI │
└─────────────────────────────────────────────────────┘
```
**Quand vous voyez le badge orange "Litiges" avec un chiffre, vous avez des factures en litige!**

---

### Étape 2: Voir la Liste
```
Cliquez sur [🚨 Litiges 3]
         ↓
┌────────────────────────────────────────┐
│ 🚨 Litiges Actifs              ✕      │
│ 3 facture(s) en litige                │
├────────────────────────────────────────┤
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ FAC-2024-001      1,200.000 TND   │ │
│ │ ACME Corp                5 jours   │ │
│ │ 🔴 Écart de Prix                   │ │
│ │ Prix supérieur au BC               │ │
│ │ Écart: +200.000 TND                │ │
│ │ [Résoudre] [📧]                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ FAC-2024-002        850.000 TND   │ │
│ │ ...                                │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```
**Vous voyez tous vos litiges en un coup d'œil!**

---

### Étape 3: Résoudre
```
Cliquez sur [Résoudre]
         ↓
┌────────────────────────────────────────┐
│ 🚨 Résolution de Litige        ✕      │
├────────────────────────────────────────┤
│ Informations:                          │
│ • Montant facturé: 1,200.000 TND      │
│ • Montant attendu: 1,000.000 TND      │
│ • Écart: +200.000 TND (+20%)          │
│                                        │
│ Actions suggérées:                     │
│ ┌────────────────────────────────────┐ │
│ │ 🔴 Demander un avoir               │ │ ← Recommandé
│ │ Demander un avoir de 200 TND       │ │
│ │ Délai: 3-5 jours                   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 🔴 Contacter le fournisseur        │ │
│ │ Demander une explication           │ │
│ │ Délai: 1-2 jours                   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Notes (optionnel):                     │
│ ┌────────────────────────────────────┐ │
│ │ Frais de transport non prévus...   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ☑ Envoyer email au fournisseur        │
│                                        │
│ [✅ Confirmer] [❌ Annuler]            │
└────────────────────────────────────────┘
```
**Choisissez une action, ajoutez une note si besoin, confirmez!**

---

## 🎯 Actions Disponibles

### 🔴 Priorité Haute (Urgent)

#### 1. Demander un Avoir
**Quand:** Le montant facturé est trop élevé
**Résultat:** Email envoyé au fournisseur pour demander un avoir
**Délai:** 3-5 jours

#### 2. Demander Facture Rectificative
**Quand:** Quantités ou prix incorrects
**Résultat:** Email envoyé pour demander une nouvelle facture
**Délai:** 5-7 jours

#### 3. Rejeter la Facture
**Quand:** Facture en double ou non autorisée
**Résultat:** Facture rejetée, fournisseur notifié
**Délai:** Immédiat

---

### 🟡 Priorité Moyenne

#### 4. Corriger les Montants
**Quand:** Erreur de calcul (TVA, totaux)
**Résultat:** Montants corrigés dans le système
**Délai:** Immédiat

#### 5. Attendre la Livraison
**Quand:** Livraison partielle en cours
**Résultat:** Facture mise en attente
**Délai:** 2-3 jours

---

### 🟢 Priorité Basse

#### 6. Approuver Malgré l'Écart
**Quand:** L'écart est justifié et accepté
**Résultat:** Facture approuvée, peut être payée
**Délai:** Immédiat

#### 7. Contacter le Fournisseur
**Quand:** Besoin de clarifications
**Résultat:** Email envoyé, fournisseur répond par email
**Délai:** 1-2 jours

---

## 💡 Conseils Pratiques

### ✅ À Faire

1. **Traiter rapidement** - Résolvez les litiges dans les 48h
2. **Ajouter des notes** - Expliquez votre décision
3. **Notifier le fournisseur** - Cochez la case pour l'informer
4. **Vérifier les montants** - Avant de corriger, vérifiez bien

### ❌ À Éviter

1. **Ignorer les litiges** - Le badge reste visible jusqu'à résolution
2. **Approuver sans vérifier** - Prenez le temps de comprendre l'écart
3. **Oublier de notifier** - Le fournisseur doit être informé
4. **Corriger sans justification** - Ajoutez toujours une note

---

## 🔔 Notifications

### Badge Orange
- Apparaît quand il y a des litiges
- Pulse pour attirer l'attention
- Affiche le nombre exact
- Disparaît quand tout est résolu

### Urgence
- **< 3 jours:** Badge orange normal
- **3-7 jours:** Badge orange qui pulse
- **> 7 jours:** Badge rouge qui pulse rapidement

---

## 📧 Communication Fournisseur

### Email Automatique
Quand vous choisissez une action avec notification, le fournisseur reçoit:

```
Objet: [Action] - Facture [NUMERO]

Bonjour [Fournisseur],

[Message selon l'action choisie]

Détails:
• Facture: [NUMERO]
• Montant: [MONTANT]
• Raison: [VOTRE NOTE]

Cordialement,
[Votre Entreprise]
```

### Réponse Fournisseur
Le fournisseur répond par email. Vous recevez sa réponse dans votre boîte mail et pouvez alors:
1. Lire sa justification
2. Retourner sur les litiges
3. Choisir l'action finale

---

## 🎨 Codes Couleur

### Catégories de Litiges
- 🔴 **Écart de Prix** - Rouge
- 🟠 **Écart de Quantité** - Orange
- 🟡 **Livraison Partielle** - Jaune
- 🔵 **Erreur de Calcul** - Bleu
- ⚫ **Facture en Double** - Gris

### Priorités d'Actions
- 🔴 **Haute** - À traiter en priorité
- 🟡 **Moyenne** - À traiter rapidement
- 🟢 **Basse** - Peut attendre

---

## ⌨️ Raccourcis Clavier

- `Alt + L` → Ouvrir les litiges
- `Esc` → Fermer le panneau
- `Enter` → Confirmer l'action

---

## 📱 Sur Mobile

Le panneau des litiges s'adapte automatiquement:
- Plein écran sur petit écran
- Swipe vers la droite pour fermer
- Boutons plus grands pour le tactile

---

## ❓ Questions Fréquentes

### Q: Le badge ne disparaît pas après résolution?
**R:** Rafraîchissez la page (F5) ou attendez quelques secondes pour l'auto-refresh.

### Q: Je ne vois pas le bouton "Litiges"?
**R:** Normal! Il n'apparaît que s'il y a des litiges actifs.

### Q: Puis-je résoudre plusieurs litiges en même temps?
**R:** Pas encore, mais c'est prévu dans une prochaine version.

### Q: Comment annuler une résolution?
**R:** Contactez votre administrateur ou le support technique.

### Q: Le fournisseur n'a pas répondu à mon email?
**R:** Relancez-le manuellement ou contactez-le par téléphone.

---

## 🆘 Besoin d'Aide?

### Support
- Email: support@example.com
- Téléphone: +216 XX XXX XXX
- Chat: Disponible 9h-18h

### Documentation
- Guide complet: `/docs/GUIDE_GESTION_LITIGES_COMPLETE.md`
- Workflow visuel: `/docs/WORKFLOW_LITIGES_VISUEL.md`
- UX simplifiée: `/docs/LITIGES_UX_SIMPLIFIEE.md`

---

**Dernière mise à jour:** 3 avril 2026
**Version:** 2.0
