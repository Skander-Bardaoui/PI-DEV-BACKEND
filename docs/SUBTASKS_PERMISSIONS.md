# Permissions et Progression des Subtasks

## Vue d'ensemble

Le système de subtasks implémente un contrôle d'accès basé sur les rôles (RBAC) permettant aux TEAM_MEMBER de cocher les subtasks tout en réservant la création et la suppression aux BUSINESS_OWNER et BUSINESS_ADMIN.

---

## Permissions par Rôle

### BUSINESS_OWNER & BUSINESS_ADMIN

Ces rôles gèrent les subtasks mais ne les cochent pas :

| Action | Permission | Endpoint |
|--------|-----------|----------|
| ✅ Voir les subtasks | Oui | `GET /subtasks/task/:taskId` |
| ✅ Créer manuellement | Oui | `POST /subtasks` |
| ✅ Générer avec AI | Oui | `POST /subtasks/generate` |
| ❌ Cocher/Décocher | Non | `PATCH /subtasks/:id` |
| ✅ Renommer | Oui | `PATCH /subtasks/:id` |
| ✅ Supprimer | Oui | `DELETE /subtasks/:id` |
| ✅ Voir progression | Oui | `GET /subtasks/task/:taskId/progress` |

**Rôle** : Créer et organiser les subtasks, puis laisser l'équipe les exécuter.

### TEAM_MEMBER

Les membres de l'équipe exécutent les subtasks :

| Action | Permission | Endpoint |
|--------|-----------|----------|
| ✅ Voir les subtasks | Oui | `GET /subtasks/task/:taskId` |
| ❌ Créer manuellement | Non | `POST /subtasks` |
| ❌ Générer avec AI | Non | `POST /subtasks/generate` |
| ✅ Cocher/Décocher | Oui | `PATCH /subtasks/:id` |
| ❌ Renommer | Non | `PATCH /subtasks/:id` |
| ❌ Supprimer | Non | `DELETE /subtasks/:id` |
| ✅ Voir progression | Oui | `GET /subtasks/task/:taskId/progress` |

**Rôle** : Exécuter les subtasks et marquer leur progression.

### ACCOUNTANT

Même permissions que TEAM_MEMBER (lecture et cocher uniquement).

---

## Affichage de la Progression

### Sur les Cartes Kanban

Chaque carte de tâche affiche automatiquement :
- Une barre de progression verte
- Le ratio complété/total (ex: 3/5)
- Le pourcentage (ex: 60%)

**Composant** : `SubtaskProgress` (mode compact)

```tsx
<SubtaskProgress taskId={task.id} compact />
```

**Apparence** :
```
[✓] 3/5 [████████░░] 60%
```

### Dans le Modal de Tâche

Affichage complet avec :
- Titre "Subtasks Progress"
- Ratio et pourcentage
- Barre de progression plus large

**Composant** : `SubtaskProgress` (mode complet)

```tsx
<SubtaskProgress taskId={task.id} />
```

---

## Flux de Travail

### 1. Création par OWNER/ADMIN

```mermaid
OWNER/ADMIN → Crée tâche → Génère subtasks avec AI → Subtasks créées
```

**Actions** :
1. Ouvrir une tâche existante
2. Cliquer sur "✨ Generate with AI"
3. Accepter les suggestions
4. Les subtasks sont créées et visibles par tous

### 2. Exécution par TEAM_MEMBER

```mermaid
TEAM_MEMBER → Voit tâche → Voit subtasks → Coche au fur et à mesure → Progression visible
```

**Actions** :
1. Ouvrir la tâche assignée
2. Voir la liste des subtasks
3. Cocher chaque subtask complétée
4. La progression se met à jour automatiquement

### 3. Suivi par Tous

```mermaid
Tous les rôles → Voient cartes Kanban → Voient progression → Suivent avancement
```

