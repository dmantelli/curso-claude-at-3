# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visión general

Resttek: plataforma de gestión de restaurantes. Monorepo con **npm workspaces** (`packages/*`): una API (`api`, Express 5 + TypeScript + SQLite) y tres apps Angular 21 (`web-admin`, `web-empleados`, `web-clientes`) más una librería compartida (`web-shared`). Requiere Node 22+. La documentación en español está en `docs/` (arquitectura y dominio: `arquitectura-api.md`, `arquitectura-frontend.md`, `arquitectura-general.md`, `modelo-datos.md`, `glosario.md`); consúltala antes de cambios grandes.

## Comandos (desde la raíz)

```bash
npm install                 # instala todos los workspaces
npm run seed                # datos de prueba (INSERT OR IGNORE, idempotente); imprime credenciales
npm run dev:api             # API en :3000 (tsx watch), healthcheck: GET /health
npm run dev:admin           # :4200
npm run dev:empleados       # :4201
npm run dev:clientes        # :4202
npm test                    # vitest de la API (único paquete con tests)
```

- Test individual: `cd packages/api && npx vitest run src/services/order.service.test.ts` (o `-t "nombre"`). Modo watch: `npm run test:watch` en `packages/api`.
- Build de un frontend: `npm run build -w @resttek/web-admin` (idem para los otros). No hay linter configurado; solo Prettier en `web-clientes`.
- Los frontends hacen proxy de `/api` a `localhost:3000` (`proxy.conf.json`). Cambios en `web-shared` no se recargan en caliente: reinicia el dev server del frontend.
- Credenciales de prueba tras el seed: la contraseña de cada usuario es su propio email (p. ej. `admin@resttek.com`).
- `scripts/seed-issues.sh` crea issues de GitHub desde `scripts/issues.json` (necesita `gh` y `jq`; admite `--dry-run`).

## Arquitectura de la API (`packages/api`)

Conviven **dos estilos**; identifica cuál aplica antes de tocar código:

1. **Hexagonal + DDD** solo en `src/contexts/employee/` (domain / application / infrastructure) y `src/contexts/shared/` (value object `Email`, middlewares `authenticate`/`authorize`, `errorHandler`). `Employee` es la única entidad real (constructor privado + `create()`); casos de uso con un único `execute()` (`LoginUseCase`, `CreateEmployeeUseCase`, `RegisterClientUseCase`). Interfaces con prefijo `I`.
2. **Por capas** para `restaurant`, `dish`, `ingredient`, `order`: `models/` (interfaces planas + `normalizeX()`), `repositories/` (interfaz + implementación SQLite en el mismo fichero, mocks en `repositories/mocks/`), `services/` (lógica y validaciones), `controllers/`, `routes/`. Sin prefijo `I`.

Detalles que requieren leer varios ficheros:
- La composición de dependencias se hace **en el propio fichero de rutas** (excepto `employee`, que usa `infrastructure/http/dependencies.ts`). Los routers bajo `/restaurants/:restaurantId/...` necesitan `Router({ mergeParams: true })`.
- Todas las rutas cuelgan de `/api/v1` salvo `/health`. Autorización por rol con `authorize([...])`; las rutas de pedidos solo exigen estar autenticado (sin `authorize`).
- Errores: `AppError` → errores de `errors/DomainErrors.ts`; el `errorHandler` mapea nombre de clase → HTTP (404 para los `*NotFoundError` listados, 401 `InvalidCredentialsError`, 400 resto de `AppError`, 500 otros). Al añadir un error "not found" nuevo hay que registrarlo ahí (`OrderNotFoundError` hoy cae en 400). `OrderController` es la excepción: hace su propio try/catch sin `next(error)`.
- Al crear un pedido, el servicio expande `quantity: N` en N filas de `order_items` con cantidad 1 (estado por unidad).
- Path aliases (`tsconfig.json`, resueltos por tsx y `vite-tsconfig-paths` en tests): `@config/*`, `@errors/*`, `@shared/*`, `@employee/*`.
- Tests: Vitest con `globals: true`, junto al código (`*.test.ts`); los servicios se prueban con repositorios mock, los repositorios SQLite con su propio test.
- Convención del dominio: roles `admin | manager | camarero | cocinero | cliente`; estados de pedido `pendiente → preparando → listo → entregado`; los nombres de dominio están en español.

## Arquitectura de frontends

- Angular 21: standalone components, **signals**, **zoneless** (sin zone.js), guards/interceptors funcionales. RxJS solo para HTTP.
- `web-admin` y `web-empleados`: features autocontenidas (`features/<f>/{models,pages,services,store}`) con patrón **Store** (servicio `providedIn: 'root'`, signals privadas expuestas en solo lectura, HTTP con `firstValueFrom`). Rutas con lazy loading.
- `web-clientes` es distinta: modelos/servicios/stores centralizados en `core/`, componente raíz `App` (no `AppComponent`) y los componentes consumen los `Observable` con `.subscribe()`.
- `@resttek/web-shared` (`src/index.ts`, sin build, se consume como TS) contiene login/registro, `auth.store/service/guard`, interceptores (`auth`, `error`), tokens de inyección y estilos base. Ninguna app tiene `shared/` propio.
