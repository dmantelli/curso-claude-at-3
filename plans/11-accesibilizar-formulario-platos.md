# Accesibilizar el formulario de platos (#11)

- **Tipo:** Funcionalidad
- **Issue:** #11
- **Fecha:** 2026-11-05

## Objetivo

Hacer accesible el formulario de creación/edición de platos de `web-admin` según WCAG 2.2 nivel AA, de forma que se pueda completar, corregir y enviar solo con teclado (orden de tabulación lógico, foco visible, errores anunciados). Se demuestra con un vídeo grabado con Playwright.

## Alcance

**Incluye:**

- Formulario de `dish-form` (HTML, TS y CSS): etiquetas asociadas, semántica de botones/enlaces/encabezados, `<form>` real con envío por Enter, foco visible, tamaño de objetivo ≥ 24×24 px, contraste AA.
- Validación en cliente (nombre obligatorio, precio > 0) con mensajes de error accesibles (`aria-invalid`, `aria-describedby`, `role="alert"`) y gestión del foco al enviar con errores.
- Mensajes dinámicos (error de API, "Guardando…", alta/baja de ingredientes) anunciados a lectores de pantalla (`aria-live`).
- Infraestructura de pruebas en `web-admin` (hoy sin tests): Vitest para componentes y Playwright (+ `@axe-core/playwright`) para e2e.
- Test e2e que graba un vídeo de la navegación solo con teclado.

**No incluye:**

- Accesibilidad de la lista de platos (`dish-list`) más allá de lo necesario para verificar el resultado final, ni de otros formularios (empleados, ingredientes, restaurantes).
- Cambios en la API (la validación del servidor ya existe).
- Accesibilidad del login (vive en `web-shared`); solo se usa en el e2e.

## Archivos afectados

| Archivo | Acción | Motivo |
| ------- | ------ | ------ |
| `packages/web-admin/package.json` | Modificar | Dependencias de test (`vitest`, `jsdom`, `@playwright/test`, `@axe-core/playwright`) y scripts `test` / `e2e` |
| `packages/web-admin/angular.json` | Modificar | Target `test` con `@angular/build:unit-test` |
| `packages/web-admin/tsconfig.spec.json` | Modificar | Tipos de vitest (si hace falta) |
| `packages/web-admin/src/app/features/dishes/pages/dish-form/dish-form.component.html` | Modificar | Semántica, labels, errores, botones |
| `packages/web-admin/src/app/features/dishes/pages/dish-form/dish-form.component.ts` | Modificar | Validación, errores por campo, gestión del foco, mensajes live |
| `packages/web-admin/src/app/features/dishes/pages/dish-form/dish-form.component.css` | Modificar | `:focus-visible`, tamaños de objetivo, estilos de error y contraste |
| `packages/web-admin/src/app/features/dishes/pages/dish-form/dish-form.component.spec.ts` | Crear | Tests unitarios/de componente (TDD) |
| `packages/web-admin/playwright.config.ts` | Crear | Config e2e: `webServer`, vídeo, navegador |
| `packages/web-admin/e2e/dish-form.a11y.spec.ts` | Crear | Test axe WCAG 2.2 AA + foco visible |
| `packages/web-admin/e2e/dish-form.keyboard-video.spec.ts` | Crear | Recorrido solo con teclado grabado en vídeo |
| `packages/web-admin/e2e/helpers/teclado.ts` | Crear | Helpers que solo usan `page.keyboard` (sin ratón) |
| `.gitignore` | Modificar | Ignorar `test-results/` y `playwright-report/` |
| `docs/arquitectura-frontend.md` | Modificar | Documentar cómo correr tests y e2e de web-admin |

## Lista de tareas

> Cada tarea: 5-10 minutos. TDD estricto en todas: (1) escribir el test y verlo **fallar** por la razón correcta, (2) escribir el código mínimo para que pase, (3) refactorizar con los tests en verde. No se escribe código de producción sin un test rojo previo.

**Infraestructura de tests**

