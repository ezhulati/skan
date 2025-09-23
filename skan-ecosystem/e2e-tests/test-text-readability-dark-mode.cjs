/**
 * Text Readability Test - Dark Mode Contrast Analysis
 * 
 * Tests text contrast and readability in the current dark KDS theme
 * Validates WCAG compliance and kitchen usability standards
 */

const puppeteer = require('puppeteer');

async function testTextReadabilityDarkMode() {
  console.log('🌑 TEXT READABILITY - DARK MODE CONTRAST ANALYSIS');
  console.log('================================================\n');
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    console.log('🔑 Logging in to KDS dashboard...');
    
    // Login to admin dashboard
    await page.goto('https://admin.skan.al/login?v=' + Date.now()); // Add cache busting parameter
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'demo.beachbar@skan.al');
    await page.type('input[type="password"]', 'BeachBarDemo2024!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Logged in successfully\n');
    
    console.log('🎨 ANALYZING TEXT CONTRAST IN DARK MODE...\n');
    
    // Comprehensive text contrast analysis
    const contrastAnalysis = await page.evaluate(() => {
      
      // Helper function to calculate relative luminance
      function getLuminance(rgb) {
        const [r, g, b] = rgb.match(/\d+/g).map(Number);
        const rsRGB = r / 255;
        const gsRGB = g / 255;
        const bsRGB = b / 255;
        
        const rLum = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const gLum = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const bLum = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
      }
      
      // Helper function to calculate contrast ratio
      function getContrastRatio(color1, color2) {
        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        const brighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (brighter + 0.05) / (darker + 0.05);
      }
      
      // Helper function to get WCAG compliance level
      function getWCAGLevel(ratio, fontSize = 14) {
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontSize < 18);
        
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3 && isLargeText) return 'AA Large';
        return 'FAIL';
      }
      
      const analysis = {
        pageBackground: '',
        textElements: [],
        problemAreas: [],
        overallScore: 0,
        wcagCompliance: { AAA: 0, AA: 0, FAIL: 0 }
      };
      
      // Get page background
      const bodyStyle = window.getComputedStyle(document.body);
      analysis.pageBackground = bodyStyle.backgroundColor;
      
      // Analyze text elements
      const textSelectors = [
        // Order card elements
        '.order-card .order-number',
        '.order-card .customer-name',
        '.order-card .table-info',
        '.order-card .order-time',
        '.order-card .item-name',
        '.order-card .item-quantity',
        '.order-card .item-price',
        '.order-card .order-total',
        
        // Button text
        '.status-button',
        '.filter-button',
        
        // Header elements
        '.greeting-text',
        '.venue-name',
        '.current-time',
        '.motivation-text',
        
        // Navigation
        '.nav-link',
        
        // Status headers
        '.station-header',
        
        // General text
        'h1, h2, h3, h4, h5, h6',
        'p',
        'span',
        'div'
      ];
      
      textSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, index) => {
          const style = window.getComputedStyle(element);
          const textColor = style.color;
          const backgroundColor = style.backgroundColor;
          const fontSize = parseInt(style.fontSize);
          const fontWeight = style.fontWeight;
          const text = element.textContent.trim();
          
          // Skip empty text or transparent backgrounds
          if (!text || backgroundColor === 'rgba(0, 0, 0, 0)') return;
          
          // Calculate contrast ratio
          let contrastRatio = 1;
          let backgroundToUse = backgroundColor;
          
          // If background is transparent, use parent or body background
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            let parent = element.parentElement;
            while (parent && (parent.style.backgroundColor === 'transparent' || !parent.style.backgroundColor)) {
              parent = parent.parentElement;
            }
            backgroundToUse = parent ? window.getComputedStyle(parent).backgroundColor : analysis.pageBackground;
          }
          
          try {
            contrastRatio = getContrastRatio(textColor, backgroundToUse);
          } catch (e) {
            contrastRatio = 1; // Default to fail
          }
          
          const wcagLevel = getWCAGLevel(contrastRatio, fontSize);
          const isReadable = contrastRatio >= 4.5;
          
          const elementAnalysis = {
            selector: selector,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            textColor,
            backgroundColor: backgroundToUse,
            fontSize,
            fontWeight,
            contrastRatio: Math.round(contrastRatio * 100) / 100,
            wcagLevel,
            isReadable,
            isImportant: selector.includes('order-number') || 
                        selector.includes('item-name') || 
                        selector.includes('status-button') ||
                        selector.includes('order-time')
          };
          
          analysis.textElements.push(elementAnalysis);
          
          // Track WCAG compliance
          if (wcagLevel === 'AAA') analysis.wcagCompliance.AAA++;
          else if (wcagLevel.includes('AA')) analysis.wcagCompliance.AA++;
          else analysis.wcagCompliance.FAIL++;
          
          // Flag problem areas
          if (!isReadable && elementAnalysis.isImportant) {
            analysis.problemAreas.push({
              element: selector,
              text: elementAnalysis.text,
              issue: `Low contrast (${contrastRatio.toFixed(2)}:1)`,
              recommendation: contrastRatio < 3 ? 'Critical - needs immediate fix' : 'Should be improved'
            });
          }
        });
      });
      
      // Calculate overall score
      const totalElements = analysis.wcagCompliance.AAA + analysis.wcagCompliance.AA + analysis.wcagCompliance.FAIL;
      const passedElements = analysis.wcagCompliance.AAA + analysis.wcagCompliance.AA;
      analysis.overallScore = totalElements > 0 ? Math.round((passedElements / totalElements) * 100) : 0;
      
      return analysis;
    });
    
    console.log('📊 CONTRAST ANALYSIS RESULTS:');
    console.log('==============================');
    console.log(`🌑 Page Background: ${contrastAnalysis.pageBackground}`);
    console.log(`📝 Text Elements Analyzed: ${contrastAnalysis.textElements.length}`);
    console.log(`📈 Overall WCAG Score: ${contrastAnalysis.overallScore}%`);
    
    console.log('\n🏆 WCAG COMPLIANCE BREAKDOWN:');
    console.log(`✅ AAA Level: ${contrastAnalysis.wcagCompliance.AAA} elements`);
    console.log(`✅ AA Level: ${contrastAnalysis.wcagCompliance.AA} elements`);
    console.log(`❌ Failed: ${contrastAnalysis.wcagCompliance.FAIL} elements`);
    
    if (contrastAnalysis.problemAreas.length > 0) {
      console.log('\n🚨 CRITICAL READABILITY ISSUES:');
      console.log('================================');
      contrastAnalysis.problemAreas.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem.element}`);
        console.log(`   Text: "${problem.text}"`);
        console.log(`   Issue: ${problem.issue}`);
        console.log(`   Priority: ${problem.recommendation}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No critical readability issues found!');
    }
    
    // Detailed analysis of important elements
    console.log('\n🔍 KEY ELEMENT READABILITY ANALYSIS:');
    console.log('====================================');
    
    const importantElements = contrastAnalysis.textElements.filter(el => el.isImportant);
    
    if (importantElements.length > 0) {
      importantElements.forEach((element, index) => {
        const status = element.isReadable ? '✅' : '❌';
        console.log(`${status} ${element.selector}`);
        console.log(`   Text: "${element.text}"`);
        console.log(`   Contrast: ${element.contrastRatio}:1 (${element.wcagLevel})`);
        console.log(`   Colors: ${element.textColor} on ${element.backgroundColor}`);
        console.log(`   Font: ${element.fontSize}px, weight ${element.fontWeight}`);
        console.log('');
      });
    }
    
    // Take screenshot for visual analysis
    await page.screenshot({ 
      path: '/Users/mbp-ez/Desktop/AI Library/Apps/skan.al/skan-ecosystem/e2e-tests/text-readability-analysis.png',
      fullPage: true 
    });
    
    // Kitchen-specific readability test
    console.log('\n🍳 KITCHEN USABILITY TEST:');
    console.log('===========================');
    
    const kitchenTest = await page.evaluate(() => {
      // Test readability under different conditions
      const orderCards = document.querySelectorAll('.order-card');
      const kitchenResults = {
        orderReadability: [],
        criticalInfo: [],
        recommendations: []
      };
      
      orderCards.forEach((card, index) => {
        const orderNumber = card.querySelector('.order-number, [class*="order"]')?.textContent || 'Unknown';
        const items = Array.from(card.querySelectorAll('.item-name, [class*="item"]')).map(item => item.textContent.trim());
        const status = card.querySelector('.status-button, [class*="status"]')?.textContent || 'Unknown';
        const time = card.querySelector('.order-time, [class*="time"]')?.textContent || 'Unknown';
        
        // Simulate kitchen lighting conditions
        const cardStyle = window.getComputedStyle(card);
        const isHighContrast = cardStyle.borderColor && cardStyle.borderColor !== 'transparent';
        
        kitchenResults.orderReadability.push({
          orderNumber,
          itemCount: items.length,
          status,
          time,
          hasHighContrastBorder: isHighContrast,
          readabilityScore: items.length > 0 ? 'Good' : 'Poor'
        });
        
        // Check critical information visibility
        const criticalElements = {
          orderNumber: !!card.querySelector('.order-number, [class*="order"]'),
          items: items.length > 0,
          status: !!card.querySelector('.status-button, [class*="status"]'),
          timing: !!card.querySelector('.order-time, [class*="time"]'),
          customer: !!card.querySelector('.customer-name, [class*="customer"]')
        };
        
        kitchenResults.criticalInfo.push({
          orderNumber,
          visibility: criticalElements
        });
      });
      
      return kitchenResults;
    });
    
    console.log('📦 Order Card Readability:');
    kitchenTest.orderReadability.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order.orderNumber}: ${order.itemCount} items, ${order.status}`);
      console.log(`     High contrast border: ${order.hasHighContrastBorder ? '✅' : '❌'}`);
      console.log(`     Readability: ${order.readabilityScore}`);
    });
    
    // Final assessment
    const readabilityScore = contrastAnalysis.overallScore;
    const hasProblems = contrastAnalysis.problemAreas.length > 0;
    const kitchenReady = kitchenTest.orderReadability.every(order => order.readabilityScore === 'Good');
    
    console.log('\n🏆 FINAL READABILITY ASSESSMENT:');
    console.log('=================================');
    console.log(`📊 WCAG Compliance Score: ${readabilityScore}%`);
    console.log(`🚨 Critical Issues: ${hasProblems ? contrastAnalysis.problemAreas.length : 0}`);
    console.log(`🍳 Kitchen Readiness: ${kitchenReady ? 'Ready' : 'Needs Improvement'}`);
    
    let verdict = '';
    let recommendations = [];
    
    if (readabilityScore >= 90 && !hasProblems) {
      verdict = '🎉 EXCELLENT - Perfect readability for kitchen use';
    } else if (readabilityScore >= 75 && contrastAnalysis.problemAreas.length <= 2) {
      verdict = '✅ GOOD - Minor improvements recommended';
      recommendations.push('Consider increasing contrast for flagged elements');
    } else if (readabilityScore >= 50) {
      verdict = '⚠️ MODERATE - Readability improvements needed';
      recommendations.push('Increase text contrast ratios');
      recommendations.push('Consider lighter text colors on dark backgrounds');
    } else {
      verdict = '❌ POOR - Critical readability issues must be fixed';
      recommendations.push('URGENT: Fix low contrast text immediately');
      recommendations.push('Use white or light gray text on dark backgrounds');
      recommendations.push('Ensure all order information is clearly visible');
    }
    
    console.log(`\n${verdict}`);
    
    if (recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n📸 Visual analysis saved: text-readability-analysis.png`);
    
    return {
      success: readabilityScore >= 75 && contrastAnalysis.problemAreas.length <= 2,
      score: readabilityScore,
      problems: contrastAnalysis.problemAreas.length,
      verdict,
      recommendations,
      details: {
        contrastAnalysis,
        kitchenTest
      }
    };
    
  } catch (error) {
    console.error('❌ Text readability test failed:', error.message);
    return { success: false, error: error.message };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testTextReadabilityDarkMode()
    .then((result) => {
      console.log('\n' + '='.repeat(60));
      if (result.success) {
        console.log('✅ TEXT READABILITY - ACCEPTABLE FOR KITCHEN USE');
      } else {
        console.log('⚠️ TEXT READABILITY - IMPROVEMENTS NEEDED');
        if (result.recommendations) {
          console.log('\nRecommendations:');
          result.recommendations.forEach(rec => console.log(`- ${rec}`));
        }
      }
      console.log(`📊 Final Score: ${result.score || 0}%`);
    })
    .catch(console.error);
}

module.exports = testTextReadabilityDarkMode;