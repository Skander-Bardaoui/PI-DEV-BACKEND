# 🎓 GUIDE TECHNIQUE - CONCEPTS ET TECHNOLOGIES

## 📋 Table des matières

1. [Backend - NestJS & TypeScript](#backend---nestjs--typescript)
2. [Base de données - PostgreSQL & TypeORM](#base-de-données---postgresql--typeorm)
3. [Frontend - React & TypeScript](#frontend---react--typescript)
4. [Architecture et patterns](#architecture-et-patterns)
5. [APIs et communication](#apis-et-communication)
6. [Sécurité](#sécurité)
7. [DevOps et déploiement](#devops-et-déploiement)
8. [Intelligence Artificielle](#intelligence-artificielle)

---

## 🔧 Backend - NestJS & TypeScript

### Qu'est-ce que NestJS ?

**NestJS** est un framework Node.js pour construire des applications backend scalables et maintenables.

**Pourquoi NestJS ?**
- ✅ Architecture modulaire (comme Angular)
- ✅ TypeScript natif
- ✅ Injection de dépendances
- ✅ Décorateurs pour simplifier le code
- ✅ Support natif de TypeORM, GraphQL, WebSockets
- ✅ Excellente documentation
- ✅ Écosystème riche

**Exemple de structure NestJS :**
```typescript
// Module
@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class PurchasesModule {}

// Controller (gère les requêtes HTTP)
@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}
  
  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }
}

// Service (logique métier)
@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
  ) {}
  
  findAll() {
    return this.supplierRepo.find();
  }
}
```

### Qu'est-ce que TypeScript ?

**TypeScript** est un sur-ensemble de JavaScript qui ajoute le typage statique.

**Pourquoi TypeScript ?**
- ✅ Détection d'erreurs à la compilation
- ✅ Autocomplétion intelligente
- ✅ Refactoring sûr
- ✅ Documentation intégrée
- ✅ Meilleure maintenabilité

**Exemple :**
```typescript
// JavaScript (pas de types)
function calculateTotal(price, quantity) {
  return price * quantity; // Erreur si price est une string !
}

// TypeScript (avec types)
function calculateTotal(price: number, quantity: number): number {
  return price * quantity; // Erreur de compilation si mauvais type
}

// Interfaces
interface Supplier {
  id: string;
  name: string;
  email: string;
  payment_terms: number;
}

// Types personnalisés
type POStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'RECEIVED';
```

### Qu'est-ce qu'un Décorateur ?

**Décorateur** = Fonction qui modifie le comportement d'une classe, méthode ou propriété.

**Décorateurs NestJS courants :**
```typescript
// Décorateurs de classe
@Controller('suppliers')  // Définit un contrôleur
@Injectable()            // Rend la classe injectable
@Module({...})          // Définit un module

// Décorateurs de méthode
@Get()                  // Route GET
@Post()                 // Route POST
@Patch(':id')          // Route PATCH avec paramètre
@UseGuards(JwtAuthGuard) // Applique un guard

// Décorateurs de paramètre
@Param('id')           // Récupère un paramètre d'URL
@Body()                // Récupère le body de la requête
@Query()               // Récupère les query params
@Req()                 // Récupère l'objet request
```

### Qu'est-ce que l'Injection de Dépendances ?

**Injection de Dépendances (DI)** = Pattern où les dépendances sont fournies automatiquement par le framework.

**Sans DI :**
```typescript
class SuppliersController {
  private service: SuppliersService;
  
  constructor() {
    // On doit créer manuellement
    this.service = new SuppliersService();
  }
}
```

**Avec DI (NestJS) :**
```typescript
@Controller('suppliers')
class SuppliersController {
  // NestJS injecte automatiquement
  constructor(private service: SuppliersService) {}
}
```

**Avantages :**
- ✅ Code plus testable (on peut injecter des mocks)
- ✅ Moins de couplage
- ✅ Gestion automatique du cycle de vie
- ✅ Singleton par défaut

---


## 🗄️ Base de données - PostgreSQL & TypeORM

### Qu'est-ce que PostgreSQL ?

**PostgreSQL** est un système de gestion de base de données relationnelle (SGBDR) open-source.

**Pourquoi PostgreSQL ?**
- ✅ Très performant
- ✅ Support JSONB (données flexibles)
- ✅ Transactions ACID
- ✅ Contraintes d'intégrité
- ✅ Index puissants
- ✅ Extensions (PostGIS, pg_trgm, etc.)
- ✅ Gratuit et open-source

**Concepts clés :**
- **Table** : Structure de données (comme une feuille Excel)
- **Colonne** : Champ de données (nom, email, etc.)
- **Ligne** : Enregistrement (un fournisseur, une facture)
- **Clé primaire** : Identifiant unique (id)
- **Clé étrangère** : Référence vers une autre table
- **Index** : Accélère les recherches
- **Transaction** : Groupe d'opérations atomiques

### Qu'est-ce qu'un ORM ?

**ORM (Object-Relational Mapping)** = Outil qui fait le pont entre les objets (code) et les tables (base de données).

**Sans ORM (SQL brut) :**
```typescript
const result = await db.query(
  'SELECT * FROM suppliers WHERE business_id = $1 AND is_active = true',
  [businessId]
);
const suppliers = result.rows;
```

**Avec ORM (TypeORM) :**
```typescript
const suppliers = await supplierRepo.find({
  where: { business_id: businessId, is_active: true }
});
```

**Pourquoi utiliser un ORM ?**
- ✅ Code plus lisible et maintenable
- ✅ Protection contre les injections SQL
- ✅ Typage fort (TypeScript)
- ✅ Migrations automatiques
- ✅ Relations gérées automatiquement
- ✅ Moins de code boilerplate

**Inconvénients :**
- ❌ Légère perte de performance
- ❌ Requêtes complexes parfois difficiles
- ❌ Courbe d'apprentissage

### Qu'est-ce que TypeORM ?

**TypeORM** est l'ORM le plus populaire pour TypeScript/Node.js.

**Concepts TypeORM :**

#### 1. Entity (Entité)
Une classe qui représente une table.

```typescript
@Entity('suppliers')  // Nom de la table
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'varchar', length: 255 })
  name: string;
  
  @Column({ type: 'boolean', default: true })
  is_active: boolean;
  
  @CreateDateColumn()
  created_at: Date;
}
```

#### 2. Relations
Liens entre tables.

```typescript
// One-to-Many (Un fournisseur a plusieurs BC)
@Entity('suppliers')
export class Supplier {
  @OneToMany(() => SupplierPO, po => po.supplier)
  supplier_pos: SupplierPO[];
}

// Many-to-One (Plusieurs BC appartiennent à un fournisseur)
@Entity('supplier_pos')
export class SupplierPO {
  @ManyToOne(() => Supplier, supplier => supplier.supplier_pos)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}

// One-to-One (Un utilisateur a un profil)
@OneToOne(() => Profile)
@JoinColumn()
profile: Profile;

// Many-to-Many (Produits ↔ Catégories)
@ManyToMany(() => Category)
@JoinTable()
categories: Category[];
```

#### 3. Repository
Interface pour interagir avec la base de données.

```typescript
@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
  ) {}
  
  // Méthodes du repository
  async findAll() {
    return this.supplierRepo.find();
  }
  
  async findOne(id: string) {
    return this.supplierRepo.findOne({ where: { id } });
  }
  
  async create(data: CreateSupplierDto) {
    const supplier = this.supplierRepo.create(data);
    return this.supplierRepo.save(supplier);
  }
  
  async update(id: string, data: UpdateSupplierDto) {
    await this.supplierRepo.update(id, data);
    return this.findOne(id);
  }
  
  async delete(id: string) {
    return this.supplierRepo.delete(id);
  }
}
```

#### 4. Query Builder
Pour des requêtes complexes.

```typescript
const suppliers = await this.supplierRepo
  .createQueryBuilder('supplier')
  .leftJoinAndSelect('supplier.supplier_pos', 'pos')
  .where('supplier.business_id = :businessId', { businessId })
  .andWhere('supplier.is_active = :active', { active: true })
  .orderBy('supplier.name', 'ASC')
  .take(10)
  .skip(0)
  .getMany();
```

#### 5. Migrations
Gestion des changements de schéma.

```typescript
// Créer une migration
// npm run migration:generate -- -n AddEmailToSupplier

export class AddEmailToSupplier1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('suppliers', new TableColumn({
      name: 'email',
      type: 'varchar',
      length: '255',
      isNullable: true,
    }));
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('suppliers', 'email');
  }
}
```

### Qu'est-ce qu'un Index ?

**Index** = Structure de données qui accélère les recherches.

**Sans index :**
```sql
-- Scan complet de la table (lent si 1M de lignes)
SELECT * FROM suppliers WHERE name = 'Acme Corp';
```

**Avec index :**
```typescript
@Entity('suppliers')
@Index(['business_id', 'name'])  // Index composite
export class Supplier {
  @Column()
  @Index()  // Index simple
  business_id: string;
  
  @Column()
  name: string;
}
```

**Quand créer un index ?**
- ✅ Colonnes utilisées dans WHERE
- ✅ Colonnes utilisées dans JOIN
- ✅ Colonnes utilisées dans ORDER BY
- ✅ Clés étrangères

**Inconvénients :**
- ❌ Ralentit les INSERT/UPDATE
- ❌ Prend de l'espace disque

### Qu'est-ce qu'une Transaction ?

**Transaction** = Groupe d'opérations qui réussissent ou échouent ensemble.

**Propriétés ACID :**
- **A**tomicité : Tout ou rien
- **C**ohérence : Données valides
- **I**solation : Transactions indépendantes
- **D**urabilité : Changements permanents

**Exemple :**
```typescript
async createInvoiceWithPayment(invoiceData, paymentData) {
  // Démarrer une transaction
  return await this.dataSource.transaction(async (manager) => {
    // Créer la facture
    const invoice = await manager.save(PurchaseInvoice, invoiceData);
    
    // Créer le paiement
    const payment = await manager.save(SupplierPayment, {
      ...paymentData,
      invoice_id: invoice.id,
    });
    
    // Si une erreur survient, tout est annulé (rollback)
    return { invoice, payment };
  });
}
```

---


## ⚛️ Frontend - React & TypeScript

### Qu'est-ce que React ?

**React** est une bibliothèque JavaScript pour construire des interfaces utilisateur.

**Pourquoi React ?**
- ✅ Composants réutilisables
- ✅ Virtual DOM (performance)
- ✅ Écosystème riche
- ✅ Communauté énorme
- ✅ React Hooks (logique réutilisable)
- ✅ JSX (HTML dans JS)

**Exemple de composant :**
```typescript
// Composant fonctionnel
function SupplierCard({ supplier }: { supplier: Supplier }) {
  return (
    <div className="card">
      <h3>{supplier.name}</h3>
      <p>{supplier.email}</p>
    </div>
  );
}

// Avec state
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Qu'est-ce qu'un Hook React ?

**Hook** = Fonction qui permet d'utiliser les fonctionnalités React dans les composants fonctionnels.

#### Hooks natifs React

**1. useState** - Gérer l'état local
```typescript
const [value, setValue] = useState(initialValue);

// Exemple
const [name, setName] = useState('');
const [isOpen, setIsOpen] = useState(false);
const [items, setItems] = useState<Item[]>([]);
```

**2. useEffect** - Effets de bord (API calls, subscriptions)
```typescript
useEffect(() => {
  // Code à exécuter
  
  return () => {
    // Cleanup (optionnel)
  };
}, [dependencies]);

// Exemple : Charger des données
useEffect(() => {
  fetchSuppliers();
}, []); // [] = exécuté une seule fois au montage

// Exemple : Réagir à un changement
useEffect(() => {
  if (supplierId) {
    fetchSupplierDetails(supplierId);
  }
}, [supplierId]); // Exécuté quand supplierId change
```

**3. useContext** - Accéder au contexte
```typescript
const theme = useContext(ThemeContext);
const user = useContext(AuthContext);
```

**4. useRef** - Référence à un élément DOM
```typescript
const inputRef = useRef<HTMLInputElement>(null);

// Accéder à l'élément
inputRef.current?.focus();

// Dans le JSX
<input ref={inputRef} />
```

**5. useMemo** - Mémoriser un calcul coûteux
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]); // Recalculé seulement si a ou b change
```

**6. useCallback** - Mémoriser une fonction
```typescript
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]); // Nouvelle fonction seulement si value change
```

#### Hooks personnalisés

**Hook personnalisé** = Fonction qui utilise d'autres hooks.

```typescript
// useSuppliers.ts
export function useSuppliers(businessId: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await api.get(`/suppliers?business_id=${businessId}`);
        setSuppliers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [businessId]);
  
  return { suppliers, loading, error };
}

// Utilisation
function SuppliersPage() {
  const { suppliers, loading, error } = useSuppliers(businessId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {suppliers.map(s => <SupplierCard key={s.id} supplier={s} />)}
    </div>
  );
}
```

### Qu'est-ce que React Query ?

**React Query (TanStack Query)** = Bibliothèque pour gérer les données serveur (cache, synchronisation, etc.).

**Pourquoi React Query ?**
- ✅ Cache automatique
- ✅ Refetch automatique
- ✅ Optimistic updates
- ✅ Pagination/Infinite scroll
- ✅ Mutations simplifiées
- ✅ Moins de code boilerplate

**Exemple :**
```typescript
// Hook avec React Query
export function useSuppliers(businessId: string) {
  return useQuery({
    queryKey: ['suppliers', businessId],
    queryFn: () => api.get(`/suppliers?business_id=${businessId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation (POST, PATCH, DELETE)
export function useCreateSupplier(businessId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSupplierDto) => 
      api.post('/suppliers', data),
    onSuccess: () => {
      // Invalider le cache pour refetch
      queryClient.invalidateQueries(['suppliers', businessId]);
    },
  });
}

// Utilisation
function SuppliersPage() {
  const { data, isLoading, error } = useSuppliers(businessId);
  const createSupplier = useCreateSupplier(businessId);
  
  const handleCreate = async (data: CreateSupplierDto) => {
    await createSupplier.mutateAsync(data);
  };
  
  return (
    <div>
      {data?.map(s => <SupplierCard key={s.id} supplier={s} />)}
    </div>
  );
}
```

### Qu'est-ce que JSX ?

**JSX** = Syntaxe qui permet d'écrire du HTML dans JavaScript.

```typescript
// JSX
const element = <h1>Hello, {name}!</h1>;

// Compilé en JavaScript
const element = React.createElement('h1', null, 'Hello, ', name, '!');

// JSX avec conditions
{isLoggedIn ? <Dashboard /> : <Login />}

// JSX avec boucles
{items.map(item => <Item key={item.id} data={item} />)}

// JSX avec événements
<button onClick={handleClick}>Click me</button>

// JSX avec classes CSS
<div className="card shadow-lg">Content</div>
```

### Qu'est-ce que Tailwind CSS ?

**Tailwind CSS** = Framework CSS utility-first.

**Pourquoi Tailwind ?**
- ✅ Pas besoin d'écrire de CSS
- ✅ Classes utilitaires réutilisables
- ✅ Design system cohérent
- ✅ Responsive facile
- ✅ Purge automatique (petit bundle)

**Exemple :**
```typescript
// Sans Tailwind (CSS classique)
<div className="card">
  <h2 className="title">Title</h2>
</div>

// styles.css
.card {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

// Avec Tailwind
<div className="p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold">Title</h2>
</div>

// Classes courantes
className="
  p-4              // padding: 1rem
  mt-2             // margin-top: 0.5rem
  bg-blue-600      // background: blue
  text-white       // color: white
  rounded-lg       // border-radius: 0.5rem
  shadow-md        // box-shadow
  hover:bg-blue-700 // hover state
  md:flex          // flex sur écrans moyens+
"
```

### Qu'est-ce qu'un Composant Contrôlé ?

**Composant contrôlé** = Input dont la valeur est gérée par React state.

```typescript
// Contrôlé (recommandé)
function Form() {
  const [name, setName] = useState('');
  
  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}

// Non contrôlé (déconseillé)
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = () => {
    console.log(inputRef.current?.value);
  };
  
  return <input ref={inputRef} />;
}
```

### Qu'est-ce que React Hook Form ?

**React Hook Form** = Bibliothèque pour gérer les formulaires facilement.

**Pourquoi React Hook Form ?**
- ✅ Moins de re-renders
- ✅ Validation intégrée
- ✅ Moins de code
- ✅ Performance optimale

**Exemple :**
```typescript
import { useForm } from 'react-hook-form';

function SupplierForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = (data) => {
    console.log(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Nom requis' })}
        placeholder="Nom"
      />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input
        {...register('email', {
          required: 'Email requis',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Email invalide'
          }
        })}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">Enregistrer</button>
    </form>
  );
}
```

---


## 🏛️ Architecture et patterns

### Qu'est-ce que l'Architecture en couches ?

**Architecture en couches** = Séparation du code en couches avec des responsabilités distinctes.

```
┌─────────────────────────────────┐
│   Presentation Layer (UI)       │  ← React Components
├─────────────────────────────────┤
│   API Layer (Controllers)       │  ← NestJS Controllers
├─────────────────────────────────┤
│   Business Logic (Services)     │  ← NestJS Services
├─────────────────────────────────┤
│   Data Access (Repositories)    │  ← TypeORM Repositories
├─────────────────────────────────┤
│   Database (PostgreSQL)         │  ← Tables
└─────────────────────────────────┘
```

**Avantages :**
- ✅ Séparation des responsabilités
- ✅ Code testable
- ✅ Maintenabilité
- ✅ Réutilisabilité

### Qu'est-ce que le pattern MVC ?

**MVC (Model-View-Controller)** = Pattern de conception pour séparer les données, la logique et l'interface.

```
Model (Entités)      ← Données
  ↕
Controller           ← Logique de routage
  ↕
Service              ← Logique métier
  ↕
View (React)         ← Interface utilisateur
```

**Dans notre projet :**
- **Model** : Entités TypeORM (Supplier, SupplierPO, etc.)
- **Controller** : Contrôleurs NestJS (SuppliersController)
- **Service** : Services NestJS (SuppliersService)
- **View** : Composants React (SuppliersPage)

### Qu'est-ce qu'un DTO ?

**DTO (Data Transfer Object)** = Objet qui définit la structure des données transférées.

**Pourquoi des DTOs ?**
- ✅ Validation des données
- ✅ Documentation automatique (Swagger)
- ✅ Typage fort
- ✅ Transformation des données

**Exemple :**
```typescript
// create-supplier.dto.ts
export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsEmail()
  @IsOptional()
  email?: string;
  
  @IsNumber()
  @Min(0)
  @Max(365)
  payment_terms: number;
  
  @IsBoolean()
  @IsOptional()
  is_active?: boolean = true;
}

// Controller
@Post()
async create(@Body() dto: CreateSupplierDto) {
  // dto est automatiquement validé
  return this.service.create(dto);
}
```

### Qu'est-ce qu'un Guard ?

**Guard** = Fonction qui détermine si une requête peut être traitée.

**Utilisations :**
- Authentification (utilisateur connecté ?)
- Autorisation (utilisateur a les droits ?)
- Validation de business rules

**Exemple :**
```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Vérifie le token JWT
    return super.canActivate(context);
  }
}

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}

// Utilisation
@Controller('suppliers')
@UseGuards(JwtAuthGuard)  // Toutes les routes nécessitent auth
export class SuppliersController {
  
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')  // Seulement les admins
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
```

### Qu'est-ce qu'un Middleware ?

**Middleware** = Fonction qui s'exécute avant le contrôleur.

**Utilisations :**
- Logging
- Authentification
- Transformation de requête
- Rate limiting

**Exemple :**
```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`);
    next();
  }
}

// Application
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');  // Toutes les routes
  }
}
```

### Qu'est-ce qu'un Pipe ?

**Pipe** = Fonction qui transforme ou valide les données d'entrée.

**Pipes natifs NestJS :**
- `ValidationPipe` : Valide les DTOs
- `ParseIntPipe` : Convertit en nombre
- `ParseUUIDPipe` : Valide un UUID

**Exemple :**
```typescript
// Validation automatique
@Post()
async create(
  @Body(ValidationPipe) dto: CreateSupplierDto
) {
  return this.service.create(dto);
}

// Transformation
@Get(':id')
async findOne(
  @Param('id', ParseUUIDPipe) id: string
) {
  return this.service.findOne(id);
}

// Pipe personnalisé
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }
}
```

### Qu'est-ce que le pattern Repository ?

**Repository Pattern** = Abstraction de l'accès aux données.

**Avantages :**
- ✅ Séparation de la logique métier et de l'accès aux données
- ✅ Facilite les tests (on peut mocker le repository)
- ✅ Changement de base de données facilité

**Exemple :**
```typescript
// Sans repository (mauvais)
@Injectable()
export class SuppliersService {
  async findAll() {
    // Logique SQL directe dans le service
    return db.query('SELECT * FROM suppliers');
  }
}

// Avec repository (bon)
@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private repo: Repository<Supplier>,
  ) {}
  
  async findAll() {
    // Abstraction de l'accès aux données
    return this.repo.find();
  }
}
```

### Qu'est-ce que le pattern Factory ?

**Factory Pattern** = Pattern pour créer des objets complexes.

**Exemple :**
```typescript
// Supplier Factory
export class SupplierFactory {
  static create(dto: CreateSupplierDto, businessId: string): Supplier {
    const supplier = new Supplier();
    supplier.business_id = businessId;
    supplier.name = dto.name;
    supplier.email = dto.email;
    supplier.payment_terms = dto.payment_terms ?? 30;
    supplier.is_active = dto.is_active ?? true;
    supplier.created_at = new Date();
    return supplier;
  }
  
  static createFromOnboarding(data: OnboardingData): Supplier {
    // Logique différente pour l'onboarding
    const supplier = new Supplier();
    // ...
    return supplier;
  }
}
```

---


## 🌐 APIs et communication

### Qu'est-ce qu'une API REST ?

**REST (Representational State Transfer)** = Style d'architecture pour les APIs web.

**Principes REST :**
1. **Stateless** : Chaque requête est indépendante
2. **Client-Server** : Séparation frontend/backend
3. **Cacheable** : Réponses peuvent être mises en cache
4. **Uniform Interface** : URLs et méthodes HTTP standardisées

**Méthodes HTTP :**
```
GET     /suppliers          # Lire (liste)
GET     /suppliers/:id      # Lire (un)
POST    /suppliers          # Créer
PATCH   /suppliers/:id      # Modifier (partiel)
PUT     /suppliers/:id      # Modifier (complet)
DELETE  /suppliers/:id      # Supprimer
```

**Codes de statut HTTP :**
```
200 OK                  # Succès
201 Created             # Ressource créée
204 No Content          # Succès sans contenu
400 Bad Request         # Erreur client (validation)
401 Unauthorized        # Non authentifié
403 Forbidden           # Non autorisé
404 Not Found           # Ressource introuvable
500 Internal Server Error # Erreur serveur
```

### Qu'est-ce que JSON ?

**JSON (JavaScript Object Notation)** = Format de données texte.

**Exemple :**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "payment_terms": 30,
  "is_active": true,
  "address": {
    "street": "123 Main St",
    "city": "Tunis",
    "country": "Tunisia"
  },
  "tags": ["electronics", "wholesale"]
}
```

**Types JSON :**
- `string` : "texte"
- `number` : 42, 3.14
- `boolean` : true, false
- `null` : null
- `object` : { key: value }
- `array` : [1, 2, 3]

### Qu'est-ce qu'Axios ?

**Axios** = Bibliothèque pour faire des requêtes HTTP.

**Pourquoi Axios ?**
- ✅ Syntaxe simple
- ✅ Intercepteurs (pour ajouter token, etc.)
- ✅ Transformation automatique JSON
- ✅ Gestion d'erreurs
- ✅ Timeout
- ✅ Cancel requests

**Exemple :**
```typescript
// Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Requêtes
const suppliers = await api.get('/suppliers');
const supplier = await api.get(`/suppliers/${id}`);
const newSupplier = await api.post('/suppliers', data);
const updated = await api.patch(`/suppliers/${id}`, data);
await api.delete(`/suppliers/${id}`);

// Gestion d'erreurs
try {
  const data = await api.get('/suppliers');
} catch (error) {
  if (error.response) {
    // Erreur serveur (4xx, 5xx)
    console.log(error.response.status);
    console.log(error.response.data);
  } else if (error.request) {
    // Pas de réponse
    console.log('No response');
  } else {
    // Erreur de configuration
    console.log(error.message);
  }
}
```

### Qu'est-ce que CORS ?

**CORS (Cross-Origin Resource Sharing)** = Mécanisme de sécurité pour les requêtes cross-origin.

**Problème :**
```
Frontend: http://localhost:5173
Backend:  http://localhost:3000

❌ Bloqué par le navigateur (origines différentes)
```

**Solution (NestJS) :**
```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: ['http://localhost:5173', 'https://myapp.com'],
  credentials: true,
});
```

### Qu'est-ce qu'un WebSocket ?

**WebSocket** = Protocole pour communication bidirectionnelle en temps réel.

**HTTP vs WebSocket :**
```
HTTP:
Client → Request  → Server
Client ← Response ← Server
(Une requête = une réponse)

