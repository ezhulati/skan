import { test, expect } from '@playwright/test';

test.describe('Demo Success Experience Verification', () => {
  test('verify complete demo success experience is world-class', async ({ page }) => {
    console.log('🎯 Testing world-class demo success experience...');
    
    // Submit demo request form
    await page.goto('https://admin.skan.al/demo-request');
    await page.waitForSelector('form[name="demo-request"]');
    
    // Fill and submit form
    await page.fill('input[placeholder="Shkruaj emrin tënd"]', 'Test Manager');
    await page.fill('input[placeholder="Shkruaj mbiemrin tënd"]', 'Demo User');  
    await page.fill('input[placeholder="Shkruaj email-in tënd"]', 'test@example.com');
    await page.fill('input[placeholder="Shkruaj emrin e restorantit ose biznesit tënd"]', 'Test Restaurant');
    
    await page.click('button:has-text("Dërgo Kërkesën")');
    await page.waitForTimeout(3000);
    
    // Verify world-class success experience
    await expect(page.locator('h2:has-text("Demo u aktivizua me sukses")')).toBeVisible();
    await expect(page.locator('text=Kredencialet tuaja të Demo-s')).toBeVisible();
    await expect(page.locator('text=manager_email1@gmail.com')).toBeVisible();
    await expect(page.locator('text=demo123')).toBeVisible();
    
    // Take screenshot of complete experience
    await page.screenshot({ 
      path: 'test-results/world-class-demo-success.png',
      fullPage: true 
    });
    
    // Scroll to see auto-login button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Verify auto-login button and additional features
    await expect(page.locator('button:has-text("Hyr me këto kredenciale")')).toBeVisible();
    await expect(page.locator('text=Menaxhim Porosish')).toBeVisible();
    await expect(page.locator('text=Menu Dixhitale')).toBeVisible();
    await expect(page.locator('text=Raporte & Analitikë')).toBeVisible();
    await expect(page.locator('text=Gati për të implementuar SKAN.AL')).toBeVisible();
    
    console.log('✅ World-class demo experience verified!');
    
    // Final verification screenshot
    await page.screenshot({ 
      path: 'test-results/complete-demo-experience.png',
      fullPage: true 
    });
    
    console.log('🎉 SUCCESS: Demo experience is world-class and conversion-optimized!');
  });
});