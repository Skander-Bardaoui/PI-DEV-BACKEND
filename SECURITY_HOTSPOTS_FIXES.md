# 🔐 Corrections des Security Hotspots - Backend

## 📋 Hotspots Détectés et Corrections

### 1. JWT Token Configuration

**Problème**: Tokens JWT sans expiration ou avec expiration trop longue

**Localisation**: `src/auth/auth.service.ts`

**Correction**:
```typescript
// ❌ AVANT (Hotspot)
const access_token = this.jwtService.sign(payload);

// ✅ APRÈS (Sécurisé)
const access_token = this.jwtService.sign(payload, {
  expiresIn: '15m', // Token expire après 15 minutes
  algorithm: 'HS256',
});

const refresh_token = this.jwtService.sign(payload, {
  expiresIn: '7d', // Refresh token expire après 7 jours
  algorithm: 'HS256',
});
```

---

### 2. CORS Configuration

**Problème**: CORS trop permissif (origin: '*')

**Localisation**: `src/main.ts`

**Correction**:
```typescript
// ❌ AVANT (Hotspot)
app.enableCors({
  origin: '*',
  credentials: true,
});

// ✅ APRÈS (Sécurisé)
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

### 3. Cookie Security

**Problème**: Cookies sans flags de sécurité

**Localisation**: `src/auth/auth.service.ts`

**Correction**:
```typescript
// ❌ AVANT (Hotspot)
res.cookie('access_token', token);

// ✅ APRÈS (Sécurisé)
res.cookie('access_token', token, {
  httpOnly: true,      // Empêche l'accès JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
  sameSite: 'strict',  // Protection CSRF
  maxAge: 15 * 60 * 1000, // 15 minutes
});
```

---

### 4. Password Hashing

**Problème**: Nombre de rounds bcrypt trop faible

**Localisation**: `src/users/users.service.ts`, `src/auth/auth.service.ts`

**Correction**:
```typescript
// ❌ AVANT (Hotspot)
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ APRÈS (Sécurisé)
const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds minimum
```

---

### 5. SQL Injection Prevention

**Problème**: Requêtes SQL avec concaténation de strings

**Localisation**: `src/Purchases/services/goods-receipts.service.ts`

**Correction**:
```typescript
// ❌ AVANT (Hotspot)
await manager.query(
  `SELECT * FROM goods_receipts WHERE gr_number LIKE '${prefix}%'`
);

// ✅ APRÈS (Sécurisé) - Utiliser des paramètres
await manager.query(
  `SELECT * FROM goods_receipts WHERE gr_number LIKE $1`,
  [`${prefix}%`]
);
```

---

### 6. Secrets Management

**Problème**: Secrets potentiellement hardcodés

**Localisation**: Vérifier tous les fichiers

**Correction**:
```typescript
// ❌ AVANT (Hotspot)
const apiKey = 'sk-1234567890abcdef';

// ✅ APRÈS (Sécurisé)
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}
```

---

### 7. File Upload Security

**Problème**: Upload de fichiers sans validation

**Localisation**: `src/users/users.service.ts`

**Correction**:
```typescript
// ❌ AVANT (Hotspot)
async uploadAvatar(userId: string, file: Express.Multer.File) {
  const filepath = path.join(uploadsDir, file.originalname);
  await fs.writeFile(filepath, file.buffer);
}

// ✅ APRÈS (Sécurisé)
async uploadAvatar(userId: string, file: Express.Multer.File) {
  // Validation du type MIME
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    throw new BadRequestException('Invalid file type');
  }
  
  // Validation de la taille (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new BadRequestException('File too large');
  }
  
  // Nom de fichier sécurisé (pas d'utilisation du nom original)
  const filename = `${userId}-${Date.now()}.webp`;
  const filepath = path.join(uploadsDir, filename);
  
  // Traitement avec sharp (sécurisé)
  await sharp(file.buffer)
    .resize(400, 400)
    .webp({ quality: 85 })
    .toFile(filepath);
}
```

---

### 8. Rate Limiting

**Problème**: Pas de protection contre les attaques par force brute

**Localisation**: `src/main.ts`

**Correction**:
```typescript
// Installation: npm install @nestjs/throttler

// Dans app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // Fenêtre de temps (secondes)
      limit: 10,    // Nombre max de requêtes
    }),
  ],
})

// Dans les controllers sensibles
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // Max 5 tentatives par minute
  async login(@Body() dto: LoginDto) {
    // ...
  }
}
```

---

### 9. Helmet Security Headers

**Problème**: Headers de sécurité HTTP manquants

**Localisation**: `src/main.ts`

**Correction**:
```typescript
// Installation: npm install helmet

import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ajouter les headers de sécurité
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }));
  
  await app.listen(3001);
}
```

---

### 10. Input Validation

**Problème**: Validation insuffisante des entrées utilisateur

**Localisation**: Tous les DTOs

**Correction**:
```typescript
// Utiliser Zod pour validation stricte (déjà en place)
import { z } from 'zod';

// ✅ Bon exemple
export const CreateSupplierSchema = z.object({
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Invalid characters'),
  email: z.string()
    .email('Invalid email')
    .toLowerCase(),
  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
    .optional(),
});
```

---

## 🚀 Script de Correction Automatique

Créer un fichier `fix-security-hotspots.sh`:

```bash
#!/bin/bash

echo "🔐 Fixing Security Hotspots..."

# 1. Installer les dépendances de sécurité
npm install helmet @nestjs/throttler

# 2. Mettre à jour bcrypt rounds
find src -name "*.ts" -type f -exec sed -i 's/bcrypt.hash(\(.*\), 10)/bcrypt.hash(\1, 12)/g' {} \;

# 3. Vérifier les secrets hardcodés
echo "⚠️ Checking for hardcoded secrets..."
grep -r "password\s*=\s*['\"]" src/ || echo "✅ No hardcoded passwords found"
grep -r "api[_-]?key\s*=\s*['\"]" src/ || echo "✅ No hardcoded API keys found"

echo "✅ Security fixes applied!"
```

---

## 📝 Checklist de Revue Manuelle

Pour chaque hotspot dans SonarQube:

- [ ] **Lire la description** du hotspot
- [ ] **Comprendre le risque** potentiel
- [ ] **Analyser le contexte** du code
- [ ] **Décider de l'action**:
  - [ ] Corriger le code si nécessaire
  - [ ] Marquer comme "Safe" si déjà sécurisé
  - [ ] Marquer comme "Acknowledged" si risque accepté
- [ ] **Ajouter un commentaire** justifiant la décision
- [ ] **Commit et push** les corrections

---

## 🎯 Objectif Quality Gate

Pour passer le Quality Gate:
- **Hotspots Reviewed**: 100% (tous les hotspots doivent être revus)
- **Security Rating**: A (aucune vulnérabilité critique)

---

## 📊 Commandes Utiles

### Voir les hotspots localement avec ESLint:
```bash
npm run lint
```

### Analyser la sécurité avec npm audit:
```bash
npm audit
npm audit fix
```

### Scanner avec OWASP Dependency Check:
```bash
# Installation
npm install -g dependency-check

# Scan
dependency-check --project backend --scan .
```

---

## 🔗 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SonarQube Security Hotspots](https://docs.sonarqube.org/latest/user-guide/security-hotspots/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)

---

**Date**: 2026-04-21  
**Status**: Guide de correction des Security Hotspots
