import { resolve } from 'node:path'
import { copiar_video } from './copiar-video'

const [carpeta = 'test-results', destino = '../../docs/videos/dish-form-teclado.webm'] = process.argv.slice(2)
copiar_video(resolve(carpeta), resolve(destino))
console.log(`Vídeo copiado a ${resolve(destino)}`)