- [x] 1. Configurar el runner de tests de `web-admin` (target `test` con `@angular/build:unit-test` + vitest + jsdom) y un test de humo de `DishFormComponent` que lo monte con `HttpClientTestingModule`/stubs y `provideRouter([])`; rojo = no existe runner (`packages/web-admin/angular.json`, `package.json`, `dish-form.component.spec.ts`, ~10 min)
- [x] 2. Instalar `@playwright/test` y `@axe-core/playwright`, descargar chromium y crear `playwright.config.ts` (`webServer` para API :3000 y admin :4200, `video: 'on'`, `baseURL`); rojo = un spec mínimo que abre el login y falla hasta tener config (`packages/web-admin/playwright.config.ts`, `package.json`, ~10 min)

**Formulario accesible (cada tarea: test rojo → implementación → verde)**

- [x] 3. Etiquetas: test que verifica `getByLabelText` para Nombre, Precio, Categoría, Disponible, Descripción; sustituir los `div.fake-label` por `<label for>` con `id` únicos en cada control (`dish-form.component.spec.ts`, `.html`, ~8 min)
- [x] 4. Encabezados y landmarks: test de `h1` con el título de página y `h2` "Ingredientes del plato"; sustituir `fake-title`/`fake-subtitle`, dar `aria-label` "Volver a la lista de platos" al enlace de volver y `aria-hidden="true"` a los iconos decorativos (`.html`, `.css`, ~8 min)
- [x] 5. Envío por teclado: test de que existe un `<form>` con `<button type="submit">Guardar`, de que `submit` (Enter en un campo) llama a `onSubmit()` y de que "Cancelar" es un enlace (`<a>`) enfocable; reemplazar los `div.btn` (`.html`, `.ts`, ~10 min)
- [x] 6. Botón "Añadir ingrediente": test de que es `<button type="button">` con nombre accesible "Añadir ingrediente", de que Enter/Espacio lo activa y de que el select de ingrediente y la cantidad tienen label (visible u oculta) ("Ingrediente", "Cantidad") (`.html`, `.css`, ~8 min)
- [x] 7. Quitar ingrediente: test de que cada chip tiene `<button type="button">` con nombre "Quitar {ingrediente}", enfocable y activable con teclado, y de que la lista de chips es una `<ul>`/`<li>`; reemplazar `div.chip-remove` (`.html`, `.css`, ~8 min)
- [x] 8. Validación en cliente (lógica pura): tests de `validate()` → nombre vacío/solo espacios = "El nombre es obligatorio", precio ≤ 0 o vacío = "El precio debe ser mayor que 0"; `onSubmit()` no llama al store si hay errores; errores en un `signal` por campo (`.ts`, ~8 min)
- [x] 9. Presentación de errores: test de que, con el formulario inválido enviado, los campos tienen `aria-invalid="true"` y `aria-describedby` apuntando a un mensaje con `id`, y de que el formulario tiene `novalidate`; se muestran mensajes de texto (no solo color) y se limpian al corregir (`.html`, `.ts`, `.css`, ~10 min)
- [x] 10. Gestión del foco y resumen de errores: test de que tras enviar inválido el foco pasa a un resumen de errores (`role="alert"`, `tabindex="-1"`) con enlaces a cada campo erróneo, y de que activar un enlace enfoca el campo (`.html`, `.ts`, ~10 min)
- [ ] 11. Mensajes dinámicos: test de que el error de API y el aviso de ingrediente duplicado/cantidad inválida se anuncian (`role="alert"` / `aria-live="polite"`), de que el botón Guardar tiene `aria-busy`/`disabled` mientras guarda y de que añadir/quitar un ingrediente actualiza una región `role="status"` ("Ingrediente X añadido") (`.html`, `.ts`, ~10 min)
- [ ] 12. Orden de tabulación lógico: test que recorre los elementos enfocables del formulario y comprueba el orden (volver → nombre → precio → categoría → disponible → descripción → quitar ingredientes → select → cantidad → añadir → cancelar → guardar), sin `tabindex` positivo (`.spec.ts`, `.html`, ~7 min)