WebSocket:
Client ↔ Server
(Communication continue)
```

**Utilisations :**
- Chat en temps réel
- Notifications live
- Collaboration en temps réel
- Streaming de données

**Exemple (NestJS) :**
```typescript
@WebSocketGateway()
export class AlertsGateway {
  @WebSocketServer()
  server: Server;
  
  // Envoyer une alerte à tous les clients
  sendAlert(alert: PurchaseAlert) {
    this.server.emit('new-alert', alert);
  }
}

// Frontend
const socket = io('http://localhost:3000');
socket.on('new-alert', (alert) => {
  console.log('New alert:', alert);
});
```

### Qu'est-ce que la Pagination ?

**Pagination** = Diviser les résultats en pages.

**Pourquoi paginer ?**
- ✅ Performance (ne pas charger 10000 lignes)
- ✅ UX (navigation plus facile)
- ✅ Bande passante réduite

**Types de pagination :**

**1. Offset-based (utilisé dans notre projet)**
```typescript
// Backend
@Get()
async findAll(
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  const skip = (page - 1) * limit;
  const [data, total] = await this.repo.findAndCount({
    skip,
    take: limit,
  });
  
  return {
    data,
    total,
    page,
    total_pages: Math.ceil(total / limit),
  };
}

// Frontend
const { data } = useSuppliers(businessId, { page: 1, limit: 10 });
```

**2. Cursor-based (pour infinite scroll)**
```typescript
// Backend
@Get()
async findAll(@Query('cursor') cursor?: string) {
  const query = this.repo.createQueryBuilder('s');
  
  if (cursor) {
    query.where('s.id > :cursor', { cursor });
  }
  
  const data = await query.take(20).getMany();
  const nextCursor = data[data.length - 1]?.id;
  
  return { data, nextCursor };
}
```

### Qu'est-ce qu'un Query Parameter ?

**Query Parameter** = Paramètre dans l'URL après `?`.

```
GET /suppliers?page=2&limit=10&category=IT&is_active=true
            ↑
         Query params
