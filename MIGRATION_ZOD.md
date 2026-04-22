# Guide de Migration vers Zod

Ce guide explique comment migrer les DTOs existants de class-validator vers Zod.

## 📋 Table des Matières

1. [Pourquoi Zod ?](#pourquoi-zod)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Migration Étape par Étape](#migration-étape-par-étape)
5. [Exemples de Conversion](#exemples-de-conversion)
6. [Bonnes Pratiques](#bonnes-pratiques)
7. [Tests](#tests)

## 🎯 Pourquoi Zod ?

### Avantages de Zod vs class-validator

| Fonctionnalité | class-validator | Zod |
|----------------|-----------------|-----|
| Type-safety | ⚠️ Partiel | ✅ Complet |
| Inférence de types | ❌ Non | ✅ Automatique |
| Composition | ⚠️ Limitée | ✅ Excellente |
| Messages d'erreur | ⚠️ Basiques | ✅ Personnalisables |
| Performance | ⚠️ Moyenne | ✅ Rapide |
| Réutilisabilité | ❌ Backend only | ✅ Frontend + Backend |
| Taille du bundle | ⚠️ Grande | ✅ Petite |

## 📦 Installation

```bash
npm install nestjs-zod zod-validation-error --save
```

## ⚙️ Configuration

### 1. Configurer le pipe global dans `main.ts`

```typescript
import { ZodValidationPipe } from 'nestjs-zod';

app.useGlobalPipes(
  new ZodValidationPipe({
    createValidationException: (error) => {
      return new BadRequestException({
        statusCode: 400,
        error: 'Erreur de validation',
        message: error.message,
        details: error.errors,
      });
    },
  }),
);
```

### 2. Créer le dossier schemas

```
src/
└── [module]/
    ├── dto/              # Anciens DTOs (à supprimer progressivement)
    ├── schemas/          # Nouveaux schémas Zod
    │   ├── [module].schemas.ts
    │   ├── [module].schemas.spec.ts
    │   └── README.md
    └── ...
```

## 🔄 Migration Étape par Étape

### Étape 1: Créer le fichier de schémas

Créez `src/[module]/schemas/[module].schemas.ts`:

```typescript
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Définir le schéma Zod
export const createEntitySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email().optional(),
});

// Créer le DTO NestJS
export class CreateEntityDto extends createZodDto(createEntitySchema) {}
```

### Étape 2: Mettre à jour les imports dans les contrôleurs

**Avant:**
```typescript
import { CreateEntityDto } from '../dto/create-entity.dto';
```

**Après:**
```typescript
import { CreateEntityDto } from '../schemas/[module].schemas';
```

### Étape 3: Tester

Exécutez les tests pour vérifier que tout fonctionne:

```bash
npm run test
```

### Étape 4: Supprimer l'ancien DTO

Une fois que tout fonctionne, supprimez l'ancien fichier DTO.

## 📝 Exemples de Conversion

### Exemple 1: DTO Simple

**Avant (class-validator):**
```typescript
import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;
}
```

**Après (Zod):**
```typescript
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Le nom est obligatoire' })
    .trim()
    .min(1, 'Le nom ne peut pas être vide')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),

  email: z
    .string()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),

  bio: z
    .string()
    .trim()
    .max(500, 'La bio ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
```

### Exemple 2: DTO avec Nombres

**Avant (class-validator):**
```typescript
import { IsNumber, Min, Max, IsInt } from 'class-validator';

export class CreateProductDto {
  @IsNumber()
  @Min(0)
  @Max(999999.999)
  price: number;

  @IsInt()
  @Min(0)
  stock: number;
}
```

**Après (Zod):**
```typescript
export const createProductSchema = z.object({
  price: z.coerce
    .number({ invalid_type_error: 'Le prix doit être un nombre' })
    .min(0, 'Le prix ne peut pas être négatif')
    .max(999999.999, 'Le prix ne peut pas dépasser 999999.999')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  stock: z.coerce
    .number({ invalid_type_error: 'Le stock doit être un nombre' })
    .int('Le stock doit être un nombre entier')
    .min(0, 'Le stock ne peut pas être négatif'),
});

export class CreateProductDto extends createZodDto(createProductSchema) {}
```

### Exemple 3: DTO avec Objets Imbriqués

**Avant (class-validator):**
```typescript
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString() street: string;
  @IsString() city: string;
}

export class CreateCompanyDto {
  @IsString() name: string;
  
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

**Après (Zod):**
```typescript
const addressSchema = z.object({
  street: z.string().trim().min(1),
  city: z.string().trim().min(1),
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(1),
  address: addressSchema,
});

export class CreateCompanyDto extends createZodDto(createCompanySchema) {}
```

### Exemple 4: DTO avec Tableaux

**Avant (class-validator):**
```typescript
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString() name: string;
  @IsNumber() quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
```

**Après (Zod):**
```typescript
const itemSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
});

export const createOrderSchema = z.object({
  items: z
    .array(itemSchema)
    .min(1, 'La commande doit contenir au moins un article'),
});

export class CreateOrderDto extends createZodDto(createOrderSchema) {}
```

### Exemple 5: DTO avec Enums

**Avant (class-validator):**
```typescript
import { IsEnum } from 'class-validator';

enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class UpdateStatusDto {
  @IsEnum(Status)
  status: Status;
}
```

**Après (Zod):**
```typescript
export const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Statut invalide' }),
  }),
});

