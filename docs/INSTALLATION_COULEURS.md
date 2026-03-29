# Installation de la fonctionnalité de couleurs personnalisées

## Étapes d'installation

### 1. Appliquer les migrations

Vous devez créer deux tables dans votre base de données :

#### Migration 1 : Ajouter messageColor à la table users (optionnel - pour référence future)

```sql
ALTER TABLE users ADD COLUMN "messageColor" VARCHAR(7) DEFAULT '#4F46E5';
```

#### Migration 2 : Créer la table chat_color_preferences (REQUIS)

```sql
-- Créer la table
CREATE TABLE chat_color_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  color VARCHAR(7) DEFAULT '#4F46E5',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "UQ_chat_color_preferences_userId_taskId" UNIQUE ("userId", "taskId")
);

-- Ajouter les foreign keys
ALTER TABLE chat_color_preferences
  ADD CONSTRAINT "FK_chat_color_preferences_userId"
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_color_preferences
  ADD CONSTRAINT "FK_chat_color_preferences_taskId"
  FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE;

-- Créer des index pour améliorer les performances
CREATE INDEX "IDX_chat_color_preferences_userId" ON chat_color_preferences("userId");
CREATE INDEX "IDX_chat_color_preferences_taskId" ON chat_color_preferences("taskId");
```

### 2. Redémarrer le backend

```bash
cd PI-DEV-BACKEND
npm run start:dev
```

### 3. Vérifier que tout fonctionne

Le backend devrait démarrer sans erreurs. Vous devriez voir les nouveaux endpoints dans les logs :

- `GET /messages/chat-color/:taskId`
- `POST /messages/chat-color/:taskId`

## Test de la fonctionnalité

### Test 1 : Changer la couleur d'une discussion

1. Ouvrez l'application frontend
2. Naviguez vers la page Collaboration
3. Ouvrez le chat d'une tâche
4. Cliquez sur l'icône palette (🎨) en bas à gauche
5. Choisissez une couleur
6. Vérifiez que TOUS les messages changent de couleur

### Test 2 : Couleurs différentes par discussion

1. Ouvrez le chat de la tâche A
2. Choisissez la couleur bleue
3. Fermez le chat
4. Ouvrez le chat de la tâche B
5. Choisissez la couleur rouge
6. Vérifiez que la tâche A est toujours bleue et la tâche B est rouge

### Test 3 : Préférences personnelles

1. Utilisateur Alice : Ouvre la tâche A et choisit le bleu
2. Utilisateur Bob : Ouvre la même tâche A et choisit le vert
3. Alice voit tous les messages en bleu
4. Bob voit tous les messages en vert
5. Chacun a sa propre expérience visuelle

### Test 4 : Persistance

1. Choisissez une couleur pour une discussion
2. Fermez le navigateur
3. Rouvrez le navigateur et reconnectez-vous
4. Ouvrez la même discussion
5. Vérifiez que la couleur est conservée

## Vérification de la base de données

Vous pouvez vérifier que les préférences sont bien sauvegardées :

```sql
-- Voir toutes les préférences de couleurs
SELECT 
  ccp.id,
  ccp."userId",
  u.email,
  ccp."taskId",
  t.title as task_title,
  ccp.color,
  ccp."createdAt"
FROM chat_color_preferences ccp
JOIN users u ON u.id = ccp."userId"
JOIN tasks t ON t.id = ccp."taskId"
ORDER BY ccp."createdAt" DESC;

-- Voir les préférences d'un utilisateur spécifique
SELECT 
  t.title as task_title,
  ccp.color,
  ccp."updatedAt"
FROM chat_color_preferences ccp
JOIN tasks t ON t.id = ccp."taskId"
WHERE ccp."userId" = 'YOUR_USER_ID'
ORDER BY ccp."updatedAt" DESC;
```

## Dépannage

### Erreur : Table chat_color_preferences n'existe pas

**Solution :** Exécutez la migration SQL ci-dessus pour créer la table.

### Erreur : Cannot find module 'ChatColorPreference'

**Solution :** Redémarrez le serveur backend :
```bash
npm run start:dev
```

### La couleur ne se sauvegarde pas

**Vérifications :**
1. Vérifiez que la table `chat_color_preferences` existe
2. Vérifiez les logs du backend pour voir s'il y a des erreurs
3. Vérifiez que l'utilisateur est bien authentifié
4. Vérifiez que le taskId est valide

### La couleur ne s'affiche pas

**Vérifications :**
1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreurs JavaScript
3. Vérifiez que l'API `/messages/chat-color/:taskId` retourne bien une couleur
4. Videz le cache du navigateur (Ctrl+Shift+R)

## API Endpoints

### GET /messages/chat-color/:taskId

Récupère la couleur choisie par l'utilisateur pour une discussion.

**Réponse :**
```json
{
  "color": "#9333EA"
}
```

### POST /messages/chat-color/:taskId

Définit la couleur pour une discussion.

**Body :**
```json
{
  "color": "#9333EA"
}
```

**Réponse :**
```json
{
  "message": "Chat color updated",
  "color": "#9333EA"
}
```

**Validation :**
- Le format doit être #RRGGBB (6 caractères hexadécimaux)
- Exemples valides : #4F46E5, #FF0000, #00FF00
- Exemples invalides : #FFF, rgb(255,0,0), red

## Notes importantes

1. **Couleur par défaut :** Si aucune couleur n'est définie, la couleur par défaut est #4F46E5 (Indigo)

2. **Suppression en cascade :** Si un utilisateur ou une tâche est supprimé, les préférences de couleur associées sont automatiquement supprimées

3. **Contrainte unique :** Un utilisateur ne peut avoir qu'une seule couleur par discussion

4. **Performance :** Les index sur userId et taskId assurent des requêtes rapides

5. **Synchronisation :** Les préférences sont stockées côté serveur, donc elles sont synchronisées entre tous les appareils de l'utilisateur