```

**Backend (NestJS) :**
```typescript
@Get()
async findAll(
  @Query('page') page: number,
  @Query('limit') limit: number,
  @Query('category') category?: string,
  @Query('is_active') isActive?: boolean,
) {
  // ...
}
```

**Frontend (Axios) :**
```typescript
const response = await api.get('/suppliers', {
  params: {
    page: 2,
    limit: 10,
    category: 'IT',
    is_active: true,
  },
});
```

### Qu'est-ce qu'un Path Parameter ?

**Path Parameter** = Paramètre dans le chemin de l'URL.

```
GET /suppliers/123e4567-e89b-12d3-a456-426614174000
               ↑
            Path param (id)
```

**Backend (NestJS) :**
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}

@Patch(':id/archive')
async archive(@Param('id') id: string) {
  return this.service.archive(id);
}
```

**Frontend (Axios) :**
```typescript
const supplier = await api.get(`/suppliers/${id}`);
await api.patch(`/suppliers/${id}/archive`);
```

---


## 🔒 Sécurité

### Qu'est-ce que JWT ?

**JWT (JSON Web Token)** = Token pour l'authentification stateless.

**Structure JWT :**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Header.Payload.Signature
```

**Décodé :**
```json
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "user-id",
  "email": "user@example.com",
  "iat": 1516239022,
  "exp": 1516242622
}

