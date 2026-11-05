---
name: plan-feature
description: Planifica una nueva funcionalidad o el arreglo de un error y guarda el plan en plans/<num_issue>-<breve-descripcion>.md usando una plantilla común. Úsala cuando pidan planificar, diseñar o preparar una feature, issue o bug antes de implementarlo.
argument-hint: <num_issue> <descripción de la funcionalidad o error>
---

# Plan de funcionalidad / arreglo de error

Genera un plan de implementación con el mismo formato para todo el equipo. **No implementes nada**: solo planifica.

Petición del usuario: $ARGUMENTS

## Pasos

1. **Entiende la petición.** Identifica si es una funcionalidad o un error. Si no se indica el número de issue, pregúntalo (es necesario para el nombre del archivo).
2. **Explora el código** necesario (`CLAUDE.md`, `src/` y `docs/` si aplica; por ejemplo `docs/api/api-pagination.md` para paginación en GET) para saber qué archivos se verán afectados. Respeta la arquitectura por capas del proyecto: controllers, services, repositories, models y utils; funciones en snake_case; textos y mensajes en español.
3. **Rellena la plantilla** de [assets/template.md](assets/template.md) respetando todas sus secciones y su orden. No añadas ni quites secciones.
4. **Reglas de contenido:**
   - *Tareas*: lista de checkboxes ordenada; cada tarea debe poder hacerse en **5-10 minutos**. Si una es mayor, divídela. Indica la duración estimada entre paréntesis y el archivo implicado.
   - *Archivos afectados*: rutas reales, indicando si se crean o se modifican.
   - *Criterios de aceptación*: verificables y concretos (comportamiento, códigos HTTP, tests con vitest, lint con eslint, formato con prettier).
   - *Dudas y decisiones*: toda duda abierta y toda decisión tomada por tu cuenta debe ir en esta sección final, con la justificación. Si no hay ninguna, escribe "Sin dudas ni decisiones pendientes".
5. **Guarda el plan** en `plans/<num_issue>-<breve-descripcion>.md` (crea la carpeta `plans` si no existe):
   - `<breve-descripcion>` en minúsculas, sin tildes, palabras separadas por guiones, máximo ~5 palabras. Ejemplo: `plans/42-paginar-listado-vendehumos.md`.
   - Si el archivo ya existe, pregunta antes de sobrescribirlo.
6. **Responde** con la ruta del archivo creado y un resumen de 2-3 líneas, destacando las dudas/decisiones para que el usuario las revise.
