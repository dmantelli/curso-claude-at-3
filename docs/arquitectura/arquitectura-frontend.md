# Arquitectura del frontend

Los frontends de Resttek usan **Angular 21** con las funcionalidades más modernas: standalone components, signals, zoneless change detection y functional guards/interceptors.

---

## Stack Frontend

| Tecnología | Uso |
| --- | --- |
| Angular 21 | Framework principal |
| Standalone Components | Sin NgModules |
| Signals | Estado reactivo (reemplaza a RxJS en estado) |
| Zoneless | Sin `zone.js` en ningún paquete |
| Lucide Angular | Iconos |
| RxJS | Solo para HTTP. En `web-admin` y `web-empleados`, casi siempre envuelto en `firstValueFrom` dentro de un store; en `web-clientes`, los componentes consumen los `Observable` directamente con `.subscribe()` (ver "Gestión de Estado") |

---

## Estructura de un Frontend

Las tres aplicaciones son feature-based, pero **no comparten la misma estructura**.

### `web-admin` y `web-empleados`

Cada feature es autocontenida y se subdivide por tipo de fichero:

```
src/app/
├── app.component.ts       → Componente raíz (<router-outlet>)
├── app.config.ts          → Providers (DI, router, HTTP, interceptors)
├── app.routes.ts          → Rutas principales con lazy loading
├── core/
│   └── layout/            → Shell y not-found
└── features/
    └── <feature>/
        ├── <feature>.routes.ts
        ├── models/        → Interfaces y DTOs
        ├── pages/         → Componentes de página
        ├── services/      → Llamadas HTTP
        └── store/         → Estado con signals
```

### `web-clientes`

Es más pequeña y centraliza modelos y servicios en `core/` en vez de repartirlos por feature. Sus features son componentes sueltos, sin subcarpetas:

```
src/app/
├── app.ts                 → Componente raíz, se llama App (no AppComponent)
├── app.config.ts
├── app.routes.ts
├── core/
│   ├── layout/            → shell.component.ts
│   ├── models/            → dish, order, restaurant
│   ├── services/          → dish, order, restaurant
│   └── store/             → cart.store.ts
└── features/
    ├── cart/cart.component.ts
    ├── menu/restaurant-menu.component.ts
    ├── orders/my-orders.component.ts
    ├── orders/order-detail.component.ts
    └── restaurants/restaurant-list.component.ts
```

Ninguna de las tres aplicaciones tiene carpeta `shared/` propia: lo compartido vive en `@resttek/web-shared`.

---

## Gestión de Estado: el patrón Store

Es el patrón estándar en **`web-admin` y `web-empleados`**: cada feature con datos remotos tiene su store, un servicio `providedIn: 'root'` con signals privadas expuestas como solo lectura:

```tsx
@Injectable({ providedIn: 'root' })
export class DishStore {
    private readonly service = inject(DishService)

    private readonly _dishes = signal<Dish[]>([])
    private readonly _loading = signal(false)
    private readonly _error = signal<string | null>(null)

    readonly dishes = this._dishes.asReadonly()
    readonly loading = this._loading.asReadonly()
    readonly error = this._error.asReadonly()

    async loadByRestaurant(restaurantId: string): Promise<void> {
        this._loading.set(true)
        this._error.set(null)
        try {
            this._dishes.set(await firstValueFrom(this.service.getAll(restaurantId)))
        } catch {
            this._error.set('No se pudieron cargar los platos.')
        } finally {
            this._loading.set(false)
        }
    }
}
```

**Convenciones (`web-admin` / `web-empleados`):**

- El store consume el service (que devuelve `Observable`) y lo convierte con `firstValueFrom`. Los componentes solo hablan con el store.
- El trío `loading` / `error` / datos se repite en todos.
- Tras crear o actualizar, el store actualiza la lista en memoria con `.update()` en vez de recargar.

Caso particular en `web-empleados`:

- `OrderStore` añade **polling cada 30 s** con `startPolling()` / `stopPolling()`, ya que la API no tiene websockets.

### `web-clientes`: el patrón Store casi no se usa

En `web-clientes` el patrón Store **no es la norma**: el único store real es `CartStore`, y es puramente local (sin HTTP) — vacía el carrito si añades un plato de otro restaurante, pero no envuelve ninguna llamada a la API.

