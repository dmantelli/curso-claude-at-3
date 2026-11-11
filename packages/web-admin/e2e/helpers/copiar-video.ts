import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Copia el vídeo grabado del recorrido por teclado a `destino`. Falla si no existe o está vacío. */
export function copiar_video(carpeta_resultados: string, destino: string): void {
  const candidatos = readdirSync(carpeta_resultados)
    .filter(nombre => nombre.includes('keyboard-video'))
    .map(nombre => join(carpeta_resultados, nombre, 'video.webm'))
    .filter(ruta => {
      try {
        return statSync(ruta).isFile()
      } catch {
        return false
      }
    })
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)

  if (candidatos.length === 0) throw new Error(`no se encontró el vídeo del recorrido en ${carpeta_resultados}`)
  if (statSync(candidatos[0]).size === 0) throw new Error(`el vídeo ${candidatos[0]} está vacío`)

  mkdirSync(dirname(destino), { recursive: true })
  copyFileSync(candidatos[0], destino)
}
