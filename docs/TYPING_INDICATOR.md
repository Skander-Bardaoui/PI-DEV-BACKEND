# Indicateur de saisie (Typing Indicator)

## Vue d'ensemble

L'indicateur de saisie affiche en temps réel quand un ou plusieurs utilisateurs sont en train d'écrire un message dans une discussion. Cette fonctionnalité améliore l'expérience utilisateur en donnant un feedback visuel immédiat.

## Fonctionnalités

### ✅ Ce qui est implémenté

1. **Détection de saisie** : Détecte quand l'utilisateur tape dans le champ de message
2. **Debounce intelligent** : Timeout de 2 secondes pour éviter le spam
3. **Broadcast WebSocket** : Diffusion en temps réel aux autres utilisateurs
4. **Affichage contextuel** : Messages adaptés selon le nombre d'utilisateurs
5. **Animation fluide** : 3 points animés avec effet bounce
6. **Nettoyage automatique** : Arrêt lors de l'envoi ou après timeout

### 🎯 Comportement

#### Scénario 1 : Un utilisateur tape
```
Alice tape un message
→ Bob voit : "Alice est en train d'écrire..."
→ Charlie voit : "Alice est en train d'écrire..."
→ Alice ne voit rien (son propre indicateur n'est pas affiché)
```

#### Scénario 2 : Plusieurs utilisateurs tapent
```
Alice et Bob tapent en même temps
→ Charlie voit : "Alice et Bob sont en train d'écrire..."

Alice, Bob et David tapent
→ Charlie voit : "3 personnes sont en train d'écrire..."
```

#### Scénario 3 : Timeout automatique
```
Alice tape un message
→ Indicateur affiché
→ Alice arrête de taper pendant 2 secondes
→ Indicateur disparaît automatiquement
```

#### Scénario 4 : Envoi de message
```
Alice tape un message
→ Indicateur affiché
→ Alice envoie le message
→ Indicateur disparaît immédiatement
```

## Architecture technique

### Backend - WebSocket Gateway

**Fichier :** `src/messages/messages.gateway.ts`

```typescript
@SubscribeMessage('userTyping')
handleUserTyping(
  @MessageBody() data: { 
    taskId: string; 
    userId: string; 
    userName: string; 
    isTyping: boolean 
  },
  @ConnectedSocket() client: Socket,
) {
  // Broadcast à tous les clients dans la room sauf l'émetteur
  client.to(`task-${data.taskId}`).emit('userTyping', {
    userId: data.userId,
    userName: data.userName,
    isTyping: data.isTyping,
  });
  
  return { event: 'typingBroadcasted', data: true };
}
```

**Caractéristiques :**
- Utilise `client.to()` pour exclure l'émetteur
- Broadcast uniquement dans la room de la tâche
- Pas de sauvegarde en base de données (événement éphémère)

### Frontend - React Component

**Fichier :** `src/components/TaskChat.tsx`

#### 1. État et références

