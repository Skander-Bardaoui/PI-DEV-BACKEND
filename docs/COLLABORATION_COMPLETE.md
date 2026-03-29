# Documentation Complète - Module Collaboration

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Backend - API](#backend---api)
4. [Frontend - Interface](#frontend---interface)
5. [Fonctionnalités](#fonctionnalités)
6. [Installation](#installation)
7. [Utilisation](#utilisation)
8. [Structure des données](#structure-des-données)
9. [Exemples de code](#exemples-de-code)
10. [Dépannage](#dépannage)

---

## Vue d'ensemble

Le module Collaboration est une solution complète de gestion de tâches et de communication d'équipe. Il combine :

- **Gestion de tâches** : Création, assignation, suivi (Kanban)
- **Chat en temps réel** : WebSocket pour communication instantanée
- **Mentions (@)** : Tagging des membres d'équipe
- **Couleurs personnalisées** : Personnalisation visuelle par discussion
- **Partage de fichiers** : Upload et partage de documents/images
- **Notifications** : Système de notifications en temps réel

### Technologies utilisées

**Backend :**
- NestJS (Framework Node.js)
- TypeORM (ORM)
- PostgreSQL (Base de données)
- Socket.IO (WebSocket)
- Multer (Upload de fichiers)

**Frontend :**
- React + TypeScript
- TailwindCSS (Styling)
- Socket.IO Client (WebSocket)
- Lucide React (Icônes)

---

## Architecture

### Schéma général

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Collaboration   │────────▶│    TaskChat      │         │
│  │     Page         │         │   Component      │         │
│  └──────────────────┘         └──────────────────┘         │
│         │                              │                     │
│         │ HTTP/REST                    │ WebSocket          │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │     Tasks        │         │    Messages      │         │
│  │   Controller     │         │   Controller     │         │
│  └──────────────────┘         └──────────────────┘         │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │     Tasks        │         │    Messages      │         │
│  │    Service       │         │    Service       │         │
│  └──────────────────┘         └──────────────────┘         │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌──────────────────────────────────────────────┐          │
│  │            PostgreSQL Database                │          │
│  │  - tasks                                      │          │
│  │  - messages                                   │          │
│  │  - chat_color_preferences                    │          │
│  │  - users                                      │          │
│  │  - businesses                                 │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend - API

### Modules principaux

#### 1. Tasks Module

**Entités :**

- `Task` : Tâches avec titre, description, priorité, statut, date d'échéance
- Relations : assignedTo (User[]), business (Business)

**Endpoints :**
```
GET    /tasks/business/:businessId    - Liste des tâches d'un business
POST   /tasks                         - Créer une tâche
GET    /tasks/:id                     - Détails d'une tâche
PATCH  /tasks/:id                     - Modifier une tâche
DELETE /tasks/:id                     - Supprimer une tâche
```

**Statuts disponibles :**
- `TODO` : À faire
- `IN_PROGRESS` : En cours
- `DONE` : Terminé
- `BLOCKED` : Bloqué

**Priorités :**
- `LOW` : Basse
- `MEDIUM` : Moyenne
- `HIGH` : Haute

#### 2. Messages Module

**Entités :**
- `Message` : Messages avec contenu, fichiers, mentions
- `ChatColorPreference` : Préférences de couleur par utilisateur/discussion
- Relations : sender (User), task (Task)

**Endpoints :**
```
POST   /messages                      - Envoyer un message
GET    /messages/task/:taskId         - Messages d'une tâche
GET    /messages/chat-color/:taskId   - Couleur de la discussion
POST   /messages/chat-color/:taskId   - Définir la couleur
```

**WebSocket Events :**
- `joinTask` : Rejoindre une discussion
- `leaveTask` : Quitter une discussion
- `newMessage` : Nouveau message reçu


#### 3. Businesses Module

**Endpoints utilisés :**
```
GET    /businesses/my                 - Mes businesses
GET    /businesses/:id/members        - Membres d'un business
```

---

## Frontend - Interface

### Composants principaux

#### 1. Collaboration.tsx (Page principale)

**Responsabilités :**
- Affichage des onglets (Tasks, Team, Activity, Notifications)
- Gestion du Kanban board (4 colonnes : TODO, IN_PROGRESS, DONE, BLOCKED)
- Liste des membres de l'équipe
- Création/édition/suppression de tâches
- Ouverture du chat

**État principal :**
```typescript
- tasks: Task[]                    // Liste des tâches
- teamMembers: TeamMember[]        // Membres de l'équipe
- currentBusiness: Business        // Business actuel
- currentUser: User                // Utilisateur connecté
- chatTask: Task | null            // Tâche dont le chat est ouvert
```

**Fonctionnalités :**
- Drag & drop entre colonnes (à implémenter)
- Filtrage par business
- Recherche de membres
- Gestion des permissions (BUSINESS_OWNER, BUSINESS_ADMIN)


#### 2. TaskChat.tsx (Composant de chat)

**Responsabilités :**
- Affichage des messages en temps réel
- Envoi de messages texte
- Upload et affichage de fichiers
- Mentions (@) avec autocomplétion
- Personnalisation de la couleur de la discussion
- Compression automatique des images

**Props :**
```typescript
interface TaskChatProps {
  taskId: string;           // ID de la tâche
  taskTitle: string;        // Titre de la tâche
  currentUserId: string;    // ID de l'utilisateur
  businessId?: string;      // ID du business (pour charger les membres)
  onClose: () => void;      // Callback de fermeture
}
```

**Fonctionnalités clés :**
- WebSocket pour temps réel
- Scroll automatique vers le bas
- Formatage des dates relatives (Just now, 5m ago, etc.)
- Prévisualisation des images
- Téléchargement des fichiers
- Indicateur de typing (à implémenter)


---

## Fonctionnalités

### 1. Gestion des tâches

#### Création de tâche
1. Cliquer sur "Create Task"
2. Remplir le formulaire :
   - Titre (requis)
   - Description
   - Priorité (LOW, MEDIUM, HIGH)
   - Date d'échéance
   - Assignation (multiple)
3. Cliquer sur "Create Task"

#### Modification de tâche
1. Cliquer sur le menu (⋮) d'une tâche
2. Sélectionner "Edit"
3. Modifier les champs
4. Cliquer sur "Update Task"

#### Changement de statut
1. Cliquer sur le menu (⋮) d'une tâche
2. Sélectionner "Change Status"
3. Choisir le nouveau statut

#### Suppression de tâche
1. Cliquer sur le menu (⋮) d'une tâche
2. Sélectionner "Delete"
3. Confirmer la suppression


### 2. Chat en temps réel

#### Envoyer un message
1. Ouvrir le chat d'une tâche (icône 💬)
2. Taper le message dans le champ
3. Appuyer sur Entrée ou cliquer sur le bouton d'envoi

#### Envoyer un fichier
1. Cliquer sur l'icône 📎 (Paperclip)
2. Sélectionner un fichier (max 100MB)
3. Le fichier est automatiquement envoyé
4. Les images sont compressées automatiquement

#### Mentionner un membre (@)
1. Taper `@` dans le message
2. Une liste de membres apparaît
3. Sélectionner un membre ou continuer à taper pour filtrer
4. Le membre est inséré dans le message
5. Alternative : Cliquer sur l'icône @ pour insérer automatiquement

#### Personnaliser la couleur
1. Cliquer sur l'icône 🎨 (Palette)
2. Choisir une couleur prédéfinie ou personnalisée
3. Tous les messages de la discussion changent de couleur
4. La couleur est sauvegardée automatiquement
5. Chaque discussion peut avoir sa propre couleur


### 3. Gestion d'équipe

#### Voir les membres
1. Aller dans l'onglet "Team"
2. Liste complète avec :
   - Avatar
   - Nom complet
   - Email
   - Rôle
   - Statut (Actif/Inactif)
   - Date de rejointe

#### Rechercher un membre
1. Utiliser la barre de recherche
2. Filtrage par nom, email ou rôle

#### Inviter un membre
1. Cliquer sur "Invite Member"
2. Remplir le formulaire :
   - Nom complet
   - Email
   - Rôle
3. Envoyer l'invitation

---

## Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

#### 1. Installation des dépendances
```bash
cd PI-DEV-BACKEND
npm install
```


#### 2. Configuration de la base de données
```bash
# Créer la base de données
createdb your_database_name

# Configurer .env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database_name
```

#### 3. Migrations SQL

**Créer la table chat_color_preferences :**
```sql
CREATE TABLE chat_color_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  color VARCHAR(7) DEFAULT '#4F46E5',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "UQ_chat_color_preferences_userId_taskId" UNIQUE ("userId", "taskId")
);

ALTER TABLE chat_color_preferences
  ADD CONSTRAINT "FK_chat_color_preferences_userId"
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_color_preferences
  ADD CONSTRAINT "FK_chat_color_preferences_taskId"
  FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE;

CREATE INDEX "IDX_chat_color_preferences_userId" ON chat_color_preferences("userId");
CREATE INDEX "IDX_chat_color_preferences_taskId" ON chat_color_preferences("taskId");
```


#### 4. Démarrer le serveur
```bash
npm run start:dev
```

Le serveur démarre sur `http://localhost:3001`

### Frontend

#### 1. Installation des dépendances
```bash
cd PI-DEV-FRONT
npm install
```

#### 2. Configuration
```bash
# Créer .env
VITE_API_URL=http://localhost:3001
```

#### 3. Démarrer l'application
```bash
npm run dev
```

L'application démarre sur `http://localhost:5173`

---

## Utilisation

### Workflow typique

#### 1. Créer un projet
1. Se connecter à l'application
2. Créer un business (si pas déjà fait)
3. Inviter des membres de l'équipe

#### 2. Créer des tâches
1. Aller dans Collaboration
2. Créer une tâche avec titre, description, priorité
3. Assigner à un ou plusieurs membres
4. Définir une date d'échéance


#### 3. Collaborer
1. Ouvrir le chat d'une tâche
2. Discuter avec l'équipe
3. Partager des fichiers
4. Mentionner des membres avec @
5. Personnaliser la couleur de la discussion

#### 4. Suivre l'avancement
1. Déplacer les tâches entre les colonnes
2. Mettre à jour le statut
3. Consulter l'activité dans l'onglet Activity
4. Vérifier les notifications

---

## Structure des données

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  assignedTo?: User[];
  dueDate?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  taskId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mentions?: string[];
  createdAt: string;
  sender: User;
}
```


### ChatColorPreference
```typescript
interface ChatColorPreference {
  id: string;
  userId: string;
  taskId: string;
  color: string;  // Format: #RRGGBB
  createdAt: string;
  updatedAt: string;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  avatarUrl?: string;
}
```

### TeamMember
```typescript
interface TeamMember {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  user: User;
}
```

---

## Exemples de code

### Backend - Créer une tâche

```typescript
// tasks.controller.ts
@Post()
async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
  return this.tasksService.create(createTaskDto, req.user.id);
}

// tasks.service.ts
async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
  const task = this.taskRepository.create({
    ...createTaskDto,
    createdBy: userId,
  });
  
  const saved = await this.taskRepository.save(task);
  
  // Charger les relations
  return this.taskRepository.findOne({
    where: { id: saved.id },
    relations: ['assignedTo', 'business'],
  });
}
```


### Backend - Envoyer un message avec WebSocket

```typescript
// messages.controller.ts
@Post()
async create(@Body() dto: CreateMessageDto, @Request() req) {
  const message = await this.messagesService.create(dto, req.user.id);
  
  // Broadcast via WebSocket
  this.messagesGateway.server
    .to(`task-${dto.taskId}`)
    .emit('newMessage', message);
  
  return message;
}

// messages.gateway.ts
@WebSocketGateway({ cors: true })
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinTask')
  handleJoinTask(@MessageBody() taskId: string, @ConnectedSocket() client: Socket) {
    client.join(`task-${taskId}`);
  }
}
```

### Frontend - Créer une tâche

```typescript
async function createTask(taskData: Partial<Task>): Promise<Task> {
  const payload = {
    ...taskData,
    assignedToIds: taskData.assignedTo?.map(u => u.id) || [],
  };
  
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}
```


### Frontend - WebSocket pour le chat

```typescript
useEffect(() => {
  const socket = io(API_BASE, { withCredentials: true });
  
  socket.on('connect', () => {
    socket.emit('joinTask', taskId);
  });
  
  socket.on('newMessage', (message: Message) => {
    setMessages(prev => [...prev, message]);
  });
  
  return () => {
    socket.emit('leaveTask', taskId);
    socket.disconnect();
  };
}, [taskId]);
```

### Frontend - Mentions avec autocomplétion

```typescript
const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  const cursorPosition = e.target.selectionStart;
  
  setNewMessage(value);
  
  // Détecter @
  const textBeforeCursor = value.substring(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');
  
  if (lastAtIndex !== -1) {
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    if (!textAfterAt.includes(' ')) {
      setMentionSearch(textAfterAt.toLowerCase());
      setShowMentions(true);
    }
  }
};
```


### Frontend - Personnalisation de couleur

```typescript
const updateChatColor = async (color: string) => {
  try {
    const res = await fetch(`${API_BASE}/messages/chat-color/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ color }),
    });
    
    if (res.ok) {
      setMessageColor(color);
    }
  } catch (error) {
    console.error('Error updating chat color:', error);
  }
};
```

---

## Dépannage

### Problèmes courants

#### 1. WebSocket ne se connecte pas

**Symptômes :** Les messages ne s'affichent pas en temps réel

**Solutions :**
- Vérifier que le backend est démarré
- Vérifier les CORS dans le backend
- Vérifier l'URL WebSocket dans le frontend
- Ouvrir la console du navigateur pour voir les erreurs

```typescript
// backend - main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```


#### 2. Upload de fichiers échoue

**Symptômes :** Erreur lors de l'envoi de fichiers

**Solutions :**
- Vérifier que le dossier `public/uploads/messages` existe
- Vérifier les permissions du dossier
- Vérifier la taille du fichier (max 100MB)
- Vérifier la configuration Multer

```bash
# Créer le dossier si nécessaire
mkdir -p public/uploads/messages
chmod 755 public/uploads/messages
```

#### 3. Les couleurs ne se sauvegardent pas

**Symptômes :** La couleur revient à la valeur par défaut

**Solutions :**
- Vérifier que la table `chat_color_preferences` existe
- Vérifier les logs du backend
- Vérifier l'authentification de l'utilisateur
- Vérifier le format de la couleur (#RRGGBB)

```sql
-- Vérifier la table
SELECT * FROM chat_color_preferences LIMIT 5;
```

#### 4. Les mentions ne fonctionnent pas

**Symptômes :** La liste des membres ne s'affiche pas

**Solutions :**
- Vérifier que `businessId` est passé au composant TaskChat
- Vérifier que l'API `/businesses/:id/members` fonctionne
- Vérifier les logs de la console

```typescript
// Vérifier que businessId est fourni
<TaskChat
  taskId={task.id}
  taskTitle={task.title}
  currentUserId={currentUser.id}
  businessId={currentBusiness.id}  // ← Important !
  onClose={() => setChatTask(null)}
/>
```


#### 5. Erreur 401 Unauthorized

**Symptômes :** Toutes les requêtes retournent 401

**Solutions :**
- Vérifier que l'utilisateur est connecté
- Vérifier les cookies (access_token, refresh_token)
- Vérifier la configuration JWT
- Vérifier que `credentials: 'include'` est dans les requêtes

```typescript
// Toujours inclure credentials
fetch(`${API_BASE}/tasks`, {
  credentials: 'include',  // ← Important !
});
```

### Logs utiles

#### Backend
```bash
# Voir tous les logs
npm run start:dev

# Logs de base de données
# Activer dans ormconfig ou app.module.ts
logging: true,
```

#### Frontend
```javascript
// Console du navigateur (F12)
console.log('Messages:', messages);
console.log('Socket connected:', socket.connected);
console.log('Current user:', currentUser);
```

### Commandes SQL utiles

```sql
-- Voir toutes les tâches
SELECT t.id, t.title, t.status, t.priority, b.name as business_name
FROM tasks t
JOIN businesses b ON b.id = t."businessId"
ORDER BY t."createdAt" DESC;

-- Voir tous les messages d'une tâche
SELECT m.id, m.content, u.email as sender_email, m."createdAt"
FROM messages m
JOIN users u ON u.id = m."senderId"
WHERE m."taskId" = 'YOUR_TASK_ID'
ORDER BY m."createdAt" ASC;
```


-- Voir les préférences de couleur
SELECT ccp.*, u.email, t.title
FROM chat_color_preferences ccp
JOIN users u ON u.id = ccp."userId"
JOIN tasks t ON t.id = ccp."taskId"
ORDER BY ccp."updatedAt" DESC;

-- Voir les membres d'un business
SELECT bm.*, u.email, u."firstName", u."lastName"
FROM business_members bm
JOIN users u ON u.id = bm.user_id
WHERE bm.business_id = 'YOUR_BUSINESS_ID'
AND bm.is_active = true;
```

---

## Bonnes pratiques

### Backend

1. **Validation des données**
   - Toujours valider avec class-validator
   - Vérifier les permissions avant chaque opération
   - Utiliser des DTOs pour toutes les entrées

2. **Gestion des erreurs**
   - Utiliser les exceptions NestJS appropriées
   - Logger les erreurs importantes
   - Retourner des messages d'erreur clairs

3. **Performance**
   - Utiliser les relations TypeORM judicieusement
   - Créer des index sur les colonnes fréquemment recherchées
   - Paginer les résultats pour les grandes listes

4. **Sécurité**
   - Toujours vérifier l'authentification
   - Vérifier les permissions (business access)
   - Valider et sanitiser les uploads de fichiers
   - Utiliser HTTPS en production


### Frontend

1. **État et performance**
   - Utiliser useState pour l'état local
   - Utiliser useEffect avec dépendances correctes
   - Éviter les re-renders inutiles
   - Mémoriser les fonctions coûteuses

2. **Gestion des erreurs**
   - Toujours gérer les erreurs dans try/catch
   - Afficher des messages d'erreur à l'utilisateur
   - Logger les erreurs dans la console

3. **UX/UI**
   - Afficher des loaders pendant les chargements
   - Désactiver les boutons pendant les opérations
   - Donner du feedback visuel (succès, erreur)
   - Utiliser des animations subtiles

4. **WebSocket**
   - Toujours nettoyer les connexions dans useEffect
   - Gérer la reconnexion automatique
   - Afficher l'état de connexion si nécessaire

---

## Améliorations futures

### Fonctionnalités à ajouter

1. **Notifications push**
   - Notifications navigateur
   - Notifications email
   - Notifications mobiles

2. **Recherche avancée**
   - Recherche full-text dans les messages
   - Filtres avancés pour les tâches
   - Recherche par mentions

3. **Drag & Drop**
   - Déplacer les tâches entre colonnes
   - Réorganiser les tâches dans une colonne
   - Upload de fichiers par drag & drop


4. **Statistiques et rapports**
   - Temps passé par tâche
   - Productivité de l'équipe
   - Graphiques d'avancement
   - Export des données

5. **Intégrations**
   - Calendrier (Google Calendar, Outlook)
   - Stockage cloud (Google Drive, Dropbox)
   - Outils de développement (GitHub, GitLab)
   - Outils de communication (Slack, Teams)

6. **Accessibilité**
   - Support clavier complet
   - Lecteurs d'écran
   - Contraste élevé
   - Tailles de police ajustables

7. **Mobile**
   - Application mobile native
   - PWA (Progressive Web App)
   - Notifications push mobiles

8. **Collaboration avancée**
   - Édition collaborative en temps réel
   - Appels vidéo intégrés
   - Partage d'écran
   - Tableaux blancs collaboratifs

---

## Ressources

### Documentation officielle
- [NestJS](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [Socket.IO](https://socket.io/docs/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)

### Outils utiles
- [Postman](https://www.postman.com/) - Test des APIs
- [pgAdmin](https://www.pgadmin.org/) - Gestion PostgreSQL
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debug React

---

## Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs (backend et frontend)
3. Consulter les issues GitHub
4. Contacter l'équipe de développement

---

**Version :** 1.0.0  
**Dernière mise à jour :** Mars 2026  
**Auteurs :** Équipe PI-DEV