Para todo lo demás (restaurantes, carta/platos, confirmación y consulta de pedidos) los componentes de `features/` inyectan el `*Service` correspondiente directamente y llaman a sus métodos con `.subscribe({ next, error })`, sin pasar por ningún store ni por `firstValueFrom`:

- `restaurant-list.component.ts` → `RestaurantService.getAll()`
- `restaurant-menu.component.ts` → `RestaurantService.getById()` y `DishService.getByRestaurant()`
- `cart.component.ts` (`confirmOrder()`) → `OrderService.createOrder()`
- `my-orders.component.ts` → `OrderService.getMyOrders()`, con **polling cada 10 s** mediante `setInterval`/`clearInterval` en el propio componente
- `order-detail.component.ts` → `OrderService.getOrderById()`, con **polling cada 5 s**, también con `setInterval`/`clearInterval` en el propio componente

---

## Librería Compartida: `@resttek/web-shared`

Centraliza todo lo que comparten los 3 frontends:

```
web-shared/src/
├── index.ts                  → Barrel exports
└── lib/
    ├── tokens.ts             → InjectionToken API_URL
    ├── auth/
    │   ├── auth.service.ts   → Login, register, logout
    │   ├── auth.store.ts     → Signal-based state (token, user)
    │   └── auth.guard.ts     → Protección de rutas
    ├── http/
    │   ├── auth.interceptor.ts   → Añade Bearer token
    │   └── error.interceptor.ts  → Maneja 401 → redirect login
    ├── components/
    │   ├── login/            → Componente de login reutilizable
    │   └── register/         → Componente de registro
    ├── assets/images/        → Imágenes copiadas al build de cada app
    └── styles/
        └── base.css          → Design system (ver aviso más abajo)
```

El paquete se consume **directamente desde el fuente**: su `package.json` apunta `main` a `src/index.ts`, sin paso de compilación. Por eso los cambios en `web-shared` requieren reiniciar el dev server del frontend.

### Exports de la Librería

```tsx
export * from './lib/tokens'
export * from './lib/auth/auth.service'
export * from './lib/auth/auth.store'
export * from './lib/auth/auth.guard'
export * from './lib/http/auth.interceptor'
export * from './lib/http/error.interceptor'
export * from './lib/components/login/login.component'
export * from './lib/components/register/register.component'
```

---

## Sistema de Autenticación

### AuthStore (Signal-based)

Estado global de autenticación usando **Angular Signals**:

```tsx
@Injectable({ providedIn: 'root' })
export class AuthStore {
    private readonly _token = signal<string | null>(localStorage.getItem('auth_token'))
    private readonly _user = signal<any>(JSON.parse(localStorage.getItem('auth_user') || 'null'))

    readonly token = this._token.asReadonly()
    readonly user = this._user.asReadonly()
    readonly isAuthenticated = computed(() => this._token() !== null)
    readonly userRole = computed(() => this._user()?.role ?? null)

    setSession(token, user) { /* localStorage + signals */ }
    clearSession() { /* limpiar localStorage + signals */ }
}
```

### AuthService

Gestiona login y registro llamando a la API:

```tsx
@Injectable({ providedIn: 'root' })
export class AuthService {
    async login(email, password) {
        const response = await firstValueFrom(
            this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
        )
        this.store.setSession(response.token, response.employee)
    }
}
```

### AuthGuard

Functional guard que redirige a `/login` si no hay sesión:

```tsx
export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthStore)
    const router = inject(Router)
    if (auth.isAuthenticated()) return true
    return router.createUrlTree(['/login'])
}
```

---

## Interceptors HTTP

### Auth Interceptor

Añade automáticamente el token JWT a cada petición:

```tsx
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(AuthStore).token()
    if (!token) return next(req)
    return next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
    }))
}
```

### Error Interceptor

Intercepta respuestas 401 y redirige al login:

```tsx
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError(error => {
            if (error.status === 401) {
                auth.clearSession()
                router.navigate(['/login'])
            }
            return throwError(() => error)
        })
    )
}
```

---

## Inyección del API_URL

Se usa un `InjectionToken` para configurar la URL base de la API:

