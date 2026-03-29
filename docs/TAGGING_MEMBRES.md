# Fonctionnalité de Tagging des Membres d'Équipe

## Vue d'ensemble

La fonctionnalité de tagging permet aux utilisateurs de mentionner (@) des membres de l'équipe dans les messages du chat des tâches. Cette fonctionnalité améliore la collaboration en permettant de notifier spécifiquement certains membres.

## Fonctionnalités

### Frontend (TaskChat.tsx)

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

### Backend (Messages)

1. **Entité Message**
   - Champ `mentions` : tableau d'IDs utilisateurs
   - Déjà implémenté dans `message.entity.ts`

2. **DTO CreateMessage**
   - Accepte `mentions` comme tableau ou chaîne JSON
   - Validation et parsing automatique

3. **Service Messages**
   - Parse les mentions depuis FormData
   - Sauvegarde les IDs des utilisateurs mentionnés

## Utilisation

### Pour les utilisateurs

1. Ouvrez le chat d'une tâche
2. Tapez `@` dans le champ de message
3. Sélectionnez un membre dans la liste
4. Continuez à taper votre message
5. Envoyez le message

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

## Structure des données

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

## Améliorations futures possibles

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

5. **Recherche avancée**
   - Rechercher par nom, email ou rôle
   - Afficher le rôle dans la liste de sélection
