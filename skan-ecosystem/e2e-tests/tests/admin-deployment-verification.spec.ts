import { test, expect } from '@playwright/test';

test.describe('Admin Portal Deployment Verification', () => {
  test('verify admin.skan.al current status', async ({ page }) => {
    console.log('Testing production domain: admin.skan.al');
    
    // Test the production domain
    const response = await page.goto('https://admin.skan.al/demo-request', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take a screenshot to document current state
    await page.screenshot({ 
      path: 'test-results/admin-production-status.png',
      fullPage: true 
    });
    
    console.log('Response status:', response?.status());
    console.log('Response URL:', response?.url());
    
    // Check if we get a 404 or if the site doesn't exist
    if (response?.status() === 404) {
      console.log('✓ Confirmed: admin.skan.al returns 404 - site not deployed');
    } else if (response?.status() === 200) {
      console.log('✓ Site exists - checking if demo request page loads');
      
      // Wait for page content to load
      await page.waitForTimeout(2000);
      
      // Check if it's the actual demo request page or a 404 page
      const pageTitle = await page.title();
      const hasForm = await page.locator('form[name="demo-request"]').isVisible();
      
      console.log('Page title:', pageTitle);
      console.log('Demo form visible:', hasForm);
      
      if (!hasForm) {
        console.log('⚠ Site exists but demo request form not found');
      }
    } else {
      console.log('⚠ Unexpected status:', response?.status());
    }
  });

  test('verify local admin portal form functionality', async ({ page }) => {
    console.log('Testing local admin portal at localhost:3002');
    
    // Test the local version
    await page.goto('http://localhost:3002/demo-request');
    
    // Wait for the form to load
    await page.waitForSelector('form[name="demo-request"]', { timeout: 10000 });
    
    // Take screenshot of the local form
    await page.screenshot({ 
      path: 'test-results/admin-local-form.png',
      fullPage: true 
    });
    
    // Verify form elements are present
    const form = page.locator('form[name="demo-request"]');
    await expect(form).toBeVisible();
    
    // Check for Netlify form attributes
    await expect(form).toHaveAttribute('data-netlify', 'true');
    await expect(form).toHaveAttribute('method', 'POST');
    
    // Check required form fields
    await expect(page.locator('input[name="companyName"]')).toBeVisible();
    await expect(page.locator('input[name="contactName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    
    // Check honeypot field
    await expect(page.locator('input[name="bot-field"]')).toBeHidden();
    
    // Fill out the form with test data
    await page.fill('input[name="companyName"]', 'Test Restaurant');
    await page.fill('input[name="contactName"]', 'Test Manager');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="phone"]', '+355691234567');
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: 'test-results/admin-form-filled.png',
      fullPage: true 
    });
    
    console.log('✓ Local form validation passed - ready for deployment');
  });
});