# Optimisation du Cache React Query - Module Purchases

## 🎯 Objectif
Garantir que toutes les modifications dans le module purchases se reflètent instantanément dans l'interface sans rechargement de page.

## ✅ Améliorations Apportées

### 1. Invalidations de Cache Complètes

Chaque mutation invalide maintenant TOUTES les queries liées pour garantir la cohérence des données:

#### Factures (usePurchaseInvoices.ts)
- **Créer une facture** → Invalide: factures, stats fournisseurs, rankings, matches 3-voies
- **Approuver une facture** → Invalide: factures, stats fournisseurs, rankings, matches 3-voies
- **Signaler un problème** → Invalide: factures, stats, rankings, matches, réponses aux problèmes
- **Résoudre un problème** → Invalide: factures, stats, rankings
- **Enregistrer un paiement** → Invalide: factures, stats, rankings, trésorerie

#### Fournisseurs (useSuppliers.ts)
- **Créer un fournisseur** → Invalide: fournisseurs, rankings
- **Modifier un fournisseur** → Invalide: fournisseurs, rankings, scores
- **Archiver/Restaurer** → Invalide: fournisseurs, rankings

#### Bons de Commande (useSupplierPOs.ts)
- **Créer un BC** → Invalide: BCs, stats fournisseurs, rankings
- **Envoyer un BC** → Invalide: BCs, stats fournisseurs, rankings
- **Confirmer un BC** → Invalide: BCs, stats fournisseurs, rankings

#### Bons de Réception (useGoodsReceipts.ts)
- **Créer un BR** → Invalide: BRs, BCs, matches 3-voies, factures liées
- **Refetch automatique** des BCs après création d'un BR

### 2. Invalidations en Cascade

Les invalidations suivent maintenant les relations entre les données:

```
Facture modifiée
  ↓
  ├─ Invalide liste des factures
  ├─ Invalide stats du fournisseur
  ├─ Invalide ranking des fournisseurs
  ├─ Invalide matches 3-voies
  └─ Invalide trésorerie (si paiement)
```

### 3. Queries Liées Invalidées

| Action | Queries Invalidées |
|--------|-------------------|
| Créer/Modifier Facture | `purchase-invoices`, `supplier-score`, `supplier-ranking`, `three-way-match-all` |
| Créer/Modifier BC | `supplier-pos`, `supplier-score`, `supplier-ranking` |
| Créer BR | `goods-receipts`, `supplier-pos`, `three-way-match-all`, `purchase-invoices` |
| Modifier Fournisseur | `suppliers`, `supplier-score`, `supplier-ranking` |
| Paiement | `purchase-invoices`, `supplier-score`, `supplier-ranking`, `treasury` |

## 🚀 Résultat

### Avant
- Certaines données nécessitaient un rechargement de page
- Les stats ne se mettaient pas toujours à jour
- Les rankings restaient obsolètes après modifications

### Après
- ✅ Toutes les modifications sont instantanées
- ✅ Les stats se mettent à jour automatiquement
- ✅ Les rankings sont toujours à jour
- ✅ Les matches 3-voies se recalculent automatiquement
- ✅ Aucun rechargement de page nécessaire

## 📊 Impact sur l'UX

1. **Réactivité instantanée**: L'utilisateur voit immédiatement le résultat de ses actions
2. **Cohérence des données**: Toutes les vues affichent les mêmes données à jour
3. **Fluidité**: Pas de rechargement, pas de latence perceptible
4. **Confiance**: L'utilisateur sait que ses actions ont été prises en compte

## 🔧 Maintenance

Pour ajouter une nouvelle mutation:

1. Identifier toutes les queries qui dépendent de cette donnée
2. Invalider toutes ces queries dans `onSuccess`
3. Utiliser `refetchQueries` si un refetch immédiat est nécessaire

Exemple:
```typescript
export function useMyMutation(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => myApi(businessId, data),
    onSuccess: () => {
      // Invalider toutes les queries liées
      qc.invalidateQueries({ queryKey: ['my-data', businessId] });
      qc.invalidateQueries({ queryKey: ['related-data', businessId] });
      // Refetch immédiat si nécessaire
      qc.refetchQueries({ queryKey: ['critical-data', businessId] });
    },
  });
}
```

## ✨ Bonnes Pratiques Appliquées

1. **Invalidation large**: Mieux invalider trop que pas assez
2. **Queries spécifiques**: Utiliser des queryKeys précises pour un contrôle fin
3. **Refetch sélectif**: Utiliser `refetchQueries` uniquement pour les données critiques
4. **Cohérence**: Toutes les mutations suivent le même pattern

---

**Date de mise à jour**: 3 avril 2026
**Version**: 2.0
**Statut**: ✅ Implémenté et testé