**Visibilité** :
- Progression visible sur toutes les cartes
- Mise à jour en temps réel
- Pas besoin d'ouvrir la tâche

---

## Implémentation Technique

### Backend

#### Guards et Décorateurs

```typescript
// Seuls OWNER et ADMIN peuvent générer
@Post('generate')
@UseGuards(RolesGuard)
@Roles(Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN)
async generateSubtasks(@Body() generateDto: GenerateSubtasksDto) {
  return this.subtasksService.generateSubtasks(generateDto);
}

// Tout le monde peut cocher (pas de guard restrictif)
@Patch(':id')
update(@Param('id') id: string, @Body() updateSubtaskDto: UpdateSubtaskDto) {
  return this.subtasksService.update(id, updateSubtaskDto);
}
```

#### Calcul de Progression

```typescript
async getTaskProgress(taskId: string): Promise<{
  completed: number;
  total: number;
  percentage: number;
}> {
  const subtasks = await this.findByTask(taskId);
  const total = subtasks.length;
  const completed = subtasks.filter(s => s.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}
```

### Frontend

#### Gestion des Permissions

```typescript
// Dans SubtaskList.tsx
const canGenerate = userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS_ADMIN';
const canCreate = userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS_ADMIN';
const canDelete = userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS_ADMIN';
// Seuls les TEAM_MEMBER peuvent cocher (séparation des responsabilités)
const canToggle = userRole === 'TEAM_MEMBER' || userRole === 'ACCOUNTANT';
```

#### Affichage Conditionnel

```tsx
{/* Bouton Generate - Seulement pour OWNER/ADMIN */}
{canGenerate && (
  <button onClick={handleGenerate}>
    ✨ Generate with AI
  </button>
)}

{/* Input manuel - Seulement pour OWNER/ADMIN */}
{canCreate && (
  <input placeholder="Add a subtask..." />
)}

{/* Bouton Delete - Seulement pour OWNER/ADMIN */}
{canDelete && (
  <button onClick={() => handleDelete(subtask.id)}>
    <Trash2 />
  </button>
)}
```

#### Rafraîchissement de la Progression

```typescript
// Callback après chaque action
onProgressUpdate={() => {
  if (currentBusiness) {
    fetchTasks(currentBusiness.id).then(setTasks);
  }
}}
```

---

## Messages d'Erreur

### Pour TEAM_MEMBER

Quand ils tentent une action non autorisée :

