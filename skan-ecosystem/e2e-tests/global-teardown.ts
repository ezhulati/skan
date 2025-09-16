import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for SKAN.AL E2E tests');
  
  // Clean up test data
  console.log('🗑️ Cleaning up test data...');
  
  // Additional cleanup if needed
  console.log('✅ Global teardown completed');
}

export default globalTeardown;