export class UpdateStatusDto extends createZodDto(updateStatusSchema) {}
```

## 🎨 Bonnes Pratiques

### 1. Helpers Réutilisables

Créez des helpers pour les validations communes:

```typescript
// Montants en TND
const amountTND = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} doit être un nombre` })
    .min(0, `${label} ne peut pas être négatif`)
    .max(99999999.999, `${label} ne peut pas dépasser 99999999.999 TND`)
    .multipleOf(0.001, `${label} doit avoir au maximum 3 décimales`);

// Dates ISO
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : YYYY-MM-DD)')
  .optional()
  .or(z.literal(''));

// Téléphone tunisien
const tunisianPhone = z
  .string()
  .trim()
  .regex(/^[+]?[\d\s\-().]{8,20}$/, 'Numéro de téléphone invalide')
  .optional()
  .or(z.literal(''));
```

### 2. Composition de Schémas

Réutilisez les schémas existants:

```typescript
// Schéma de base
export const baseEntitySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
});

// Schéma étendu
export const createEntitySchema = baseEntitySchema.extend({
  category: z.string().trim().min(1),
  price: amountTND('Le prix'),
});

// Schéma de mise à jour (tous les champs optionnels)
export const updateEntitySchema = createEntitySchema.partial();
```

### 3. Messages d'Erreur en Français

Toujours fournir des messages d'erreur clairs en français:

```typescript
z.string({ required_error: 'Le nom est obligatoire' })
  .trim()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(200, 'Le nom ne peut pas dépasser 200 caractères')
```

### 4. Validation Conditionnelle

Utilisez `refine` pour des validations complexes:

```typescript
export const createInvoiceSchema = z.object({
  subtotal_ht: amountTND('Le sous-total HT'),
  tax_amount: amountTND('La TVA'),
  net_amount: amountTND('Le montant net'),
}).refine(
  (data) => data.net_amount === data.subtotal_ht + data.tax_amount,
  {
    message: 'Le montant net doit être égal à HT + TVA',
    path: ['net_amount'],
  }
);
```

## 🧪 Tests

### Test Unitaire d'un Schéma

```typescript
import { describe, it, expect } from '@jest/globals';
import { createUserSchema } from './user.schemas';

describe('createUserSchema', () => {
  it('devrait valider un utilisateur valide', () => {
    const validUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('devrait rejeter un email invalide', () => {
    const invalidUser = {
      name: 'John Doe',
      email: 'invalid-email',
    };

    const result = createUserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('email invalide');
    }
  });
});
```

### Test d'Intégration avec NestJS

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/users (POST) - devrait rejeter un email invalide', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'invalid-email',
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Erreur de validation');
        expect(res.body.details).toBeDefined();
      });
  });
});
```

## 📚 Ressources

- [Documentation Zod](https://zod.dev/)
- [Documentation nestjs-zod](https://github.com/risen228/nestjs-zod)
- [Zod Validation Error](https://github.com/causaly/zod-validation-error)
- [Exemples dans le module Purchases](./src/Purchases/schemas/)

## ✅ Checklist de Migration

- [ ] Installer les dépendances (`nestjs-zod`, `zod-validation-error`)
- [ ] Configurer le pipe global dans `main.ts`
- [ ] Créer le dossier `schemas/` dans le module
- [ ] Créer les helpers réutilisables
- [ ] Convertir les DTOs un par un
- [ ] Mettre à jour les imports dans les contrôleurs
- [ ] Écrire les tests unitaires
- [ ] Exécuter les tests d'intégration
- [ ] Supprimer les anciens DTOs
- [ ] Mettre à jour la documentation

## 🎯 Modules à Migrer

- [x] Purchases (Achat) - ✅ Complété
- [ ] Sales (Vente)
- [ ] Inventory (Stock)
- [ ] Accounting (Comptabilité)
- [ ] Users (Utilisateurs)
- [ ] Businesses (Entreprises)
- [ ] Auth (Authentification)
