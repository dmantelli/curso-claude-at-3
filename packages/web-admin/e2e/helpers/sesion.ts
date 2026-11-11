import type { Page } from '@playwright/test'

export const ADMIN = { email: 'admin@resttek.com', password: 'admin@resttek.com' }

export async function iniciar_sesion(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(ADMIN.email)
  await page.getByLabel('Contraseña').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.waitForURL('**/dashboard')
}

export async function primer_restaurante_id(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  const respuesta = await page.request.get('/api/v1/restaurants', { headers: { Authorization: `Bearer ${token}` } })
  const restaurantes = (await respuesta.json()) as { id: string }[]
  return restaurantes[0].id
}
