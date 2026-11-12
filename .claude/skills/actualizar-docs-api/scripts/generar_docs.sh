#!/usr/bin/env bash
# Valida docs/api/openapi.yml con Redocly y genera la documentación HTML.
# Uso: generar_docs.sh [--sin-lint]
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
ENTRADA="${OPENAPI_ENTRADA:-docs/api/openapi.yml}"
SALIDA="${OPENAPI_SALIDA:-docs/api/openapi.html}"
LINT=1

for arg in "$@"; do
  case "$arg" in
    --sin-lint) LINT=0 ;;
    -h | --help)
      echo "Uso: $0 [--sin-lint]"
      echo "Variables: OPENAPI_ENTRADA (docs/api/openapi.yml), OPENAPI_SALIDA (docs/api/openapi.html)"
      exit 0
      ;;
    *)
      echo "Error: argumento desconocido: $arg" >&2
      exit 2
      ;;
  esac
done

cd "$RAIZ"

if [ ! -f "$ENTRADA" ]; then
  echo "Error: no existe $ENTRADA" >&2
  exit 1
fi

# Usa el redocly instalado en el proyecto; si no está, lo descarga con npx
if [ -x node_modules/.bin/redocly ]; then
  redocly() { node_modules/.bin/redocly "$@"; }
else
  echo "Aviso: @redocly/cli no está instalado en el proyecto, se usa npx" >&2
  redocly() { npx --yes @redocly/cli "$@"; }
fi

if [ "$LINT" -eq 1 ]; then
  echo "==> Validando $ENTRADA"
  redocly lint "$ENTRADA"
fi

echo "==> Generando $SALIDA"
redocly build-docs "$ENTRADA" --output "$SALIDA"

echo "Documentación generada en $SALIDA"
