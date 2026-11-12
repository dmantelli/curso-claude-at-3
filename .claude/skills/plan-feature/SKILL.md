---
name: plan-feature
description: Planifica una nueva funcionalidad o el arreglo de un error a partir de una issue de GitHub (número o URL, leída con gh), guarda el plan en plans/<num_issue>-<breve-descripcion>.md usando una plantilla común y lo publica como comentario de la issue. Úsala cuando pidan planificar, diseñar o preparar una feature, issue o bug antes de implementarlo.
argument-hint: <número o URL de la issue>
---

# Plan de funcionalidad / arreglo de error

Genera un plan de implementación con el mismo formato para todo el equipo. **No implementes nada**: solo planifica.

Petición del usuario: $ARGUMENTS

## Pasos

1. **Obtén la issue con GitHub CLI.** El usuario debe indicar el número o la URL de la issue. Si no lo ha hecho, pídelo y no continúes sin él. Léela con:
   ```bash
   gh issue view <número-o-url> --comments --json number,title,body,labels,url,comments
   ```
   (`gh` acepta tanto el número como la URL completa). Si el comando falla (issue inexistente, `gh` sin autenticar), informa al usuario y detente. Extrae de la issue el número, título, descripción y comentarios relevantes, e identifica si es una funcionalidad o un error. La issue es la fuente de la petición: no inventes requisitos que no estén en ella; si algo es ambiguo, anótalo en *Dudas y decisiones*.
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
6. **Responde** (tras los pasos 7 y 8) con la ruta del archivo creado, el enlace al comentario de la issue y un resumen de 2-3 líneas, destacando las dudas/decisiones para que el usuario las revise.
7. **Publica el plan como comentario de la issue.** Una vez guardado el archivo, añade su contenido completo como comentario de la issue con:
   ```bash
   gh issue comment <número-o-url> --body-file plans/<num_issue>-<breve-descripcion>.md
   ```
   Si el comando falla, no reintentes en bucle: indícalo al usuario en la respuesta final. Incluye en la respuesta la URL del comentario si `gh` la devuelve.
8. **Notifica en Slack.** Una vez guardado el plan, envía un mensaje al canal `curso-claude-ed3` con la herramienta MCP de Slack (`mcp__slack__slack_post_message`; si su esquema no está cargado, cárgalo antes con ToolSearch). Si hace falta el ID del canal, obténlo con `mcp__slack__slack_list_channels`. El mensaje, en español y breve, debe indicar que ya se ha planificado la tarea: número de issue, descripción y ruta del plan (p. ej. `📝 Planificada la tarea #42: paginar listado de vendehumos. Plan: plans/42-paginar-listado-vendehumos.md`). Si el canal no existe o el envío falla, no reintentes en bucle: indícalo al usuario en la respuesta final.
