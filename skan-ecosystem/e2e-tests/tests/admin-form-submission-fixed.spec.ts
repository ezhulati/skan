import { test, expect } from '@playwright/test';

test.describe('Admin Portal Form Submission Test (Fixed)', () => {
  test('test actual form submission on admin.skan.al with correct selectors', async ({ page }) => {
    console.log('Testing form submission on https://admin.skan.al/demo-request');
    
    // Navigate to the demo request page
    await page.goto('https://admin.skan.al/demo-request');
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/admin-form-before-submission-fixed.png',
      fullPage: true 
    });
    
    // Fill out the form using exact Albanian placeholder text
    console.log('Filling out the form using Albanian placeholders...');
    
    const nameField = page.locator('input[placeholder="Shkruaj emrin tënd"]');
    const surnameField = page.locator('input[placeholder="Shkruaj mbiemrin tënd"]');
    const emailField = page.locator('input[placeholder="Shkruaj email-in tënd"]');
    const businessField = page.locator('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]');
    
    await nameField.fill('Test User');
    await surnameField.fill('Test Surname');
    await emailField.fill('test@example.com');
    await businessField.fill('Test Restaurant');
    
    // Take screenshot after filling
    await page.screenshot({ 
      path: 'test-results/admin-form-filled-submission-fixed.png',
      fullPage: true 
    });
    
    // Listen for all network responses
    const responses: string[] = [];
    page.on('response', response => {
      responses.push(`${response.status()} - ${response.url()}`);
      console.log(`Response: ${response.status()} - ${response.url()}`);
    });
    
    // Find the submit button - "Dërgo Kërkesën" means "Send Request"
    const submitButton = page.locator('button:has-text("Dërgo Kërkesën")');
    
    console.log('Clicking submit button...');
    
    // Click submit and monitor what happens
    try {
      await submitButton.click();
      
      // Wait for any navigation or responses
      await page.waitForTimeout(5000);
      
      // Take screenshot after submission
      await page.screenshot({ 
        path: 'test-results/admin-form-after-submission-fixed.png',
        fullPage: true 
      });
      
      // Check current URL and page content
      const currentUrl = page.url();
      const pageTitle = await page.title();
      const pageContent = await page.content();
      
      console.log('Current URL after submission:', currentUrl);
      console.log('Page title:', pageTitle);
      
      // Check for 404 errors or success messages
      const has404 = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('Page not found');
      const hasSuccess = currentUrl.includes('success') || pageContent.includes('success') || pageContent.includes('submitted');
      
      console.log('Has 404 error:', has404);
      console.log('Has success indication:', hasSuccess);
      
      // Log all responses
      console.log('All responses during submission:');
      responses.forEach(resp => console.log('  -', resp));
      
      // If we're still on demo-request page, something went wrong
      if (currentUrl.includes('/demo-request') && !currentUrl.includes('success')) {
        console.log('⚠ Still on demo-request page - form may not have submitted properly');
      }
      
    } catch (error) {
      console.log('Error during form submission:', error);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'test-results/admin-form-submission-error-fixed.png',
        fullPage: true 
      });
    }
  });
});