// Signature (vérifiée par le serveur)
```

**Pourquoi JWT ?**
- ✅ Stateless (pas de session serveur)
- ✅ Scalable (plusieurs serveurs)
- ✅ Portable (mobile, web, etc.)
- ✅ Auto-contenu (toutes les infos dans le token)

**Exemple (NestJS) :**
```typescript
// Génération du token
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  
  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      business_id: user.business_id,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

// Vérification du token
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  
  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      business_id: payload.business_id,
    };
  }
}

// Frontend
const token = localStorage.getItem('token');
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Qu'est-ce que le hachage de mot de passe ?

**Hachage** = Transformation irréversible d'un mot de passe.

**Pourquoi hacher ?**
- ✅ Sécurité (même si la DB est compromise)
- ✅ Irréversible (impossible de retrouver le mot de passe)

**Exemple (bcrypt) :**
```typescript
import * as bcrypt from 'bcrypt';

// Hacher un mot de passe
const password = 'myPassword123';
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
// $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

// Vérifier un mot de passe
const isMatch = await bcrypt.compare(password, hashedPassword);
// true
```

**❌ Ne JAMAIS faire :**
```typescript
// Stocker en clair
user.password = 'myPassword123';

// Encoder (réversible)
user.password = btoa('myPassword123');

// MD5 (trop faible)
user.password = md5('myPassword123');
```

