import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4300',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    locale: 'es-ES'
  },
  webServer: [
    {
      command: 'npm run dev -w @resttek/api',
      cwd: '../..',
      env: { PORT: '3100' },
      url: 'http://localhost:3100/health',
      reuseExistingServer: false,
      timeout: 60_000
    },
    {
      command: 'npx ng serve --port 4300 --proxy-config proxy.e2e.conf.json',
      cwd: '.',
      url: 'http://localhost:4300',
      reuseExistingServer: false,
      timeout: 180_000
    }
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } }]
})
