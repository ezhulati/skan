/**
 * Debug All Buttons - See exactly what buttons exist on the page
 */

const puppeteer = require('puppeteer');

async function debugAllButtons() {
  console.log('🔍 Debug: Finding all buttons on KDS dashboard...\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Login
    await page.goto('https://admin.skan.al/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`✅ Logged in. URL: ${page.url()}`);
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      console.log('🔄 Navigating to dashboard...');
      await page.goto('https://admin.skan.al/dashboard');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log(`📍 Now at: ${page.url()}`);
    }
    
    // Get ALL button information
    const allButtonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cards = Array.from(document.querySelectorAll('.order-card'));
      
      return {
        totalButtons: buttons.length,
        totalCards: cards.length,
        buttons: buttons.map((btn, index) => ({
          index,
          text: btn.textContent.trim(),
          innerHTML: btn.innerHTML.trim(),
          className: btn.className,
          id: btn.id || 'none',
          disabled: btn.disabled,
          visible: btn.offsetParent !== null,
          parentClass: btn.parentElement?.className || 'none',
          isInCard: btn.closest('.order-card') !== null
        })),
        cards: cards.map((card, index) => ({
          index,
          innerHTML: card.innerHTML.includes('button') ? 'HAS BUTTONS' : 'NO BUTTONS',
          className: card.className,
          orderNumber: card.querySelector('.order-number, [class*="order"]')?.textContent || 'Unknown'
        }))
      };
    });
    
    console.log('📊 PAGE ANALYSIS:');
    console.log('==================');
    console.log(`📦 Order Cards: ${allButtonInfo.totalCards}`);
    console.log(`🔘 Total Buttons: ${allButtonInfo.totalButtons}`);
    
    console.log('\n📋 ORDER CARDS:');
    allButtonInfo.cards.forEach((card, i) => {
      console.log(`  ${i + 1}. Order: ${card.orderNumber} - ${card.innerHTML}`);
    });
    
    console.log('\n🔘 ALL BUTTONS:');
    allButtonInfo.buttons.forEach((btn, i) => {
      const status = btn.visible ? '👁️' : '👻';
      const enabled = btn.disabled ? '🚫' : '✅';
      const inCard = btn.isInCard ? '📦' : '🌐';
      console.log(`  ${i + 1}. ${status}${enabled}${inCard} "${btn.text}" (class: ${btn.className || 'none'})`);
    });
    
    // Look specifically for buttons inside order cards
    console.log('\n📦 BUTTONS INSIDE ORDER CARDS:');
    const cardButtons = allButtonInfo.buttons.filter(btn => btn.isInCard);
    if (cardButtons.length > 0) {
      cardButtons.forEach((btn, i) => {
        console.log(`  ${i + 1}. "${btn.text}" (${btn.className})`);
      });
    } else {
      console.log('  ❌ No buttons found inside order cards');
    }
    
    // Look for specific text patterns
    console.log('\n🔍 SEARCHING FOR SPECIFIC PATTERNS:');
    const patterns = ['PRANOJ', 'GATI', 'SHËRBYER', 'POROSINË', 'SHËNÔ'];
    patterns.forEach(pattern => {
      const matches = allButtonInfo.buttons.filter(btn => 
        btn.text.includes(pattern) || btn.innerHTML.includes(pattern)
      );
      console.log(`  "${pattern}": ${matches.length} matches`);
      matches.forEach(match => {
        console.log(`    - "${match.text}"`);
      });
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/debug-buttons.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved: debug-buttons.png');
    
    return allButtonInfo;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run debug
if (require.main === module) {
  debugAllButtons()
    .then((result) => {
      if (result) {
        console.log('\n✅ Debug completed successfully');
      } else {
        console.log('\n❌ Debug failed');
      }
    })
    .catch(console.error);
}

module.exports = debugAllButtons;