### Qu'est-ce que l'injection SQL ?

**Injection SQL** = Attaque où l'attaquant insère du code SQL malveillant.

**Exemple d'attaque :**
```typescript
// Code vulnérable
const email = req.body.email; // "admin@example.com' OR '1'='1"
const query = `SELECT * FROM users WHERE email = '${email}'`;
// SELECT * FROM users WHERE email = 'admin@example.com' OR '1'='1'
// ❌ Retourne TOUS les utilisateurs !

// Protection avec paramètres
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);
// ✅ Sécurisé

// Avec TypeORM (automatiquement protégé)
const user = await userRepo.findOne({ where: { email } });
// ✅ Sécurisé
```

### Qu'est-ce que XSS ?

**XSS (Cross-Site Scripting)** = Attaque où l'attaquant injecte du JavaScript malveillant.

**Exemple d'attaque :**
```typescript
// Données malveillantes
const name = '<script>alert("XSS")</script>';

// Code vulnérable
<div>{name}</div>
// ❌ Le script s'exécute !

// Protection (React échappe automatiquement)
<div>{name}</div>
// ✅ Affiche le texte, n'exécute pas le script

// Danger avec dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: name }} />
// ❌ Le script s'exécute !

// Protection
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(name);
<div dangerouslySetInnerHTML={{ __html: clean }} />
// ✅ Sécurisé
```

### Qu'est-ce que CSRF ?

**CSRF (Cross-Site Request Forgery)** = Attaque où l'attaquant force l'utilisateur à faire une action non désirée.

**Exemple d'attaque :**
```html
<!-- Site malveillant -->
<img src="https://mybank.com/transfer?to=attacker&amount=1000" />
<!-- Si l'utilisateur est connecté, le transfert s'exécute ! -->
```

**Protection :**
```typescript
// Backend : Token CSRF
app.use(csurf());

// Frontend : Envoyer le token
<form>
  <input type="hidden" name="_csrf" value={csrfToken} />
</form>

// Ou avec SameSite cookies
res.cookie('token', jwt, {
  httpOnly: true,
  sameSite: 'strict',
});
```