**Foco visible, contraste y tamaño (WCAG 2.2: 2.4.7, 2.4.11, 1.4.3, 1.4.11, 2.5.8) — verificados en navegador real**

- [ ] 13. Test e2e de foco visible: con Tab sobre cada control, `outline` computado ≠ `none` y ≥ 2 px con contraste ≥ 3:1 y no oculto por cabeceras fijas; añadir regla `:focus-visible` global del formulario (`e2e/dish-form.a11y.spec.ts`, `.css`, ~10 min)
- [ ] 14. Test e2e de tamaño de objetivo: todos los botones/enlaces/chips del formulario miden ≥ 24×24 px; ajustar `btn-sm`, `chip-remove` y `qty-input` (`e2e/dish-form.a11y.spec.ts`, `.css`, ~8 min)
- [ ] 15. Test e2e con axe (`withTags(['wcag2a','wcag2aa','wcag22aa'])`) en estado inicial y con errores: cero violaciones; corregir lo que salga (contraste de placeholder/`--text-muted`, etc.) (`e2e/dish-form.a11y.spec.ts`, `.css`, ~10 min)

**Vídeo del recorrido solo con teclado (criterio de aceptación)**

- [ ] 16. Crear `e2e/helpers/teclado.ts` con funciones que solo usan `page.keyboard` (`tab_hasta`, `escribir`, `elegir_opcion` con flechas, `pulsar`) y un test del helper que verifica que falla si se intenta usar `page.mouse`/`click` (guardia `test.use` con `page.mouse` lanzando error) (`e2e/helpers/teclado.ts`, ~8 min)
- [ ] 17. Spec de vídeo, parte 1 — login y edición: iniciar sesión con `admin@resttek.com`, llegar a la lista de platos y abrir la edición de un plato solo con Tab/Enter; modificar nombre y precio; verificar con aserciones el valor y el foco tras cada paso (`e2e/dish-form.keyboard-video.spec.ts`, ~10 min)
- [ ] 18. Parte 2 — ingredientes: en la edición, añadir un ingrediente (select con flechas, cantidad, Enter en "Añadir") y quitar otro (Tab hasta "Quitar …" + Enter); aserciones sobre los chips y la región `status`; guardar y comprobar que vuelve a la lista con los cambios (`e2e/dish-form.keyboard-video.spec.ts`, ~10 min)
- [ ] 19. Parte 3 — formulario incompleto: abrir "Nuevo plato" por teclado, enviar vacío con Enter, comprobar resumen de errores enfocado, mensajes por campo y `aria-invalid`; saltar a cada campo erróneo con los enlaces del resumen (`e2e/dish-form.keyboard-video.spec.ts`, ~10 min)
- [ ] 20. Parte 4 — creación correcta: completar nombre, precio, categoría, descripción, añadir/quitar un ingrediente, guardar con teclado y comprobar que el plato nuevo aparece en la lista; pausas cortas (`waitForTimeout` ~600 ms) y resaltado del foco para que el vídeo sea legible (`e2e/dish-form.keyboard-video.spec.ts`, ~10 min)
- [ ] 21. Configurar la salida del vídeo: `recordVideo` con tamaño 1280×720 guardado en `packages/web-admin/test-results/`, script `npm run e2e:video -w @resttek/web-admin` que hace `seed` previo, y copiar el `.webm` a `docs/videos/dish-form-teclado.webm`; test que comprueba que el fichero existe y pesa > 0 (`playwright.config.ts`, `package.json`, `.gitignore`, ~8 min)

**Cierre**

- [ ] 22. Documentar en `docs/arquitectura-frontend.md` cómo ejecutar tests de componente y e2e/vídeo y las convenciones de accesibilidad del formulario; ejecutar todo (`npm test`, tests de web-admin, e2e, `npm run build -w @resttek/web-admin`) (`docs/arquitectura-frontend.md`, ~8 min)

## Criterios de aceptación

