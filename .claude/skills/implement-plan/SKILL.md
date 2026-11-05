---
name: implement-plan
description: Implementa un plan guardado en plans/ (generado con plan-feature) en una rama propia creada desde development, aplicando TDD estricto tarea a tarea, marcando cada tarea como hecha en el plan y haciendo un commit por tarea con el slash command /commit. Úsala cuando pidan implementar, ejecutar o desarrollar un plan.
argument-hint: <ruta o nombre del plan, p. ej. plans/1-login-registro-usuarios-jwt.md>
---

# Implementar un plan

Implementa el plan indicado por el usuario, tarea a tarea, con TDD estricto.

Plan indicado: $ARGUMENTS

## 1. Preparación

1. **Localiza el plan.** Si `$ARGUMENTS` es una ruta, úsala; si es solo un nombre o número de issue, búscalo en `plans/`. Si no hay argumento o hay varias coincidencias, pregunta al usuario. Lee el plan completo (alcance, archivos afectados, tareas, criterios de aceptación y *Dudas y decisiones*). Si hay dudas abiertas que bloqueen la implementación, consúltalas antes de empezar.
2. **Comprueba el estado de git** (`git status --short`). Si hay cambios sin commitear que no sean del propio plan, avisa al usuario y pregunta cómo proceder (no los pierdas ni los mezcles en los commits de las tareas).
3. **Rama de trabajo.** El nombre de la rama es el nombre del plan, es decir, el nombre del archivo sin `plans/` ni `.md` (ejemplo: `plans/1-login-registro-usuarios-jwt.md` → rama `1-login-registro-usuarios-jwt`).
   - Si `development` no existe (`git rev-parse --verify development`), créala a partir de `main`: `git branch development main`. Si tampoco existe `main`, detente y consulta al usuario.
   - Crea la rama del plan desde `development`: `git switch -c <nombre-del-plan> development`.
   - Si la rama del plan ya existe, pregunta si continuar en ella (útil para retomar un plan a medias) en lugar de recrearla.
   - Nunca hagas `git push`, ni `--force`, ni `--no-verify`.

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
2. Si algún criterio no se cumple, no lo des por terminado: indícalo o añade las correcciones siguiendo el mismo bucle.
3. Responde con: nombre de la rama, tareas completadas (y las pendientes si las hay), resultado de tests y lint, y cualquier decisión o desviación respecto al plan. Recuerda al usuario que no se ha hecho push.
