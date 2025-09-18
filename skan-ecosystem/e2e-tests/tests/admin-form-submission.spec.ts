import { test, expect } from '@playwright/test';

test.describe('Admin Portal Form Submission Test', () => {
  test('test actual form submission on admin.skan.al', async ({ page }) => {
    console.log('Testing form submission on https://admin.skan.al/demo-request');
    
    // Navigate to the demo request page
    await page.goto('https://admin.skan.al/demo-request');
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/admin-form-before-submission.png',
      fullPage: true 
    });
    
    // Fill out the form with test data
    console.log('Filling out the form...');
    
    // Check if fields exist and fill them
    const nameField = page.locator('input[placeholder*="emrin"], input[name*="name"], input[placeholder*="Name"]').first();
    const surnameField = page.locator('input[placeholder*="mbiemrin"], input[name*="surname"], input[placeholder*="Last"]').first();
    const emailField = page.locator('input[placeholder*="email"], input[type="email"]').first();
    const businessField = page.locator('input[placeholder*="biznesit"], input[name*="business"], input[placeholder*="Business"]').first();
    
    await nameField.fill('Test User');
    await surnameField.fill('Test Surname');
    await emailField.fill('test@example.com');
    await businessField.fill('Test Restaurant');
    
    // Take screenshot after filling
    await page.screenshot({ 
      path: 'test-results/admin-form-filled-submission.png',
      fullPage: true 
    });
    
    // Listen for navigation/response events
    const responses: string[] = [];
    page.on('response', response => {
      responses.push(`${response.status()} - ${response.url()}`);
      console.log(`Response: ${response.status()} - ${response.url()}`);
    });
    
    // Find and click the submit button
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Dërgo")').first();
    
    console.log('Clicking submit button...');
    
    // Click submit and wait for navigation or response
    try {
      const [response] = await Promise.all([
        page.waitForResponse(response => response.url().includes('demo-request') || response.status() === 404, { timeout: 15000 }),
        submitButton.click()
      ]);
      
      console.log('Form submitted. Response status:', response.status());
      console.log('Response URL:', response.url());
      
      // Wait a moment for any redirects
      await page.waitForTimeout(2000);
      
      // Take screenshot after submission
      await page.screenshot({ 
        path: 'test-results/admin-form-after-submission.png',
        fullPage: true 
      });
      
      // Check current URL and page content
      const currentUrl = page.url();
      const pageTitle = await page.title();
      const hasErrorMessage = await page.locator('text=404, text=not found, text=error').isVisible().catch(() => false);
      
      console.log('Current URL after submission:', currentUrl);
      console.log('Page title:', pageTitle);
      console.log('Has error message:', hasErrorMessage);
      
      // Log all responses
      console.log('All responses during submission:');
      responses.forEach(resp => console.log('  -', resp));
      
    } catch (error) {
      console.log('Error during form submission:', error);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'test-results/admin-form-submission-error.png',
        fullPage: true 
      });
    }
  });
});