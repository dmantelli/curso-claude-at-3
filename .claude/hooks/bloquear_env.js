// Hook PreToolUse (Read|Grep|Bash): impide leer archivos `.env`.
// Se permite `.env.example` (plantilla sin secretos).
const PERMITIDOS = ['.env.example']

function es_env_bloqueado(nombre) {
  return /^\.env(\..+)?$/.test(nombre) && !PERMITIDOS.includes(nombre)
}

function ruta_bloqueada(ruta) {
  if (!ruta) return false
  return es_env_bloqueado(ruta.split(/[\\/]/).pop())
}

function comando_bloqueado(comando) {
  const patron = /(^|[\s/='"<])(\.env(?:\.[\w.-]+)?)(?=$|[\s'";|&)>])/g
  for (const m of comando.matchAll(patron)) {
    if (es_env_bloqueado(m[2])) return true
  }
  return false
}

let entrada = ''
process.stdin.on('data', (trozo) => (entrada += trozo))
process.stdin.on('end', () => {
  let datos
  try {
    datos = JSON.parse(entrada)
  } catch {
    process.exit(0)
  }
  const { tool_name, tool_input = {} } = datos
  const bloqueado =
    tool_name === 'Bash'
      ? comando_bloqueado(tool_input.command ?? '')
      : ruta_bloqueada(tool_input.file_path ?? tool_input.path ?? '') ||
        (tool_name === 'Grep' && /\.env/.test(tool_input.glob ?? '') &&
          !/example/.test(tool_input.glob ?? ''))
  if (bloqueado) {
    console.error(
      'Bloqueado: no se pueden leer archivos .env (solo .env.example).'
    )
    process.exit(2)
  }
})
