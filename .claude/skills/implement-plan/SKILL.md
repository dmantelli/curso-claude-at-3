---
name: implement-plan
description: Implementa el plan de una issue de GitHub (número o URL) y deja una PR abierta para revisión. Lee el plan, que está como comentario de la issue, con gh; crea un git worktree (o varios si trabajan varios agentes) en .claude/worktrees con la rama <num_issue>-<breve-descripcion>; aplica TDD estricto tarea a tarea, marca cada tarea en el plan hace un commit por tarea con el skill commit y al final crea la PR contra development para que la revise alguien. Úsala cuando pidan implementar, ejecutar o desarrollar un plan.
argument-hint: <número o URL de la issue>
---

# Implementar un plan

Implementa el plan indicado por el usuario, tarea a tarea, con TDD estricto.

Issue indicada: $ARGUMENTS

## 1. Preparación

1. **Obtén el plan con GitHub CLI.** El usuario debe indicar el número o la URL de la issue; si no lo ha hecho, pídelo y no continúes. Lee la issue y sus comentarios:
   ```bash
   gh issue view <número-o-url> --comments --json number,title,url,comments
   ```
   (`gh` acepta número o URL). El plan es el comentario generado por `plan-feature` (contiene las secciones de la plantilla: lista de tareas, archivos afectados, criterios de aceptación, dudas y decisiones). Si hay varios comentarios con un plan, usa el más reciente y avisa. Si no hay ninguno, o `gh` falla (sin autenticar, issue inexistente), informa al usuario y detente: no inventes el plan. Lee el plan completo; si hay dudas abiertas que bloqueen la implementación, consúltalas antes de empezar.
2. **Nombre de la rama.** Formato `<num_issue>-<breve-descripcion>`: si existe `plans/<num_issue>-*.md`, usa su nombre sin `plans/` ni `.md`; si no, constrúyelo con el título de la issue (minúsculas, sin tildes, palabras separadas por guiones, máximo ~5 palabras). Ejemplo: `42-paginar-listado-vendehumos`.
3. **Comprueba el estado de git** (`git status --short`). Si hay cambios sin commitear que no sean del propio plan, avisa al usuario y pregunta cómo proceder (no los pierdas ni los mezcles en los commits de las tareas). Los worktrees parten de commits, así que esos cambios no estarán en ellos.
4. **Crea el worktree en `.claude/worktrees/`** (nunca cambies de rama en el directorio principal):
   - Si `development` no existe (`git rev-parse --verify development`), créala a partir de `main`: `git branch development main`. Si tampoco existe `main`, detente y consulta al usuario.
   - Asegúrate de que `.claude/worktrees/` no se versiona: si `git check-ignore .claude/worktrees` no lo ignora, añádelo a `.git/info/exclude` (no modifiques archivos versionados).
   - Crea el worktree y la rama desde `development`: `git worktree add .claude/worktrees/<nombre-rama> -b <nombre-rama> development`.
   - Si la rama o el worktree ya existen, pregunta si continuar en ellos (útil para retomar un plan a medias) en lugar de recrearlos.
   - **Varios agentes.** Si el plan tiene bloques de tareas independientes (sin archivos en común) que se van a repartir entre varios agentes, crea además un worktree por agente, con rama derivada de la principal: `git worktree add .claude/worktrees/<nombre-rama>-<area> -b <nombre-rama>-<area> <nombre-rama>`. Cada agente trabaja solo en su worktree y sus tareas; al terminar, intégralos en la rama `<nombre-rama>` (merge sin fast-forward forzado, resolviendo conflictos) desde el worktree principal. Si las tareas son secuenciales o comparten archivos, usa un único worktree.
   - **Trabaja siempre dentro del worktree** (rutas y comandos en `.claude/worktrees/<nombre-rama>`). Instala dependencias en él si hace falta (`npm install`).
   - Guarda el plan leído de la issue en `plans/<nombre-rama>.md` dentro del worktree si no existe (es donde se marcan las tareas `[x]`).
   - Nunca hagas `--force` ni `--no-verify`. El único `git push` permitido es el de la rama del plan en el paso de la PR (sección 4).

## 2. Bucle por tarea

Recorre las tareas de la *Lista de tareas* **en orden**, saltando las ya marcadas `[x]`. Para **cada** tarea:

