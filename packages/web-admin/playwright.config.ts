import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    locale: 'es-ES'
  },
  webServer: [
    {
      command: 'npm run dev -w @resttek/api',
      cwd: '../..',
      url: 'http://localhost:3000/health',
      reuseExistingServer: true,
      timeout: 60_000
    },
    {
      command: 'npm run start -w @resttek/web-admin',
      cwd: '../..',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 180_000
    }
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } }]
})