| Action | Message |
|--------|---------|
| Créer subtask | "Only Business Owner and Admin can create subtasks" |
| Supprimer subtask | "Only Business Owner and Admin can delete subtasks" |
| Générer avec AI | Bouton masqué (pas d'erreur) |

### Pour Tous

| Situation | Message |
|-----------|---------|
| Description vide | "Task description is required for AI generation" |
| Erreur réseau | "Failed to update subtask" |
| API indisponible | "Failed to generate subtasks: [détails]" |

---

## Exemples d'Utilisation

### Scénario 1 : Chef de Projet (BUSINESS_OWNER)

```typescript
// 1. Créer une tâche
const task = await createTask({
  title: "Développer API REST",
  description: "Créer endpoints CRUD pour gestion utilisateurs"
});

// 2. Générer subtasks
const suggestions = await subtasksApi.generate({
  taskId: task.id,
  taskTitle: task.title,
  taskDescription: task.description
});
// Résultat: ["Créer modèle User", "Implémenter GET /users", ...]

// 3. Accepter et créer
for (const title of suggestions) {
  await subtasksApi.create({ taskId: task.id, title });
}

// 4. Voir progression
const progress = await subtasksApi.getTaskProgress(task.id);
// { completed: 0, total: 6, percentage: 0 }
```

### Scénario 2 : Développeur (TEAM_MEMBER)

```typescript
// 1. Voir les subtasks assignées
const subtasks = await subtasksApi.getByTask(taskId);
// [{ id: '...', title: 'Créer modèle User', isCompleted: false }, ...]

// 2. Compléter une subtask
await subtasksApi.update(subtasks[0].id, { isCompleted: true });

// 3. Voir progression mise à jour
const progress = await subtasksApi.getTaskProgress(taskId);
// { completed: 1, total: 6, percentage: 17 }
```

### Scénario 3 : Suivi par Manager

```typescript
// Voir toutes les tâches avec progression
const tasks = await fetchTasks(businessId);

// Pour chaque tâche, la progression est visible sur la carte
tasks.forEach(task => {
  // SubtaskProgress affiche automatiquement:
  // [✓] 3/6 [████████░░░░] 50%
});
```

---

## Tests

### Test des Permissions

```bash
# En tant que BUSINESS_OWNER
curl -X POST http://localhost:3001/subtasks/generate \
  -H "Cookie: access_token=..." \
  -d '{"taskId":"...","taskTitle":"...","taskDescription":"..."}'
# ✅ 200 OK

# En tant que TEAM_MEMBER
curl -X POST http://localhost:3001/subtasks/generate \
  -H "Cookie: access_token=..." \
  -d '{"taskId":"...","taskTitle":"...","taskDescription":"..."}'
# ❌ 403 Forbidden
```

### Test de Progression

```bash
# Créer 3 subtasks
POST /subtasks {"taskId":"123","title":"Subtask 1"}
POST /subtasks {"taskId":"123","title":"Subtask 2"}
POST /subtasks {"taskId":"123","title":"Subtask 3"}

# Vérifier progression initiale
GET /subtasks/task/123/progress
# {"completed":0,"total":3,"percentage":0}

# Cocher une subtask
PATCH /subtasks/[id] {"isCompleted":true}

# Vérifier progression mise à jour
GET /subtasks/task/123/progress
# {"completed":1,"total":3,"percentage":33}
```

---

## Bonnes Pratiques

### Pour les OWNER/ADMIN

1. ✅ Créer des descriptions détaillées pour de meilleures suggestions AI
2. ✅ Réviser les suggestions avant d'accepter
3. ✅ Ajouter des subtasks manuellement si nécessaire
4. ✅ Surveiller la progression régulièrement
5. ❌ Ne pas cocher les subtasks - laisser l'équipe le faire

### Pour les TEAM_MEMBER

1. ✅ Cocher les subtasks au fur et à mesure
2. ✅ Communiquer si une subtask est bloquée
3. ✅ Vérifier la progression avant de marquer la tâche comme terminée
4. ❌ Ne pas essayer de supprimer ou créer des subtasks

### Pour Tous

1. ✅ Utiliser la progression comme indicateur de santé du projet
2. ✅ Discuter dans le chat de tâche si des subtasks posent problème
3. ✅ Mettre à jour régulièrement pour une visibilité en temps réel

---

## Dépannage

### La progression ne se met pas à jour

**Solution** : Rafraîchir la page ou fermer/rouvrir le modal de tâche

### OWNER/ADMIN essaie de cocher

**Vérifier** :
1. Les checkboxes sont désactivées (grisées)
2. Un tooltip apparaît : "Only team members can check subtasks"
3. Un message bleu s'affiche : "Manager View: Team members will check these subtasks..."
4. Cliquer ne fait rien et affiche un toast : "Only team members can check subtasks"

### Bouton Generate masqué pour ADMIN

**Vérifier** :
1. Le rôle dans le JWT est bien `BUSINESS_ADMIN`
2. Le composant reçoit bien `userRole` en props
3. La condition `canGenerate` est correcte

---

## Évolutions Futures

- [ ] Notifications quand une subtask est cochée
- [ ] Historique des modifications
- [ ] Assignation de subtasks à des membres spécifiques
- [ ] Estimation de temps par subtask
- [ ] Dépendances entre subtasks
- [ ] Commentaires sur les subtasks
- [ ] Filtres par statut (complétées/non complétées)