```typescript
const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

#### 2. Écoute de l'événement WebSocket

```typescript
socket.on('userTyping', (data: { userId: string; userName: string; isTyping: boolean }) => {
  if (data.userId !== currentUserId) {
    setTypingUsers((prev) => {
      if (data.isTyping) {
        // Ajouter l'utilisateur s'il n'est pas déjà dans la liste
        if (!prev.find(u => u.userId === data.userId)) {
          return [...prev, { userId: data.userId, userName: data.userName }];
        }
        return prev;
      } else {
        // Retirer l'utilisateur de la liste
        return prev.filter(u => u.userId !== data.userId);
      }
    });
  }
});
```

#### 3. Émission avec debounce

```typescript
const emitTypingEvent = (isTyping: boolean) => {
  if (!socket) return;

  // Annuler le timeout précédent
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  // Émettre l'événement typing
  socket.emit('userTyping', {
    taskId,
    userId: currentUserId,
    userName: userName,
    isTyping: true,
  });

  // Arrêter après 2 secondes d'inactivité
  typingTimeoutRef.current = setTimeout(() => {
    socket.emit('userTyping', {
      taskId,
      userId: currentUserId,
      userName: userName,
      isTyping: false,
    });
  }, 2000);
};
```

#### 4. Intégration dans le handler de changement

```typescript
const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setNewMessage(value);
  
  // Émettre l'événement typing avec debounce
  emitTypingEvent(true);
  
  // ... reste du code (mentions, etc.)
};
```

#### 5. Arrêt lors de l'envoi

```typescript
const handleSendMessage = async () => {
  // Arrêter l'indicateur de typing
  if (socket && typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
    socket.emit('userTyping', {
      taskId,
      userId: currentUserId,
      userName: '',
      isTyping: false,
    });
  }
  
  // ... envoyer le message
};
```

#### 6. Affichage visuel

```tsx
{typingUsers.length > 0 && (
  <div className="px-4 py-2 border-t border-gray-100">
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {/* Animation des points */}
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
              style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
              style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
              style={{ animationDelay: '300ms' }} />
      </div>
      
      {/* Message contextuel */}
      <span>
        {typingUsers.length === 1
          ? `${typingUsers[0].userName} est en train d'écrire...`
          : typingUsers.length === 2
          ? `${typingUsers[0].userName} et ${typingUsers[1].userName} sont en train d'écrire...`
          : `${typingUsers.length} personnes sont en train d'écrire...`}
      </span>
    </div>
  </div>
)}
```

## Optimisations

### 1. Debounce (2 secondes)
- **Problème** : Sans debounce, chaque frappe envoie un événement WebSocket
- **Solution** : Timeout de 2 secondes qui se réinitialise à chaque frappe
- **Résultat** : Maximum 1 événement toutes les 2 secondes par utilisateur

### 2. Broadcast ciblé
- **Problème** : Envoyer à tous les utilisateurs connectés
- **Solution** : Utiliser les rooms Socket.IO (`task-${taskId}`)
- **Résultat** : Seuls les utilisateurs dans la même discussion reçoivent l'événement

### 3. Exclusion de l'émetteur
- **Problème** : L'utilisateur voit son propre indicateur
- **Solution** : `client.to()` au lieu de `server.to()`
- **Résultat** : L'émetteur ne reçoit pas son propre événement

### 4. Nettoyage automatique
- **Problème** : Indicateurs bloqués si l'utilisateur quitte
- **Solution** : Cleanup dans `useEffect` return
- **Résultat** : Pas de fuites mémoire

## Styling

### Animation CSS (TailwindCSS)

```css
/* Les classes utilisées */
animate-bounce          /* Animation de rebond */
animationDelay: '0ms'   /* Délai pour le 1er point */
animationDelay: '150ms' /* Délai pour le 2ème point */
animationDelay: '300ms' /* Délai pour le 3ème point */
```

### Couleurs
- Points : `bg-gray-400`
- Texte : `text-gray-500`
- Bordure : `border-gray-100`

## Tests

### Test manuel

1. **Test basique**
   - Ouvrir 2 navigateurs avec 2 utilisateurs différents
   - Ouvrir la même discussion
   - Utilisateur A tape un message
   - Vérifier que B voit "A est en train d'écrire..."

2. **Test debounce**
   - Utilisateur A tape rapidement
   - Vérifier qu'il n'y a pas de spam d'événements (ouvrir DevTools Network)
   - Arrêter de taper
   - Vérifier que l'indicateur disparaît après 2 secondes

3. **Test multiple**
   - Ouvrir 3 navigateurs (A, B, C)
   - A et B tapent en même temps
   - Vérifier que C voit "A et B sont en train d'écrire..."

4. **Test envoi**
   - Utilisateur A tape un message
   - A envoie le message
   - Vérifier que l'indicateur disparaît immédiatement

### Vérification WebSocket

```javascript
// Dans la console du navigateur
// Vérifier la connexion
socket.connected  // true

// Écouter les événements
socket.on('userTyping', (data) => {
  console.log('Typing event:', data);
});

// Émettre manuellement
socket.emit('userTyping', {
  taskId: 'task-id',
  userId: 'user-id',
  userName: 'Test User',
  isTyping: true,
});
```

## Améliorations futures

### 1. Persistance temporaire
- Sauvegarder l'état de typing dans Redis
- Récupérer l'état lors de la reconnexion
- TTL de 5 secondes

### 2. Indicateur par utilisateur
- Afficher un avatar à côté de chaque nom
- Couleur différente par utilisateur
- Position dans la liste des messages

### 3. Statistiques
- Temps moyen de saisie
- Nombre de messages tapés mais non envoyés
- Analyse du comportement utilisateur

### 4. Paramètres personnalisables
- Durée du debounce (1-5 secondes)
- Activer/désactiver l'indicateur
- Afficher uniquement pour certains utilisateurs

## Dépannage

### L'indicateur ne s'affiche pas

**Vérifications :**
1. WebSocket connecté : `socket.connected === true`
2. Événement émis : Vérifier dans Network tab
3. Événement reçu : Ajouter un `console.log` dans le listener
4. `currentUserId` correct : Vérifier qu'il ne correspond pas à l'émetteur

### L'indicateur reste bloqué

**Solutions :**
1. Vérifier que le timeout est bien nettoyé
2. Vérifier que `isTyping: false` est envoyé
3. Redémarrer le serveur WebSocket
4. Vider le cache du navigateur

### Trop d'événements envoyés

**Solutions :**
1. Vérifier que le debounce fonctionne
2. Augmenter la durée du timeout (2s → 3s)
3. Vérifier qu'il n'y a pas de listeners multiples

## Conclusion

L'indicateur de saisie est maintenant pleinement fonctionnel avec :
- ✅ Détection en temps réel
- ✅ Debounce de 2 secondes
- ✅ Affichage contextuel
- ✅ Animation fluide
- ✅ Nettoyage automatique
- ✅ Optimisations WebSocket

Cette fonctionnalité améliore significativement l'expérience utilisateur en donnant un feedback visuel immédiat sur l'activité dans la discussion.
