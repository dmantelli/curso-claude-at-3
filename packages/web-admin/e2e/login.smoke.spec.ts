import { test, expect } from '@playwright/test'

test('abre la pantalla de login', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
})
