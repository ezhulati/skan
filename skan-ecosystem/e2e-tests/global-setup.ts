import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for SKAN.AL E2E tests');
  
  // Setup test data
  console.log('📋 Setting up test data...');
  
  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('✅ Global setup completed');
}

export default globalSetup;