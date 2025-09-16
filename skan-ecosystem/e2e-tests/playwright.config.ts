import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Global timeout for each action */
    actionTimeout: 10000,
    /* Global timeout for each navigation */
    navigationTimeout: 30000,
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  /* Configure projects for major browsers and devices */
  projects: [
    {
      name: 'desktop-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'desktop-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'desktop-webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro'],
      },
    },
    // Accessibility-focused tests
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      testMatch: '**/accessibility/**/*.spec.ts'
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'cd ../marketing-site && npm run dev',
      port: 4321,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../customer-app && npm start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../admin-portal && npm run dev',
      port: 3002,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    }
  ],

  /* Test timeout */
  timeout: 60000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 10000,
  },

  /* Global test configuration */
  globalTimeout: 60 * 60 * 1000, // 1 hour
});