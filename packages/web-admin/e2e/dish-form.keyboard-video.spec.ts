import { test, expect } from '@playwright/test'
import { ADMIN } from './helpers/sesion'
import { elegir_opcion, escribir, pulsar, registrar_uso_de_raton, tab_hasta, usos_de_raton } from './helpers/teclado'

/**
 * Recorrido de accesibilidad grabado en vídeo: todo el flujo se hace SOLO con el teclado.
 * `video: 'on'` (playwright.config.ts) graba el test completo; ver `npm run e2e:video`.
 */
test('formulario de platos: recorrido completo solo con teclado', async ({ page }) => {
  await registrar_uso_de_raton(page)
  const campo_nombre = page.locator('#dish-name')
  const campo_precio = page.locator('#dish-price')
  let nombre_original = ''

  await test.step('1. Iniciar sesión y abrir la edición de un plato', async () => {
    await page.goto('/login')
    await tab_hasta(page, page.getByLabel('Correo electrónico'))
    await escribir(page, ADMIN.email)
    await pulsar(page, 'Tab')
    await expect(page.getByLabel('Contraseña')).toBeFocused()
    await escribir(page, ADMIN.password)
    await pulsar(page, 'Enter')
    await page.waitForURL('**/dashboard')

    const restaurante = page.locator('button.restaurant-toggle').first()
    await tab_hasta(page, restaurante)
    await pulsar(page, 'Enter')
    const enlace_platos = page.getByRole('link', { name: 'Platos' })
    await tab_hasta(page, enlace_platos)
    await pulsar(page, 'Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Platos' })).toBeVisible()

    const editar = page.locator('tbody tr a[href$="/edit"]').first()
    nombre_original = (await page.locator('tbody tr .dish-name').first().innerText()).replace(/ \(editado\)$/, '')
    await tab_hasta(page, editar)
    await pulsar(page, 'Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Editar plato' })).toBeVisible()
    await expect(campo_nombre).toHaveValue(new RegExp(`^${nombre_original}`))
  })

  await test.step('2. Modificar el nombre y el precio', async () => {
    await tab_hasta(page, campo_nombre)
    await pulsar(page, 'Control+A')
    await escribir(page, `${nombre_original} (editado)`)
    await expect(campo_nombre).toHaveValue(`${nombre_original} (editado)`)

    await pulsar(page, 'Tab')
    await expect(campo_precio).toBeFocused()
    await pulsar(page, 'Control+A')
    await escribir(page, '13.5')
    await expect(campo_precio).toHaveValue('13.5')
  })

  const estado = page.locator('[role="status"]')
  const chips = page.locator('ul.ingredient-chips li')
  let ingrediente_a = ''
  let ingrediente_b = ''

  await test.step('3. Añadir dos ingredientes y quitar uno', async () => {
    const opciones = (await page.locator('#new-ingredient option').allInnerTexts()).slice(1)
    const en_plato = await page.locator('ul.ingredient-chips li span').allInnerTexts()
    const libres = opciones.filter(o => !en_plato.some(t => t.startsWith(o)))
    expect(libres.length, 'el seed debe dejar al menos 2 ingredientes libres').toBeGreaterThanOrEqual(2)
    ;[ingrediente_a, ingrediente_b] = libres

    await tab_hasta(page, page.locator('#new-ingredient'))
    await elegir_opcion(page, ingrediente_a)
    await pulsar(page, 'Tab')
    await expect(page.locator('#new-ingredient-qty')).toBeFocused()
    await pulsar(page, 'Control+A')
    await escribir(page, '2')
    await pulsar(page, 'Enter')
    await expect(estado).toHaveText(`Ingrediente ${ingrediente_a} añadido`)
    await expect(chips.filter({ hasText: ingrediente_a })).toHaveCount(1)

    await tab_hasta(page, page.locator('#new-ingredient'), 5, 'Shift+Tab')
    await elegir_opcion(page, ingrediente_b)
    await pulsar(page, 'Tab')
    await pulsar(page, 'Control+A')
    await escribir(page, '1')
    await pulsar(page, 'Enter')
    await expect(estado).toHaveText(`Ingrediente ${ingrediente_b} añadido`)

    const quitar_a = page.getByRole('button', { name: `Quitar ${ingrediente_a}` })
    await tab_hasta(page, quitar_a, 15, 'Shift+Tab')
    await pulsar(page, 'Enter')
    await expect(estado).toHaveText(`Ingrediente ${ingrediente_a} quitado`)
    await expect(chips.filter({ hasText: ingrediente_a })).toHaveCount(0)
    await expect(chips.filter({ hasText: ingrediente_b })).toHaveCount(1)
  })

  await test.step('4. Guardar los cambios y verlos en la lista', async () => {
    await tab_hasta(page, page.getByRole('button', { name: 'Guardar' }), 30)
    await pulsar(page, 'Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Platos' })).toBeVisible()
    const fila = page.locator('tbody tr', { hasText: `${nombre_original} (editado)` })
    await expect(fila).toContainText('13.50 €')
  })

  expect(await usos_de_raton(page)).toBe(0)
})
