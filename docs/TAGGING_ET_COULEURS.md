# Fonctionnalité de Tagging des Membres d'Équipe et Personnalisation des Couleurs de Chat

## Vue d'ensemble

Cette fonctionnalité améliore la collaboration dans le chat des tâches avec deux capacités principales :
1. **Tagging des membres** : Mentionner (@) des membres de l'équipe dans les messages
2. **Couleurs personnalisées par chat** : Chaque membre peut choisir la couleur de TOUTE la discussion (uniquement pour lui-même)

## Concept clé : Couleur personnelle par discussion

Comme dans Facebook Messenger, chaque utilisateur peut personnaliser la couleur d'une discussion **uniquement pour lui-même** :
- Vous choisissez une couleur pour une discussion
- TOUS les messages de cette discussion (de tous les utilisateurs) s'affichent dans cette couleur **pour vous uniquement**
- Les autres membres voient la discussion avec leur propre couleur choisie
- Chaque discussion peut avoir une couleur différente

## Fonctionnalités

### 1. Tagging des Membres

#### Frontend (TaskChat.tsx)

1. **Autocomplétion des mentions**
   - Tapez `@` dans le champ de message pour afficher la liste des membres
   - La liste se filtre automatiquement pendant la saisie
   - Cliquez sur un membre pour l'insérer dans le message

2. **Bouton de mention rapide**
   - Icône `@` à côté du bouton de pièce jointe
   - Insère automatiquement `@` dans le message et affiche la liste

3. **Affichage des mentions**
   - Les mentions sont surlignées dans les messages
   - Indicateur du nombre de personnes mentionnées sous chaque message

4. **Interface utilisateur**
   - Dropdown contextuel au-dessus du champ de saisie
   - Affiche jusqu'à 5 membres à la fois
   - Avatar, nom et email pour chaque membre

### 2. Personnalisation des Couleurs par Chat

#### Comportement
- **Couleur par utilisateur ET par discussion** : Chaque utilisateur choisit une couleur pour chaque discussion
- **Préférence personnelle** : La couleur n'affecte que votre propre vue, pas celle des autres
- **Application globale** : Tous les messages de la discussion (de tous les utilisateurs) utilisent cette couleur
- **Persistance** : La couleur est sauvegardée dans la table `chat_color_preferences`
- **Synchronisation** : La couleur est synchronisée entre tous vos appareils

#### Frontend (TaskChat.tsx)

1. **Sélecteur de couleur**
   - Bouton palette (🎨) dans la barre d'outils du chat
   - Indicateur visuel de la couleur actuelle sur le bouton
   - Panneau de sélection avec 16 couleurs prédéfinies
   - Sélecteur de couleur personnalisé (color picker HTML5)
   - Aperçu en temps réel montrant tous les messages

2. **Affichage**
   - Tous les messages de la discussion utilisent la couleur choisie
   - Vos messages et ceux des autres ont la même couleur
   - Les pièces jointes héritent de la couleur de la discussion
   - Effet hover sur les fichiers attachés

3. **Couleurs prédéfinies**
   - Indigo (défaut), Blue, Purple, Pink
   - Red, Orange, Amber, Green
   - Teal, Cyan, Sky, Violet
   - Fuchsia, Rose, Emerald, Slate

#### Backend