### Qu'est-ce que la validation des données ?

**Validation** = Vérifier que les données sont correctes avant de les traiter.

**Pourquoi valider ?**
- ✅ Sécurité (éviter les injections)
- ✅ Intégrité des données
- ✅ UX (messages d'erreur clairs)

**Exemple (class-validator) :**
```typescript
import { IsString, IsEmail, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;
  
  @IsEmail()
  @IsOptional()
  email?: string;
  
  @IsNumber()
  @Min(0)
  @Max(365)
  payment_terms: number;
  
  @IsString()
  @Matches(/^[0-9]{13}$/, { message: 'Matricule fiscal invalide' })
  @IsOptional()
  matricule_fiscal?: string;
}

// NestJS valide automatiquement
@Post()
async create(@Body() dto: CreateSupplierDto) {
  // Si validation échoue, erreur 400 automatique
  return this.service.create(dto);
}
```

### Qu'est-ce que le Rate Limiting ?

**Rate Limiting** = Limiter le nombre de requêtes par utilisateur/IP.

**Pourquoi ?**
- ✅ Protection contre les attaques DDoS
- ✅ Protection contre le brute force
- ✅ Économie de ressources

**Exemple (NestJS) :**
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 60 secondes
      limit: 10,    // 10 requêtes max
    }),
  ],
})
export class AppModule {}

// Sur une route spécifique
@Throttle(5, 60)  // 5 requêtes par minute
@Post('login')
async login() {
  // ...
}
```

---


## 🚀 DevOps et déploiement

### Qu'est-ce que Docker ?

**Docker** = Plateforme pour créer, déployer et exécuter des applications dans des conteneurs.

**Conteneur vs Machine Virtuelle :**
```
Machine Virtuelle:
┌─────────────────────┐
│   App               │
│   OS complet        │  ← Lourd (GB)
│   Hypervisor        │
└─────────────────────┘

Conteneur Docker:
┌─────────────────────┐
│   App               │
│   Dépendances       │  ← Léger (MB)
│   Docker Engine     │
└─────────────────────┘
```

**Pourquoi Docker ?**
- ✅ Isolation (chaque app dans son conteneur)
- ✅ Portabilité (fonctionne partout)
- ✅ Reproductibilité (même environnement dev/prod)
- ✅ Léger et rapide
- ✅ Scalabilité facile

**Dockerfile :**
```dockerfile
# Image de base
FROM node:18-alpine

# Répertoire de travail
WORKDIR /app

# Copier package.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code
COPY . .

# Build
RUN npm run build

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "dist/main.js"]
```

**Commandes Docker :**
```bash
# Build une image
docker build -t my-app .

# Lancer un conteneur
docker run -p 3000:3000 my-app

# Lister les conteneurs
docker ps

# Arrêter un conteneur
docker stop <container-id>

# Voir les logs
docker logs <container-id>
```

### Qu'est-ce que Docker Compose ?

**Docker Compose** = Outil pour définir et exécuter des applications multi-conteneurs.

**docker-compose.yml :**
```yaml
version: '3.8'

services:
  # Backend
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db
  
  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
  
  # Base de données
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

**Commandes Docker Compose :**
```bash
# Démarrer tous les services
docker-compose up

# Démarrer en arrière-plan
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Rebuild les images
docker-compose build
```

### Qu'est-ce que Kubernetes (K8s) ?

**Kubernetes** = Plateforme d'orchestration de conteneurs.

**Pourquoi Kubernetes ?**
- ✅ Scalabilité automatique
- ✅ Auto-healing (redémarre les conteneurs crashés)
- ✅ Load balancing
- ✅ Rolling updates (déploiement sans downtime)
- ✅ Gestion des secrets
- ✅ Multi-cloud

**Concepts K8s :**

**1. Pod** = Plus petite unité déployable (1+ conteneurs)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend-pod
spec:
  containers:
  - name: backend
    image: my-backend:latest
    ports:
    - containerPort: 3000
```

**2. Deployment** = Gère les Pods (réplication, updates)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 3  # 3 instances
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: my-backend:latest
        ports:
        - containerPort: 3000
```

**3. Service** = Expose les Pods (load balancing)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**4. ConfigMap** = Configuration
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
```

**5. Secret** = Données sensibles
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
type: Opaque
data:
  DATABASE_PASSWORD: cGFzc3dvcmQxMjM=  # base64
```

**Commandes kubectl :**
```bash
# Appliquer une configuration
kubectl apply -f deployment.yaml

# Lister les pods
kubectl get pods

# Lister les services
kubectl get services

# Voir les logs
kubectl logs <pod-name>

# Scaler
kubectl scale deployment backend --replicas=5

# Mettre à jour l'image
kubectl set image deployment/backend backend=my-backend:v2
```

### Qu'est-ce que CI/CD ?

**CI/CD** = Continuous Integration / Continuous Deployment

**CI (Intégration Continue) :**
- Build automatique à chaque commit
- Tests automatiques
- Détection rapide des bugs

**CD (Déploiement Continu) :**
- Déploiement automatique en production
- Rollback automatique si erreur

**Pipeline CI/CD (Jenkins) :**
```groovy
pipeline {
  agent any
  
  stages {
    stage('Checkout') {
      steps {
        git 'https://github.com/myrepo.git'
      }
    }
    
    stage('Install') {
      steps {
        sh 'npm install'
      }
    }
    
    stage('Test') {
      steps {
        sh 'npm test'
      }
    }
    
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
    
    stage('Docker Build') {
      steps {
        sh 'docker build -t my-app:${BUILD_NUMBER} .'
      }
    }
    
    stage('Deploy') {
      steps {
        sh 'kubectl set image deployment/backend backend=my-app:${BUILD_NUMBER}'
      }
    }
  }
}
```

### Qu'est-ce qu'une variable d'environnement ?

**Variable d'environnement** = Configuration externe à l'application.

**Pourquoi ?**
- ✅ Sécurité (pas de secrets dans le code)
- ✅ Flexibilité (config différente dev/prod)
- ✅ Portabilité

**.env (fichier) :**
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=secret123
DATABASE_NAME=mydb

# JWT
JWT_SECRET=my-super-secret-key
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@myapp.com
SMTP_PASSWORD=emailpassword