1. **Rojo.** Escribe primero el test con vitest (en `tests/`) que describa el comportamiento de la tarea. Ejecútalo (`npx vitest run <archivo>`) y **comprueba que falla por la razón esperada** (no por un error de sintaxis o import). Muestra el fallo.
2. **Verde.** Escribe el **mínimo** código necesario para que pase. Ejecuta el test y comprueba que pasa, y ejecuta toda la suite (`npx vitest run`) para verificar que no hay regresiones.
3. **Refactor.** Limpia el código manteniendo los tests en verde.
4. **Calidad.** Ejecuta `npx prettier --write` sobre los archivos tocados (sin `;` innecesarios y comillas simples) y `npx eslint` sobre ellos; corrige lo que salga.
5. **Marca la tarea.** Solo cuando el test pasa con el código implementado, cambia su checkbox de `- [ ]` a `- [x]` en el archivo del plan.
6. **Commit.** Invoca el slash command `/commit` mediante la herramienta Skill (`skill: "commit"`, con una breve descripción de la tarea como argumento). El commit debe incluir el código, los tests y el plan actualizado de **esa tarea**, y solo eso: un commit por tarea.

### Reglas de TDD estricto

- **Nunca** escribas código de producción sin un test que falle antes que lo justifique.
- No avances a la siguiente tarea con tests en rojo ni con lint fallando.
- No modifiques ni borres un test para que pase; corrige el código. Solo se cambia un test si el requisito era erróneo, y se comenta al usuario.
- Tareas que no son código testeable (instalar dependencias, configurar eslint/prettier/vitest, documentación): no inventes tests artificiales. Verifica el resultado con un comando comprobable (p. ej. `npx vitest --version`, `npx eslint .`, `npm test`), indícalo y continúa con el mismo flujo de marcar y commitear. Si la tarea de configurar vitest va antes que los tests, respeta ese orden.
- Respeta las convenciones del proyecto (`CLAUDE.md`): capas controllers / services / repositories / models / utils, funciones en snake_case, textos y mensajes en español, payloads en camelCase y columnas en snake_case.

## 3. Cierre

1. Comprueba los *Criterios de aceptación* del plan con la suite completa (`npx vitest run`) y `npx eslint .`.
2. Si algún criterio no se cumple, no lo des por terminado: indícalo o añade las correcciones siguiendo el mismo bucle y aquellos que se cumplen marcalos como `[x]`.
3. Responde con: nombre de la rama y ruta(s) del/los worktree(s), tareas completadas (y las pendientes si las hay), resultado de tests y lint, y cualquier decisión o desviación respecto al plan. Incluye el enlace a la PR y recuerda al usuario que debe revisarla y mergearla alguien (tú no la mergeas), y que los worktrees siguen en `.claude/worktrees/` (se eliminan con `git worktree remove <ruta>`).

## 4. Pull Request para revisión

Solo si el plan está completamente implementado (todas las tareas `[x]`, criterios cumplidos, tests y lint en verde). Si hay varios worktrees, la PR se crea desde la rama principal `<nombre-rama>` ya integrada.

1. Sube la rama (sin force): `git push -u origin <nombre-rama>` (desde el worktree principal).
2. Crea la PR contra `development` con `gh pr create --base development --head <nombre-rama> --title "<título breve>" --body-file <archivo-temporal>`. El cuerpo, en español, incluye: resumen de los cambios, tareas completadas, resultado de tests/lint, decisiones o desviaciones respecto al plan, `Closes #<num_issue>` y, al final, la línea `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Escribe el cuerpo en un archivo temporal del directorio scratchpad, no en el repositorio.
3. **No mergees la PR** ni actives auto-merge: debe revisarla otra persona antes. Si el repositorio lo permite, pide revisión con `--reviewer` solo si el usuario indicó a quién; si no, no inventes revisores.
4. Si el push o `gh pr create` fallan, no reintentes en bucle: indícalo al usuario. Si ya existe una PR para la rama, no crees otra: muestra su URL (`gh pr view --json url`).

## 5. Notificación en Slack

Como último paso, y solo si el plan ha quedado completamente implementado (todas las tareas `[x]` y criterios de aceptación cumplidos), envía un mensaje al canal `curso-claude-ed3` con la herramienta MCP de Slack (`mcp__slack__slack_post_message`; si su esquema no está cargado, cárgalo antes con ToolSearch). Si hace falta el ID del canal, obténlo con `mcp__slack__slack_list_channels`. El mensaje, en español y breve, debe indicar que ya se ha implementado el plan: nombre del plan, rama, enlace a la PR pendiente de revisión y resultado de tests/lint (p. ej. `✅ Implementado el plan 1-login-registro-usuarios-jwt en la rama 1-login-registro-usuarios-jwt. Tests y lint en verde.`). Si quedan tareas pendientes, no envíes el mensaje de "implementado": indícalo al usuario. Si el canal no existe o el envío falla, no reintentes en bucle: indícalo en la respuesta final.