```tsx
// web-shared/tokens.ts
export const API_URL = new InjectionToken<string>('API_URL')

// app.config.ts de cada frontend
providers: [
    { provide: API_URL, useValue: environment.apiUrl },
    // ...
]
```

En los tres `environment.ts` el valor es `'/api/v1'` (ruta relativa que resuelve el proxy), tanto en desarrollo como en producción.

> **Uso desigual.** Las tres apps proveen el token, pero solo lo **inyectan** los servicios de `web-clientes` y el `AuthService` de `web-shared`. Los servicios de `web-admin` y `web-empleados` importan `environment.apiUrl` directamente:
>
> ```tsx
> // web-clientes: inyecta el token
> private readonly apiUrl = inject(API_URL)
>
> // web-admin / web-empleados: importa el environment
> private readonly baseUrl = `${environment.apiUrl}/restaurants`
> ```
>
> El resultado es el mismo, pero solo la primera forma es sustituible en tests.

---

## Routing y Lazy Loading

Las rutas usan **lazy loading** con `loadComponent` y `loadChildren`:

```tsx
export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('@resttek/web-shared').then(m => m.LoginComponent)
    },
    {
        path: '',
        loadComponent: () => import('./core/layout/shell.component').then(m => m.ShellComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'restaurants',
                loadChildren: () => import('./features/restaurants/restaurants.routes')
                    .then(m => m.RESTAURANT_ROUTES)
            }
        ]
    }
]
```

El lazy loading **no es universal**: `web-clientes` carga `LoginComponent` y `RegisterComponent` de forma eager con `component:`, y `web-empleados` hace lo mismo con su `ShellComponent`.

`web-clientes` tampoco define ruta comodín `**`, así que una URL desconocida no muestra un "no encontrado".

### Mesas en los frontends

- **`web-admin`**: feature `features/tables` (lista, alta y edición, borrado) bajo `restaurants/:restaurantId/tables`, con enlace «Mesas» en el submenú y tarjeta en el dashboard del restaurante. `TableStore.create/update` propagan el error para mostrar el 409 de número duplicado en el formulario.
- **`web-clientes`**: tras elegir restaurante se pasa por `restaurants/:id/mesas` (`TableSelectionComponent`): el cliente indica personas, elige una mesa disponible y «Continuar» la ocupa y navega a la carta. `TableStore` (en `core/`) guarda la mesa elegida; la carta y el carrito redirigen a la selección si no hay mesa, y el pedido envía `tableId`.

### Filtrado por Rol (web-empleados)

El filtrado por rol se resuelve **de navegación** mediante `computed()` en el `ShellComponent`, que decide qué enlaces se pintan en el menú:

```tsx
export class ShellComponent {
    readonly userRole = computed(() => this.authStore.userRole())

    readonly canSeeCocina = computed(() =>
        this.userRole() === 'cocinero' || this.userRole() === 'manager'
    )
    readonly canSeeBarra = computed(() =>
        this.userRole() === 'camarero' || this.userRole() === 'manager'
    )
    readonly canSeeSalon = computed(() =>
        this.userRole() === 'camarero' || this.userRole() === 'manager'
    )

    readonly defaultRoute = computed(() => { /* cocinero → /cocina, camarero → /barra */ })
}
```

La página «Mesas» (`/mesas`) es visible para `manager`, `camarero` y `cocinero` (`canSeeMesas`): muestra el estado de cada mesa, permite cambiarlo y lista los pedidos activos de las mesas `ocupada`.

El rol de gerente es `'manager'`, no `'gerente'`. La autorización real es responsabilidad de la API.

---

## Configuración de Angular

### `app.config.ts`

```tsx
export const appConfig: ApplicationConfig = {
    providers: [
        { provide: API_URL, useValue: environment.apiUrl },
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        importProvidersFrom(LucideAngularModule.pick({ ... }))
    ]
}
```

`LucideAngularModule.pick()` recibe solo los iconos que usa cada app, así que la lista es distinta en cada `app.config.ts`.

> **Zoneless**: `web-admin` y `web-empleados` llaman a `provideZonelessChangeDetection()` de forma explícita; `web-clientes` **no**. Funciona igual porque ningún paquete instala `zone.js` ni lo declara en `polyfills`, y Angular 21 opera sin zonas en ese caso. Es una inconsistencia entre apps, no un cambio de comportamiento.