- [ ] Todo el formulario (campos, añadir/quitar ingredientes, Cancelar, Guardar) se puede completar y enviar solo con teclado; Enter en un campo envía el formulario; el orden de tabulación es lógico y no hay `tabindex` positivos.
- [ ] Todos los controles tienen nombre accesible (`<label for>` o `aria-label`); no quedan `div` clicables ni `fake-*`.
- [ ] El foco es siempre visible (`:focus-visible`, contraste ≥ 3:1, ≥ 2 px) y los objetivos miden ≥ 24×24 px.
- [ ] Enviar el formulario vacío muestra "El nombre es obligatorio" y "El precio debe ser mayor que 0" como texto, con `aria-invalid`/`aria-describedby`, y mueve el foco al resumen de errores; no se hace petición a la API.
- [ ] Los cambios dinámicos (errores, guardando, ingrediente añadido/quitado) se anuncian vía `role="alert"` / `role="status"`.
- [ ] axe-core con etiquetas `wcag2a`, `wcag2aa`, `wcag22aa` no reporta violaciones en el formulario (estado inicial y con errores).
- [ ] Existe un vídeo `.webm` grabado por Playwright (`docs/videos/dish-form-teclado.webm`) en el que, **solo con teclado**, se edita un plato (nombre, precio), se añade y quita un ingrediente, se envía un formulario incompleto mostrando los errores y finalmente se crea un plato correcto que aparece en la lista; el spec no usa `click`, `mouse` ni `fill`.
- [ ] Cada tarea tiene su test escrito antes que el código (evidencia: test rojo registrado en el commit/mensaje de la tarea y luego verde).
- [ ] Los tests con vitest pasan (`npm test` de la API y tests de `web-admin`) y el e2e de Playwright pasa.
- [ ] `npm run build -w @resttek/web-admin` compila sin errores.
- [ ] eslint y prettier sin errores (ver decisión 3: hoy no están configurados en `web-admin`).

## Dudas y decisiones

**Dudas abiertas:**

- Ninguna

**Decisiones tomadas por mi cuenta:**

- Número de issue #11 — confirmado por el usuario; el issue no tiene número en `issues.json`.
- Usar Vitest vía `@angular/build:unit-test` para tests de componente — Angular 21 lo soporta de forma nativa y la API ya usa Vitest, manteniendo un solo framework.
- Los nombres de funciones siguen camelCase en el código Angular (como el resto de `web-admin`) y snake_case solo en los helpers de e2e — la regla de snake_case de la plantilla choca con las convenciones TypeScript/Angular existentes.
- eslint no existe en el proyecto y solo hay Prettier en `web-clientes`; no se añade linter (fuera de alcance), se mantiene el estilo existente y se formatea con Prettier manualmente — el criterio queda condicionado a esa decisión.
- Añadir validación en cliente (no existe hoy) — es imprescindible para poder "enviar el formulario incompleto y mostrar errores" de forma accesible; reglas mínimas: nombre no vacío y precio > 0, alineadas con las del servicio de la API.
- Los textos y mensajes en español; resumen de errores como patrón de foco (WCAG 3.3.1/3.3.3) — es el patrón recomendado y verificable con teclado.
- Los criterios que dependen de CSS real (foco, tamaños, contraste) se prueban en Playwright y no en jsdom — jsdom no calcula estilos de layout.
- El vídeo se graba con Chromium en 1280×720 con pausas breves — para que sea legible por humanos.
- El vídeo se guarda en el repo (`docs/videos/dish-form-teclado.webm`) — es el criterio de aceptación del issue y debe poder revisarse sin ejecutar nada; con 1280×720 y un recorrido corto pesará pocos MB. Los vídeos intermedios de `test-results/` quedan ignorados por git.
- Se aceptan las dependencias de desarrollo `@playwright/test`, `@axe-core/playwright` y `jsdom`, y la descarga de Chromium (solo `chromium`, no los tres navegadores) — son estándar para el e2e y la auditoría WCAG que pide el issue, y quedan solo en `devDependencies` de `web-admin`.
- El e2e usa la API real con `npm run seed` previo, sin mocks — el seed es idempotente y el vídeo debe mostrar el flujo real de extremo a extremo (guardado y aparición en la lista); mockear `/api` ocultaría fallos de integración.
