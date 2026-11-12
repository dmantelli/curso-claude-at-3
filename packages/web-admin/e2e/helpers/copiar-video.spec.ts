import { test, expect } from '@playwright/test'
import { mkdirSync, mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { copiar_video } from './copiar-video'

function carpeta_temporal(): string {
  return mkdtempSync(join(tmpdir(), 'video-'))
}

test('copia el vídeo del recorrido al destino y no está vacío', () => {
  const resultados = carpeta_temporal()
  const carpeta = join(resultados, 'dish-form.keyboard-video-recorrido-chromium')
  mkdirSync(carpeta)
  writeFileSync(join(carpeta, 'video.webm'), 'contenido-de-video')
  const destino = join(carpeta_temporal(), 'videos', 'dish-form-teclado.webm')

  copiar_video(resultados, destino)

  expect(statSync(destino).size).toBeGreaterThan(0)
})

test('ignora los vídeos de otros specs', () => {
  const resultados = carpeta_temporal()
  const otra = join(resultados, 'dish-form.a11y-otro-chromium')
  mkdirSync(otra)
  writeFileSync(join(otra, 'video.webm'), 'otro')

  expect(() => copiar_video(resultados, join(carpeta_temporal(), 'x.webm'))).toThrow(/no se encontró/)
})

test('falla si el vídeo está vacío', () => {
  const resultados = carpeta_temporal()
  const carpeta = join(resultados, 'dish-form.keyboard-video-recorrido-chromium')
  mkdirSync(carpeta)
  writeFileSync(join(carpeta, 'video.webm'), '')

  expect(() => copiar_video(resultados, join(carpeta_temporal(), 'x.webm'))).toThrow(/vacío/)
})
