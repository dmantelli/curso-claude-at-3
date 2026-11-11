---
name: actualizar-docs-api
description: Actualiza docs/api/openapi.yml cuando cambia algo de la API (rutas, parámetros, cuerpos, respuestas, códigos HTTP, validaciones, roles o categorías) y regenera la documentación HTML con Redocly mediante el script scripts/generar_docs.sh. Úsala siempre que se añada, modifique o elimine un endpoint, o cuando pidan actualizar o generar la documentación de la API.
argument-hint: <opcional: qué ha cambiado en la API>
---

# Actualizar la documentación de la API

Mantiene sincronizados el código de la API, `docs/api/openapi.yml` y el HTML generado `docs/api/openapi.html`.

Cambio indicado (si lo hay): $ARGUMENTS

## Cuándo usarla

Después de cualquier cambio que afecte al contrato de la API:

- Rutas nuevas, renombradas o eliminadas (`src/index.js`).
- Parámetros de query o de ruta, cuerpos de petición o forma de las respuestas (`controllers/`, `services/`, `models/`).
- Códigos de estado, mensajes de error o reglas de validación (`services/`).
- Autenticación y autorización (`middlewares/`, roles).
- Constantes del dominio que se reflejan en enums: `CATEGORIAS` y `ROLES`.

## Pasos

1. **Detecta qué ha cambiado.** Si `$ARGUMENTS` no lo dice, mira `git diff` (y `git diff development...HEAD` si hace falta) sobre `src/` y revisa `src/index.js`, controladores, servicios y modelos afectados.
2. **Lee `docs/api/openapi.yml`.** Si no existe, créalo (OpenAPI 3.0.3) documentando todos los endpoints actuales; para la paginación de los `GET` sigue `docs/api/api-pagination.md`.
3. **Actualiza el yml** reflejando solo lo que ha cambiado, y conservando el resto:
   - Cada endpoint con su `operationId`, `tags`, `summary`, parámetros, `requestBody` y **todas** las respuestas reales (200, 201, 400, 401, 403, 404, 409…).
   - Reutiliza esquemas en `components/schemas` (`$ref`) en lugar de duplicarlos.
   - Los payloads van en camelCase (`urlFoto`, `numVotos`); los textos, descripciones y ejemplos, en español.
   - Los enums de categorías y roles deben coincidir con `CATEGORIAS` (`src/models/vendehumo.js`) y `ROLES` (`src/models/usuario.js`).
   - Los endpoints protegidos llevan `security: [{ bearerAuth: [] }]`; si la autenticación es opcional, añade también `{}`.
4. **Genera el HTML** ejecutando el script (desde cualquier carpeta):

   ```bash
   .claude/skills/actualizar-docs-api/scripts/generar_docs.sh
   ```

   El script valida el yml con `redocly lint` y, si es válido, genera `docs/api/openapi.html` con `redocly build-docs`. Usa el `@redocly/cli` del proyecto y, si no está instalado, lo descarga con `npx`. Con `--sin-lint` omite la validación.
5. **Corrige los fallos.** Si el lint falla, arregla el yml y repite el paso 4; no desactives reglas para que pase.
6. **Comprueba** que el HTML se ha generado (`ls -l docs/api/openapi.html`) y que el yml refleja los cambios.
7. **Responde** con los endpoints o esquemas modificados en el yml y el resultado del script. Recuerda incluir `openapi.yml` y `openapi.html` en el commit del cambio de la API (por ejemplo con `/commit`); no hagas `git push`.

## Reglas

- El yml es la fuente de verdad de la documentación: **nunca edites `openapi.html` a mano**, se regenera siempre con el script.
- No inventes comportamiento: documenta lo que hace el código. Si el código y el yml se contradicen, avisa al usuario.
- No modifiques código de producción ni tests desde esta skill.
