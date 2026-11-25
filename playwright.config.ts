import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:4173/Lectura-rapida/',
    ...devices['Desktop Chrome'],
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/Lectura-rapida/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
