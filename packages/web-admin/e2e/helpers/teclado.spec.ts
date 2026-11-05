import { test, expect } from '@playwright/test'
import { elegir_opcion, escribir, pulsar, registrar_uso_de_raton, tab_hasta, usos_de_raton } from './teclado'

const PAGINA = `<!doctype html><html lang="es"><body>
  <label>Nombre <input id="nombre"></label>
  <label>Categoría <select id="cat"><option>Entrante</option><option>Principal</option><option>Postre</option></select></label>
  <button id="boton" onclick="document.title='pulsado'">Guardar</button>
</body></html>`

test.beforeEach(async ({ page }) => {
  await registrar_uso_de_raton(page)
  await page.route('**/prueba', route => route.fulfill({ contentType: 'text/html', body: PAGINA }))
  await page.goto('/prueba')
})

test('tab_hasta avanza con Tab hasta enfocar el elemento', async ({ page }) => {
  await tab_hasta(page, page.locator('#cat'))
  await expect(page.locator('#cat')).toBeFocused()
})

test('tab_hasta falla si el elemento no es alcanzable con el teclado', async ({ page }) => {
  await expect(tab_hasta(page, page.locator('#no-existe'), 3)).rejects.toThrow(/no se alcanzó/)
})

test('escribir, elegir_opcion y pulsar funcionan solo con teclado', async ({ page }) => {
  await tab_hasta(page, page.locator('#nombre'))
  await escribir(page, 'Tarta de queso')
  await tab_hasta(page, page.locator('#cat'))
  await elegir_opcion(page, 'Postre')
  await tab_hasta(page, page.locator('#boton'))
  await pulsar(page, 'Enter')
  await expect(page.locator('#nombre')).toHaveValue('Tarta de queso')
  await expect(page.locator('#cat')).toHaveValue('Postre')
  await expect(page).toHaveTitle('pulsado')
  expect(await usos_de_raton(page)).toBe(0)
})

test('el contador detecta cualquier uso del ratón', async ({ page }) => {
  await page.locator('#boton').click()
  expect(await usos_de_raton(page)).toBeGreaterThan(0)
})
