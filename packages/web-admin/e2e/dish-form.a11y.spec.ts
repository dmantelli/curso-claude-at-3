import { test, expect, type Page } from '@playwright/test'
import { iniciar_sesion, primer_restaurante_id } from './helpers/sesion'

// Controles enfocables del formulario "Nuevo plato" sin ingredientes, en orden de tabulación.
const CONTROLES_FORMULARIO = 11

async function abrir_formulario_nuevo(page: Page): Promise<void> {
  await iniciar_sesion(page)
  const id = await primer_restaurante_id(page)
  await page.goto(`/restaurants/${id}/dishes/new`)
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo plato' })).toBeVisible()
}

test.describe('Formulario de platos - foco visible', () => {
  test('cada control muestra un indicador de foco de al menos 2px y contraste 3:1', async ({ page }) => {
    await abrir_formulario_nuevo(page)
    await page.keyboard.press('Shift') // modalidad de teclado para :focus-visible
    await page.getByRole('link', { name: 'Volver a la lista de platos' }).focus()

    for (let i = 0; i < CONTROLES_FORMULARIO; i++) {
      const foco = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const estilo = getComputedStyle(el)
        const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number)
        const luminancia = ([r, g, b]: number[]) => {
          const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
        }
        let fondo = el
        let color = rgb(getComputedStyle(fondo).backgroundColor)
        while ((color.length === 4 && color[3] === 0) || color.length === 0) {
          fondo = fondo.parentElement as HTMLElement
          color = rgb(getComputedStyle(fondo).backgroundColor)
        }
        const l1 = luminancia(rgb(estilo.outlineColor))
        const l2 = luminancia(color)
        return {
          nombre: el.getAttribute('aria-label') || el.id || el.textContent?.trim() || el.tagName,
          estilo: estilo.outlineStyle,
          ancho: parseFloat(estilo.outlineWidth),
          contraste: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
        }
      })
      expect(foco.estilo, `${foco.nombre}: outline-style`).not.toBe('none')
      expect(foco.ancho, `${foco.nombre}: outline-width`).toBeGreaterThanOrEqual(2)
      expect(foco.contraste, `${foco.nombre}: contraste`).toBeGreaterThanOrEqual(3)
      await page.keyboard.press('Tab')
    }
  })
})

test.describe('Formulario de platos - tamaño de los objetivos (WCAG 2.5.8)', () => {
  test('todos los controles interactivos miden al menos 24x24 px', async ({ page }) => {
    await abrir_formulario_nuevo(page)
    await page.locator('#new-ingredient').selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Añadir ingrediente' }).click()
    await expect(page.getByRole('button', { name: /^Quitar / })).toBeVisible()

    const controles = page.locator('app-dish-form a, app-dish-form button, app-dish-form input, app-dish-form select, app-dish-form textarea')
    const total = await controles.count()
    expect(total).toBeGreaterThanOrEqual(12)
    for (let i = 0; i < total; i++) {
      const caja = await controles.nth(i).boundingBox()
      const nombre = await controles.nth(i).evaluate(e => e.getAttribute('aria-label') || e.id || e.textContent?.trim())
      expect(caja!.width, `${nombre}: ancho`).toBeGreaterThanOrEqual(24)
      expect(caja!.height, `${nombre}: alto`).toBeGreaterThanOrEqual(24)
    }
  })
})
