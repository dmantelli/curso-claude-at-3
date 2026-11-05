import { test, expect } from '@playwright/test'
import { ADMIN } from './helpers/sesion'
import { escribir, pulsar, registrar_uso_de_raton, tab_hasta, usos_de_raton } from './helpers/teclado'

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

  await test.step('3. Guardar los cambios y verlos en la lista', async () => {
    await tab_hasta(page, page.getByRole('button', { name: 'Guardar' }), 30)
    await pulsar(page, 'Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Platos' })).toBeVisible()
    const fila = page.locator('tbody tr', { hasText: `${nombre_original} (editado)` })
    await expect(fila).toContainText('13.50 €')
  })

  await test.step('4. Enviar el formulario incompleto y recorrer los errores', async () => {
    await tab_hasta(page, page.getByRole('link', { name: 'Nuevo plato' }), 30)
    await pulsar(page, 'Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Nuevo plato' })).toBeVisible()

    // Enter dentro de un campo envía el formulario (aún vacío)
    await tab_hasta(page, campo_nombre)
    await pulsar(page, 'Enter')

    const resumen = page.locator('#resumen-errores')
    await expect(resumen).toBeFocused()
    await expect(resumen).toHaveAttribute('role', 'alert')
    await expect(resumen.getByRole('link')).toHaveText(['El nombre es obligatorio', 'El precio debe ser mayor que 0'])
    await expect(campo_nombre).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#dish-name-error')).toHaveText('El nombre es obligatorio')
    await expect(campo_precio).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#dish-price-error')).toHaveText('El precio debe ser mayor que 0')

    // Saltar al primer campo erróneo con el enlace del resumen
    await tab_hasta(page, resumen.getByRole('link', { name: 'El nombre es obligatorio' }), 5)
    await pulsar(page, 'Enter')
    await expect(campo_nombre).toBeFocused()

    // Retroceder al segundo enlace y saltar al campo de precio
    await tab_hasta(page, resumen.getByRole('link', { name: 'El precio debe ser mayor que 0' }), 5, 'Shift+Tab')
    await pulsar(page, 'Enter')
    await expect(campo_precio).toBeFocused()
  })

  expect(await usos_de_raton(page)).toBe(0)
})