1. **Entité ChatColorPreference** (`messages/entities/chat-color-preference.entity.ts`)
   - Champ `userId` : ID de l'utilisateur
   - Champ `taskId` : ID de la tâche/discussion
   - Champ `color` : code couleur hexadécimal (ex: #4F46E5)
   - Contrainte unique : (userId, taskId) - un utilisateur ne peut avoir qu'une seule couleur par discussion
   - Relations : User et Task avec CASCADE delete

2. **Entité Message** (`messages/entities/message.entity.ts`)
   - Champ `mentions` : tableau d'IDs utilisateurs
   - Pas de champ messageColor (la couleur est maintenant dans ChatColorPreference)

3. **Service Messages** (`messages/messages.service.ts`)
   - `getChatColorPreference(taskId, userId)` : Récupère la couleur choisie par l'utilisateur pour cette discussion
   - `setChatColorPreference(taskId, userId, color)` : Sauvegarde la couleur choisie

4. **Controller Messages** (`messages/messages.controller.ts`)
   - `GET /messages/chat-color/:taskId` : Récupère la couleur de la discussion
   - `POST /messages/chat-color/:taskId` : Définit la couleur de la discussion
   - Validation : format #RRGGBB requis

5. **Migration**
   - Fichier : `migrations/1743275000000-CreateChatColorPreferences.ts`
   - Crée la table `chat_color_preferences`
   - Ajoute les contraintes et foreign keys

## Utilisation

### Pour les utilisateurs

#### Mentionner un membre
1. Ouvrez le chat d'une tâche
2. Tapez `@` dans le champ de message
3. Sélectionnez un membre dans la liste
4. Continuez à taper votre message
5. Envoyez le message

#### Changer la couleur d'une discussion
1. Ouvrez le chat d'une tâche
2. Cliquez sur l'icône palette (🎨) dans la barre d'outils
3. Choisissez une couleur prédéfinie ou personnalisée
4. Visualisez l'aperçu montrant tous les messages
5. La couleur est automatiquement sauvegardée
6. **TOUS les messages de cette discussion changent immédiatement de couleur (pour vous uniquement)**
7. Les autres membres voient la discussion avec leur propre couleur

### Pour les développeurs

#### Passer le businessId au composant TaskChat

```tsx
<TaskChat
  taskId={task.id}
  taskTitle={task.title}
  currentUserId={currentUser.id}
  businessId={business.id}  // Requis pour charger les membres
  onClose={() => setChatTask(null)}
/>
```

#### Appliquer la migration

```bash
# Créer la table chat_color_preferences
# Voir le fichier de migration pour le SQL complet
```

## Structure des données

### ChatColorPreference

```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "taskId": "task-uuid",
  "color": "#9333EA",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Message avec mentions

```json
{
  "id": "uuid",
  "taskId": "uuid",
  "senderId": "uuid",
  "content": "Hey @John Doe, pouvez-vous vérifier ceci ?",
  "mentions": ["user-id-1", "user-id-2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "sender": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

## Détails techniques

### Stockage de la couleur

La couleur est stockée dans une table dédiée avec une contrainte unique :

```typescript
@Entity('chat_color_preferences')
@Unique(['userId', 'taskId'])
export class ChatColorPreference {
  @Column()
  userId: string;

  @Column()
  taskId: string;

  @Column({ default: '#4F46E5' })
  color: string;
}
```

### API Endpoints

#### Récupérer la couleur d'une discussion
```http
GET /messages/chat-color/:taskId
Authorization: Bearer <token>

Response:
{
  "color": "#9333EA"
}
```

#### Définir la couleur d'une discussion
```http
POST /messages/chat-color/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "color": "#9333EA"
}

Response:
{
  "message": "Chat color updated",
  "color": "#9333EA"
}
```

### Rendu des messages

Tous les messages utilisent la même couleur (celle choisie par l'utilisateur pour cette discussion) :

```jsx
<div
  style={{
    backgroundColor: messageColor || '#4F46E5',
    color: '#FFFFFF'
  }}
>
  {message.content}
</div>
```

### Chargement de la couleur

Au chargement du chat, la couleur de la discussion est récupérée :

```typescript
useEffect(() => {
  async function loadChatColor() {
    const res = await fetch(`${API_BASE}/messages/chat-color/${taskId}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.color) {
        setMessageColor(data.color);
      }
    }
  }
  loadChatColor();
}, [taskId]);
```

## Exemples d'utilisation

### Scénario 1 : Différentes couleurs par discussion
- Alice ouvre la discussion "Projet A" et choisit le bleu
- Alice ouvre la discussion "Projet B" et choisit le rouge
- Tous les messages du "Projet A" sont bleus pour Alice
- Tous les messages du "Projet B" sont rouges pour Alice

### Scénario 2 : Préférences personnelles
- Alice choisit le bleu pour la discussion "Projet A"
- Bob choisit le vert pour la même discussion "Projet A"
- Alice voit tous les messages en bleu
- Bob voit tous les messages en vert
- Chacun a sa propre expérience visuelle

### Scénario 3 : Synchronisation multi-appareils
- Alice choisit le violet sur son ordinateur
- Alice ouvre la même discussion sur son téléphone
- La discussion est automatiquement violette sur le téléphone
- La préférence est synchronisée via la base de données

## Avantages de cette approche

1. **Personnalisation** : Chaque utilisateur peut organiser visuellement ses discussions
2. **Isolation** : Les préférences d'un utilisateur n'affectent pas les autres
3. **Flexibilité** : Différentes couleurs pour différentes discussions
4. **Simplicité** : Une seule couleur par discussion, facile à comprendre
5. **Performance** : Pas besoin de charger les couleurs de tous les utilisateurs

## Améliorations futures possibles

### Tagging
1. **Notifications**
   - Envoyer des notifications aux utilisateurs mentionnés
   - Badge de notification dans l'interface

2. **Historique des mentions**
   - Voir tous les messages où vous êtes mentionné
   - Filtrer les messages par mentions

3. **Permissions**
   - Restreindre les mentions aux membres actifs
   - Vérifier les permissions avant d'envoyer

4. **Mentions de groupes**
   - @all pour mentionner toute l'équipe
   - @admins pour mentionner les administrateurs

### Couleurs
1. **Thèmes**
   - Mode sombre avec palette adaptée
   - Thèmes prédéfinis (professionnel, coloré, pastel)

2. **Accessibilité**
   - Vérification du contraste automatique
   - Suggestions de couleurs accessibles
   - Mode daltonien

3. **Organisation**
   - Couleurs par catégorie de tâches
   - Couleurs suggérées selon la priorité
   - Copier la couleur d'une autre discussion

4. **Statistiques**
   - Couleurs les plus utilisées
   - Suggestions basées sur vos préférences

5. **Import/Export**
   - Exporter vos préférences de couleurs
   - Importer des thèmes de couleurs