### Proxy de Desarrollo

Cada frontend tiene un `proxy.conf.json` idéntico, que `npm start` aplica con `ng serve --proxy-config proxy.conf.json`:

```json
{
    "/api": {
        "target": "http://localhost:3000",
        "secure": false,
        "changeOrigin": true
    }
}
```

---

## Design System

El sistema de diseño es **dark mode** e incluye:

- **Variables CSS**: colores, radios, sombras, transiciones
- **Componentes base**: `.btn`, `.card`, `.form-control`, `.badge`, `.table`, etc.
- **Tipografía**: Inter (Google Fonts)
- **Animaciones**: `fadeIn`, `spin` (spinner)

> **No se comparte: se duplica.** Aunque existe `web-shared/src/lib/styles/base.css`, **ningún proyecto lo importa** ni se exporta desde `index.ts`. Cada aplicación tiene su propia copia en `src/styles.css`, que es lo que realmente carga Angular:
>
> | Fichero | Estado respecto a `base.css` |
> | --- | --- |
> | `web-admin/src/styles.css` | copia idéntica |
> | `web-clientes/src/styles.css` | copia idéntica |
> | `web-empleados/src/styles.css` | copia con 46 líneas propias añadidas |
>
> En la práctica hay **cuatro copias del design system** y el fichero de `web-shared` es código muerto. Al tocar un estilo común hay que replicarlo en las tres apps, o se desincronizan.

## Tests y accesibilidad en `web-admin`

`web-admin` es el único frontend con tests. Hay dos niveles:

| Nivel | Comando (desde la raíz) | Qué cubre |
| --- | --- | --- |
| Componentes (Vitest + jsdom, `@angular/build:unit-test`) | `npm test -w @resttek/web-admin` | Semántica, ARIA, validación y foco de `DishFormComponent` (`*.spec.ts` junto al componente) |
| E2E (Playwright + axe-core) | `npm run e2e -w @resttek/web-admin` | Foco visible, tamaño de objetivos, auditoría WCAG 2.2 AA y recorrido por teclado (`packages/web-admin/e2e/`) |

Notas para ejecutar el e2e:

- Requiere Chromium (`npx playwright install chromium`) y haber ejecutado `npm run seed` al menos una vez. **El seed duplica ingredientes en cada ejecución**, así que no lo lances en cada prueba.
- Levanta su propia API (puerto **3100**) y su propio `ng serve` (puerto **4300**, con `proxy.e2e.conf.json`) y no reutiliza servidores ya abiertos. Así no choca con el puerto 3000 si otro proyecto lo está usando.
- `npm run e2e:video -w @resttek/web-admin` graba el recorrido completo solo con teclado y copia el vídeo a `docs/videos/dish-form-teclado.webm`. El test falla si algún evento de ratón llega a la página (`registrar_uso_de_raton`). Cada ejecución crea un plato nuevo ("Plato accesible <timestamp>") y edita el primero de la lista.
- La auditoría axe se limita a `app-dish-form`; la barra lateral del shell tiene violaciones propias (contraste de `.nav-section-label` y `.user-role`, botón de cerrar sesión sin nombre) que quedan fuera del issue.

### Convenciones de accesibilidad del formulario de platos

- Cada control tiene `<label for>` (visible, o con clase `.sr-only` si el diseño no lo muestra). No se usan `div` clicables: acciones con `<button type="button">` o `<a>`, y el envío con `<button type="submit">` dentro de un `<form>` (Enter envía).
- La validación es de cliente (`validate()`): campos con `aria-invalid` y `aria-describedby` hacia un mensaje de texto, y un resumen `#resumen-errores` (`role="alert"`, `tabindex="-1"`) que recibe el foco al enviar con errores y enlaza a cada campo.
- Los cambios dinámicos (ingrediente añadido, quitado o duplicado) se anuncian en una región `role="status"`; el error de la API usa `role="alert"` y Guardar muestra `aria-busy` mientras guarda.
- El foco visible (`:focus-visible`, 3 px, contraste ≥ 3:1) y el tamaño mínimo de 24×24 px están en `dish-form.component.css` porque los estilos globales ponen `outline: none`. Los errores usan `--red-text` (`#f87171`) para llegar a contraste 4,5:1.