# AI
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# App
NODE_ENV=development
PORT=3000
```

**Utilisation (NestJS) :**
```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}
  
  getDatabaseUrl() {
    return this.config.get<string>('DATABASE_URL');
  }
  
  getJwtSecret() {
    return this.config.get<string>('JWT_SECRET');
  }
}
```

**Utilisation (React) :**
```typescript
// Vite : variables doivent commencer par VITE_
const apiUrl = import.meta.env.VITE_API_URL;
const env = import.meta.env.MODE; // 'development' ou 'production'
```

### Qu'est-ce qu'un Reverse Proxy ?

**Reverse Proxy** = Serveur qui reçoit les requêtes et les redirige vers les bons services.

**Pourquoi ?**
- ✅ Load balancing
- ✅ SSL/TLS termination
- ✅ Cache
- ✅ Compression
- ✅ Sécurité (masque les serveurs internes)

**Exemple (Nginx) :**
```nginx
server {
  listen 80;
  server_name myapp.com;
  
  # Frontend
  location / {
    proxy_pass http://frontend:5173;
  }
  
  # Backend API
  location /api {
    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  # Static files
  location /uploads {
    alias /var/www/uploads;
  }
}
```

---


## 🤖 Intelligence Artificielle

### Qu'est-ce qu'une API IA ?

**API IA** = Interface pour utiliser des modèles d'IA sans les héberger soi-même.

**Avantages :**
- ✅ Pas besoin de GPU puissant
- ✅ Modèles à jour
- ✅ Scalabilité automatique
- ✅ Facile à intégrer

**Exemples d'APIs IA :**
- **OpenAI** : GPT-4, DALL-E, Whisper
- **Google Gemini** : Gemini Pro, Gemini Vision
- **Anthropic** : Claude
- **Cohere** : Command, Embed

### Qu'est-ce que Google Gemini ?

**Google Gemini** = Modèle d'IA multimodal de Google (texte, images, code).

**Modèles :**
- **gemini-1.5-flash** : Rapide et économique (utilisé dans notre projet)
- **gemini-1.5-pro** : Plus puissant mais plus cher
- **gemini-vision** : Analyse d'images

**Exemple d'utilisation :**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Génération de texte
const prompt = 'Explique-moi ce qu\'est un ORM en 50 mots';
const result = await model.generateContent(prompt);
const text = result.response.text();

// Avec contexte
const chat = model.startChat({
  history: [
    { role: 'user', parts: [{ text: 'Bonjour' }] },
    { role: 'model', parts: [{ text: 'Bonjour ! Comment puis-je vous aider ?' }] },
  ],
});

const response = await chat.sendMessage('Qu\'est-ce qu\'un ORM ?');
```

### Qu'est-ce qu'un Prompt ?

**Prompt** = Instruction donnée à l'IA pour obtenir une réponse.

**Anatomie d'un bon prompt :**
1. **Rôle** : Qui est l'IA ?
2. **Contexte** : Informations nécessaires
3. **Tâche** : Que doit faire l'IA ?
4. **Format** : Comment structurer la réponse ?
5. **Contraintes** : Limites et règles

**Exemple (mauvais prompt) :**
```
Analyse cette facture
```

**Exemple (bon prompt) :**
```
Tu es un expert en analyse de factures tunisiennes.

Contexte :
- Voici le texte OCR d'une facture : [texte]
- Format attendu : JSON

Tâche :
Extrais les informations suivantes :
1. Numéro de facture
2. Date (format YYYY-MM-DD)
3. Nom du fournisseur
4. Montant HT (en dinars)
5. TVA (en dinars)
6. Montant TTC (en dinars)
7. Lignes de produits (description, quantité, prix unitaire)

Contraintes :
- Retourne UNIQUEMENT un JSON valide
- Si une information manque, mets null
- Ajoute un champ confidence_score (0-100%)

Exemple de réponse :
{
  "invoice_number": "FAC-2024-001",
  "invoice_date": "2024-01-15",
  "supplier_name": "Acme Corp",
  "subtotal_ht": 1000.000,
  "tax_amount": 190.000,
  "net_amount": 1190.000,
  "line_items": [...],
  "confidence_score": 85
}
```

### Qu'est-ce que l'OCR ?

**OCR (Optical Character Recognition)** = Reconnaissance de texte dans les images.

**Comment ça marche ?**
1. Image → Prétraitement (contraste, rotation, etc.)
2. Détection des zones de texte
3. Reconnaissance des caractères
4. Post-traitement (correction, formatage)

**Tesseract.js (utilisé dans notre projet) :**
```typescript
import Tesseract from 'tesseract.js';

// OCR simple
const { data: { text } } = await Tesseract.recognize(
  imageBuffer,
  'fra', // Langue française
  {
    logger: m => console.log(m), // Progression
  }
);

// OCR avec configuration
const { data: { text, confidence } } = await Tesseract.recognize(
  imageBuffer,
  'fra+eng', // Français + Anglais
  {
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,/-',
  }
);
```

**Limites de l'OCR :**
- ❌ Sensible à la qualité de l'image
- ❌ Difficultés avec les polices manuscrites
- ❌ Erreurs sur les caractères similaires (0/O, 1/l)
- ❌ Pas de compréhension du contexte

**Solution : OCR + IA**
```typescript
// 1. OCR extrait le texte brut
const rawText = await ocrService.extract(imageBuffer);

// 2. IA structure et enrichit les données
const structuredData = await aiService.enrichOcrData(rawText);
```

### Qu'est-ce que le Fine-tuning ?

**Fine-tuning** = Entraîner un modèle pré-entraîné sur des données spécifiques.

**Pourquoi ?**
- ✅ Meilleure précision sur un domaine spécifique
- ✅ Moins de données nécessaires qu'un entraînement from scratch
- ✅ Réponses plus cohérentes

**Exemple (OpenAI) :**
```typescript
// 1. Préparer les données d'entraînement
const trainingData = [
  {
    messages: [
      { role: 'system', content: 'Tu es un expert en factures tunisiennes' },
      { role: 'user', content: 'Extrais les données de cette facture: [texte]' },
      { role: 'assistant', content: '{"invoice_number": "FAC-001", ...}' },
    ],
  },
  // ... plus d'exemples
];

// 2. Fine-tuner le modèle
const fineTune = await openai.fineTuning.jobs.create({
  training_file: 'file-abc123',
  model: 'gpt-3.5-turbo',
});

// 3. Utiliser le modèle fine-tuné
const response = await openai.chat.completions.create({
  model: 'ft:gpt-3.5-turbo:my-org:custom-model:abc123',
  messages: [...],
});
```

### Qu'est-ce que le RAG ?

**RAG (Retrieval-Augmented Generation)** = Technique qui combine recherche de documents et génération de texte.

**Comment ça marche ?**
```
1. Question utilisateur
   ↓
2. Recherche dans la base de connaissances
   ↓
3. Récupération des documents pertinents
   ↓
4. Injection dans le prompt de l'IA
   ↓
5. Génération de la réponse
```

**Exemple :**
```typescript
// 1. Recherche dans la base de données
const relevantInvoices = await invoiceRepo.find({
  where: {
    business_id: businessId,
    status: 'OVERDUE',
  },
  take: 5,
});

// 2. Construire le contexte
const context = relevantInvoices.map(inv => 
  `Facture ${inv.invoice_number}: ${inv.net_amount} DT, échéance ${inv.due_date}`
).join('\n');

// 3. Prompt avec contexte
const prompt = `
Contexte (factures en retard) :
${context}

Question : Combien de factures sont en retard et quel est le montant total ?

Réponds de façon concise.
`;

// 4. Génération
const response = await gemini.generateContent(prompt);
```

**Avantages du RAG :**
- ✅ Réponses basées sur des données réelles
- ✅ Pas besoin de fine-tuning
- ✅ Données toujours à jour
- ✅ Traçabilité (on sait d'où viennent les infos)

### Qu'est-ce que le Token (IA) ?

**Token** = Unité de texte pour l'IA (mot, partie de mot, ponctuation).

**Exemples :**
```
"Hello world" = 2 tokens
"L'intelligence artificielle" = 4 tokens
"GPT-4" = 3 tokens (GPT, -, 4)
```

**Pourquoi c'est important ?**
- ✅ Coût basé sur les tokens (input + output)
- ✅ Limite de contexte (ex: 8000 tokens max)
- ✅ Performance (moins de tokens = plus rapide)

**Calcul approximatif :**
- 1 token ≈ 4 caractères en anglais
- 1 token ≈ 2-3 caractères en français
- 100 tokens ≈ 75 mots

**Optimisation :**
```typescript
// ❌ Prompt verbeux (beaucoup de tokens)
const prompt = `
Je voudrais que tu analyses cette facture et que tu m'extraies toutes les informations importantes comme le numéro de facture, la date, le nom du fournisseur, tous les montants incluant le HT, la TVA et le TTC, ainsi que toutes les lignes de produits avec leurs descriptions, quantités et prix unitaires.
`;

// ✅ Prompt concis (moins de tokens)
const prompt = `
Extrais de cette facture :
- N° facture
- Date
- Fournisseur
- Montants (HT, TVA, TTC)
- Lignes (description, qté, PU)
`;
```

### Qu'est-ce que la température (IA) ?

**Température** = Paramètre qui contrôle la créativité/aléatoire des réponses.

**Valeurs :**
- **0.0** : Déterministe (toujours la même réponse)
- **0.5** : Équilibré
- **1.0** : Créatif
- **2.0** : Très aléatoire

**Quand utiliser quelle température ?**
```typescript
// Température basse (0.0-0.3) : Tâches précises
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.1,  // Réponses cohérentes
  },
});
// Utilisations : Extraction de données, traduction, code

// Température moyenne (0.5-0.7) : Usage général
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.6,
  },
});
// Utilisations : Chat, Q&A, résumés

// Température haute (0.8-1.5) : Créativité
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 1.2,  // Réponses variées
  },
});
// Utilisations : Brainstorming, écriture créative
```

---

## 📚 Glossaire technique

**API** : Application Programming Interface - Interface pour communiquer entre applications

**Async/Await** : Syntaxe pour gérer les opérations asynchrones en JavaScript

**Backend** : Partie serveur d'une application (logique, base de données)

**Bundle** : Fichier JavaScript compilé contenant tout le code de l'application

**Cache** : Stockage temporaire pour accélérer l'accès aux données

**CLI** : Command Line Interface - Interface en ligne de commande

**CRUD** : Create, Read, Update, Delete - Opérations de base sur les données

**Dependency** : Bibliothèque externe utilisée par l'application

**Endpoint** : URL d'une API (ex: /api/suppliers)

**Frontend** : Partie client d'une application (interface utilisateur)

**HTTP** : HyperText Transfer Protocol - Protocole de communication web

**JSON** : JavaScript Object Notation - Format de données

**Middleware** : Fonction qui s'exécute entre la requête et la réponse

**Migration** : Script pour modifier le schéma de la base de données

**npm** : Node Package Manager - Gestionnaire de paquets JavaScript

**ORM** : Object-Relational Mapping - Pont entre objets et base de données

**Promise** : Objet représentant une opération asynchrone

**Query** : Requête à la base de données

**REST** : Representational State Transfer - Style d'architecture API

**SDK** : Software Development Kit - Ensemble d'outils pour développer

**SQL** : Structured Query Language - Langage pour bases de données

**SSL/TLS** : Protocoles de sécurité pour HTTPS

**TypeScript** : Sur-ensemble de JavaScript avec typage statique

**UUID** : Universally Unique Identifier - Identifiant unique

**Webhook** : URL appelée automatiquement lors d'un événement

---

## 🎯 Bonnes pratiques

### Code

✅ **Nommer clairement** : `getUserById` plutôt que `get`
✅ **Commenter le "pourquoi"**, pas le "quoi"
✅ **Fonctions courtes** : Une fonction = une responsabilité
✅ **Éviter la duplication** : DRY (Don't Repeat Yourself)
✅ **Gérer les erreurs** : try/catch, validation
✅ **Typer fortement** : Utiliser TypeScript correctement

### Sécurité

✅ **Valider toutes les entrées**
✅ **Hacher les mots de passe** (bcrypt)
✅ **Utiliser HTTPS** en production
✅ **Pas de secrets dans le code** (variables d'environnement)
✅ **Limiter les requêtes** (rate limiting)
✅ **Mettre à jour les dépendances** régulièrement

### Performance

✅ **Paginer les résultats**
✅ **Créer des index** sur les colonnes fréquemment recherchées
✅ **Utiliser le cache** (Redis, React Query)
✅ **Optimiser les images** (compression, formats modernes)
✅ **Lazy loading** pour les composants lourds
✅ **Minimiser les re-renders** React (useMemo, useCallback)

### Base de données

✅ **Utiliser des transactions** pour les opérations critiques
✅ **Créer des index** judicieusement
✅ **Éviter N+1 queries** (eager loading)
✅ **Sauvegarder régulièrement**
✅ **Monitorer les performances** (slow queries)

---

**Dernière mise à jour** : Avril 2026
**Auteur** : Équipe PI-DEV

