module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  rootDir: '../',
  setupFilesAfterEnv: ['<rootDir>/config/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  testTimeout: 60000,
  collectCoverage: false,
  verbose: true,
  reporters: [
    'default'
  ],
  globals: {
    BASE_URLS: {
      MARKETING: 'https://skan.al',
      CUSTOMER: 'https://order.skan.al',
      ADMIN: 'https://admin.skan.al',
      API: 'https://api.skan.al'
    },
    TEST_DATA: {
      VENUE_SLUG: 'beach-bar-durres',
      TABLE_NUMBER: 'a1',
      TEST_EMAIL: 'manager_email1@gmail.com',
      TEST_PASSWORD: 'demo123'
    }
  }
};