import type { Locator, Page } from '@playwright/test'

/** Pausa entre pulsaciones para que el vídeo sea legible (ms). */
export const PAUSA_TECLA = 120

/** Pausa al terminar cada tramo del recorrido para que el vídeo se pueda seguir (ms). */
export const PAUSA_SECCION = 600

/** Cuenta eventos de puntero (ratón/táctil). El teclado nunca los genera. */
export async function registrar_uso_de_raton(page: Page): Promise<void> {
  await page.addInitScript(() => {
    ;(window as unknown as { __usosRaton: number }).__usosRaton = 0
    for (const tipo of ['pointerdown', 'mousedown', 'wheel']) {
      document.addEventListener(
        tipo,
        () => ((window as unknown as { __usosRaton: number }).__usosRaton += 1),
        true
      )
    }
  })
}

export async function usos_de_raton(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __usosRaton?: number }).__usosRaton ?? 0)
}

export async function pulsar(page: Page, tecla: string): Promise<void> {
  await page.keyboard.press(tecla)
  await page.waitForTimeout(PAUSA_TECLA)
}

export async function escribir(page: Page, texto: string): Promise<void> {
  await page.keyboard.type(texto, { delay: 60 })
  await page.waitForTimeout(PAUSA_TECLA)
}

/** Avanza con Tab (o la tecla indicada, p. ej. Shift+Tab) hasta enfocar el elemento; falla si no se alcanza. */
export async function tab_hasta(page: Page, destino: Locator, maximo = 40, tecla = 'Tab'): Promise<void> {
  for (let i = 0; i <= maximo; i++) {
    const enfocado = await destino
      .evaluate(el => el === document.activeElement, undefined, { timeout: 500 })
      .catch(() => false)
    if (enfocado) return
    if (i < maximo) await pulsar(page, tecla)
  }
  throw new Error(`no se alcanzó el elemento con ${tecla} tras ${maximo} pulsaciones`)
}

/** Con un <select> enfocado, elige la opción escribiendo su texto (búsqueda por teclado). */
export async function elegir_opcion(page: Page, texto: string): Promise<void> {
  await escribir(page, texto)
}
