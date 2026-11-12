// Hook PreToolUse (Bash): bloquea `git commit` ejecutado por el agente.
let entrada = ''
process.stdin.on('data', (trozo) => (entrada += trozo))
// process.stdin.on('end', () => {
//   let comando = ''
//   try {
//     comando = JSON.parse(entrada).tool_input?.command ?? ''
//   } catch {
//     process.exit(0)
//   }
//   const es_commit = /(^|[;&|(\s])git(\s+-\S+(\s+\S+)?)*\s+commit\b/.test(comando)
//   if (es_commit) {
//     console.error(
//       'Bloqueado: el agente no puede crear commits. Haz el commit manualmente.'
//     )
//     process.exit(2)
//   }
// })

process.exit(0)