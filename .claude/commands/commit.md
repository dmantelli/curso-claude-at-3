---
description: Crea un commit siguiendo la especificación Conventional Commits
argument-hint: [descripción opcional del cambio]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
---

# Commit con Conventional Commits

Crea un commit de los cambios actuales siguiendo la especificación [Conventional Commits 1.0.0](https://www.conventionalcommits.org/es/v1.0.0/).

## Contexto

- Estado: !`git status --short`
- Cambios en staging: !`git diff --cached`
- Cambios sin stage: !`git diff`
- Últimos commits (para seguir el estilo): !`git log --oneline -10`

Indicaciones del usuario (si las hay): $ARGUMENTS

## Formato

```
<tipo>[ámbito opcional][!]: <descripción>

[cuerpo opcional]

[pie(s) opcional(es)]
```

### Tipos permitidos

- `feat`: nueva funcionalidad (SemVer MINOR)
- `fix`: corrección de un error (SemVer PATCH)
- `docs`: solo documentación
- `style`: formato que no afecta al código (espacios, comillas, punto y coma)
- `refactor`: cambio de código que no corrige un error ni añade funcionalidad
- `perf`: mejora de rendimiento
- `test`: añadir o corregir tests
- `build`: cambios en el sistema de build o dependencias (npm, etc.)
- `ci`: cambios en la configuración de CI
- `chore`: tareas de mantenimiento que no tocan `src` ni tests
- `revert`: revierte un commit anterior

### Reglas

1. La descripción va en **español**, en imperativo o infinitivo según el estilo del historial, en minúscula, sin punto final y con un máximo de ~72 caracteres en la primera línea.
2. El ámbito es opcional y va entre paréntesis, p. ej. `feat(vendehumos): ...`. Usa nombres del dominio o de la capa (`controllers`, `services`, `repositories`, `models`, `utils`, `db`).
3. Un cambio incompatible se marca con `!` tras el tipo/ámbito y/o con un pie `BREAKING CHANGE: <explicación>`.
4. El cuerpo (opcional) explica el **por qué**, separado de la descripción por una línea en blanco.
5. Si los cambios mezclan varios propósitos, propón dividirlos en varios commits y haz `git add` solo de los archivos de cada uno.

## Pasos

1. Analiza el estado y los diffs de arriba. Si no hay cambios, díselo al usuario y termina.
2. Determina el tipo y el ámbito que mejor describen el cambio.
3. Si no hay nada en staging, añade los archivos relevantes por nombre (nunca `git add -A` ni `git add .`; evita ficheros como `.env` o `vendehumos.db`).
4. Redacta el mensaje y muéstraselo al usuario en una línea antes de commitear.
5. Ejecuta `git commit` con el mensaje (usa varios `-m` o un heredoc para cuerpo y pies).
6. Muestra el resultado con `git log -1 --stat`.

## Restricciones

- No hagas `git push`.
- No uses `--amend`, `--no-verify` ni modifiques la configuración de git.
- Si un hook de pre-commit falla, corrige el problema y crea un commit **nuevo**.
