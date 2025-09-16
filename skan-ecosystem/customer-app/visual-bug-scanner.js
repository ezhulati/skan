const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:4323';
const PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Features', path: '/features' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Demo', path: '/demo' }
];

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Samsung Galaxy S8+', width: 360, height: 740 }
];

const DESKTOP_VIEWPORTS = [
  { name: 'Small Desktop', width: 1024, height: 768 },
  { name: 'Medium Desktop', width: 1366, height: 768 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
];

// Issues storage
let allIssues = [];
let screenshotCounter = 0;

// Utility functions
function addIssue(severity, category, page, description, element = null, screenshot = null) {
  allIssues.push({
    severity,
    category,
    page,
    description,
    element,
    screenshot,
    timestamp: new Date().toISOString()
  });
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(__dirname, 'screenshots', `${++screenshotCounter}-${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Color contrast calculation
function calculateContrastRatio(color1, color2) {
  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  const l1 = getLuminance(...color1);
  const l2 = getLuminance(...color2);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

// Test functions
async function checkAccessibility(page, pageName) {
  console.log(`Checking accessibility for ${pageName}...`);
  
  // Check for missing alt text
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => !img.alt || img.alt.trim() === '').map(img => ({
      src: img.src,
      selector: img.tagName + (img.id ? '#' + img.id : '') + (img.className ? '.' + img.className.split(' ').join('.') : '')
    }));
  });
  
  if (imagesWithoutAlt.length > 0) {
    addIssue('High', 'Accessibility', pageName, 
      `${imagesWithoutAlt.length} images missing alt text`, 
      imagesWithoutAlt.map(img => img.selector).join(', '));
  }
  
  // Check for proper heading structure
  const headingStructure = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings.map(h => ({
      level: parseInt(h.tagName.charAt(1)),
      text: h.textContent.trim().substring(0, 50),
      selector: h.tagName + (h.id ? '#' + h.id : '') + (h.className ? '.' + h.className.split(' ').join('.') : '')
    }));
  });
  
  // Check for multiple H1s
  const h1Count = headingStructure.filter(h => h.level === 1).length;
  if (h1Count > 1) {
    addIssue('Medium', 'Accessibility', pageName, `Page has ${h1Count} H1 elements (should have exactly 1)`);
  } else if (h1Count === 0) {
    addIssue('High', 'Accessibility', pageName, 'Page is missing H1 element');
  }
  
  // Check for proper heading hierarchy
  for (let i = 1; i < headingStructure.length; i++) {
    const current = headingStructure[i];
    const previous = headingStructure[i - 1];
    if (current.level > previous.level + 1) {
      addIssue('Medium', 'Accessibility', pageName, 
        `Heading hierarchy skip from H${previous.level} to H${current.level}`, 
        current.selector);
    }
  }
  
  // Check for interactive elements without focus indicators
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => {
    const focused = document.activeElement;
    const style = window.getComputedStyle(focused);
    return {
      tagName: focused.tagName,
      outline: style.outline,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
      border: style.border
    };
  });
  
  if (focusedElement.outline === 'none' && focusedElement.outlineWidth === '0px' && 
      !focusedElement.boxShadow.includes('rgb') && !focusedElement.border.includes('rgb')) {
    addIssue('High', 'Accessibility', pageName, 'Interactive element lacks visible focus indicator');
  }
}

async function checkColorContrast(page, pageName) {
  console.log(`Checking color contrast for ${pageName}...`);
  
  const contrastIssues = await page.evaluate(() => {
    const issues = [];
    const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, li, td, th, label');
    
    Array.from(textElements).forEach(element => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = style.fontWeight;
      
      // Only check elements with visible text
      if (element.textContent.trim() && color !== backgroundColor) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          issues.push({
            element: element.tagName + (element.className ? '.' + element.className.split(' ').join('.') : ''),
            color,
            backgroundColor,
            fontSize,
            fontWeight,
            text: element.textContent.trim().substring(0, 30)
          });
        }
      }
    });
    
    return issues;
  });
  
  // Note: Full contrast calculation would require more complex color parsing
  // This is a simplified check for obvious issues
  contrastIssues.forEach(issue => {
    if (issue.color === issue.backgroundColor) {
      addIssue('Critical', 'Visual', pageName, 
        `Text invisible - same color as background`, 
        issue.element);
    }
  });
}

async function checkLayoutIssues(page, pageName) {
  console.log(`Checking layout issues for ${pageName}...`);
  
  // Check for horizontal scrollbars
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.body.scrollWidth > window.innerWidth;
  });
  
  if (hasHorizontalScroll) {
    addIssue('Medium', 'Layout', pageName, 'Page has horizontal scrollbar');
  }
  
  // Check for elements with very high z-index
  const highZIndexElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.filter(el => {
      const zIndex = parseInt(window.getComputedStyle(el).zIndex);
      return zIndex > 9999;
    }).map(el => ({
      selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''),
      zIndex: window.getComputedStyle(el).zIndex
    }));
  });
  
  if (highZIndexElements.length > 0) {
    addIssue('Low', 'Layout', pageName, 
      `Elements with excessive z-index values`, 
      highZIndexElements.map(el => `${el.selector} (z-index: ${el.zIndex})`).join(', '));
  }
  
  // Check for elements that overflow their containers
  const overflowIssues = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const issues = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (rect.right > parentRect.right + 10 || rect.bottom > parentRect.bottom + 10) {
          issues.push({
            selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''),
            overflow: 'visible content extends beyond parent'
          });
        }
      }
    });
    
    return issues.slice(0, 5); // Limit to first 5 issues
  });
  
  if (overflowIssues.length > 0) {
    addIssue('Medium', 'Layout', pageName, 
      `Elements overflowing their containers`, 
      overflowIssues.map(issue => issue.selector).join(', '));
  }
}

async function checkInteractiveElements(page, pageName) {
  console.log(`Checking interactive elements for ${pageName}...`);
  
  // Check button and link sizes for mobile accessibility
  const smallInteractiveElements = await page.evaluate(() => {
    const interactive = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    return Array.from(interactive).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    }).map(el => ({
      selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''),
      width: Math.round(el.getBoundingClientRect().width),
      height: Math.round(el.getBoundingClientRect().height)
    }));
  });
  
  if (smallInteractiveElements.length > 0) {
    addIssue('Medium', 'UX', pageName, 
      `Interactive elements smaller than 44x44px minimum tap target`, 
      smallInteractiveElements.map(el => `${el.selector} (${el.width}x${el.height}px)`).join(', '));
  }
  
  // Check for links without href
  const invalidLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.filter(link => !link.href || link.href === '#').map(link => ({
      selector: 'a' + (link.id ? '#' + link.id : '') + (link.className ? '.' + link.className.split(' ').join('.') : ''),
      text: link.textContent.trim().substring(0, 30)
    }));
  });
  
  if (invalidLinks.length > 0) {
    addIssue('Medium', 'UX', pageName, 
      `Links without valid href attributes`, 
      invalidLinks.map(link => `${link.selector}: "${link.text}"`).join(', '));
  }
}

async function checkTypography(page, pageName) {
  console.log(`Checking typography for ${pageName}...`);
  
  const typographyIssues = await page.evaluate(() => {
    const issues = [];
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    const fontSizes = [];
    const lineHeights = [];
    
    Array.from(textElements).forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight);
      
      if (el.textContent.trim()) {
        fontSizes.push(fontSize);
        if (!isNaN(lineHeight)) {
          lineHeights.push(lineHeight / fontSize);
        }
        
        // Check for very small text
        if (fontSize < 12) {
          issues.push({
            type: 'small-text',
            selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
            fontSize: fontSize,
            text: el.textContent.trim().substring(0, 30)
          });
        }
        
        // Check for very large text that might break layout
        if (fontSize > 72) {
          issues.push({
            type: 'oversized-text',
            selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
            fontSize: fontSize,
            text: el.textContent.trim().substring(0, 30)
          });
        }
        
        // Check line height
        if (!isNaN(lineHeight) && (lineHeight / fontSize < 1.2 || lineHeight / fontSize > 2)) {
          issues.push({
            type: 'poor-line-height',
            selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
            lineHeight: lineHeight / fontSize,
            text: el.textContent.trim().substring(0, 30)
          });
        }
      }
    });
    
    // Check for font size consistency
    const uniqueFontSizes = [...new Set(fontSizes)].sort((a, b) => a - b);
    if (uniqueFontSizes.length > 8) {
      issues.push({
        type: 'inconsistent-font-sizes',
        count: uniqueFontSizes.length,
        sizes: uniqueFontSizes
      });
    }
    
    return issues;
  });
  
  typographyIssues.forEach(issue => {
    switch (issue.type) {
      case 'small-text':
        addIssue('Medium', 'Typography', pageName, 
          `Text size too small (${issue.fontSize}px)`, 
          issue.selector);
        break;
      case 'oversized-text':
        addIssue('Low', 'Typography', pageName, 
          `Text size unusually large (${issue.fontSize}px)`, 
          issue.selector);
        break;
      case 'poor-line-height':
        addIssue('Low', 'Typography', pageName, 
          `Poor line height ratio (${issue.lineHeight.toFixed(2)})`, 
          issue.selector);
        break;
      case 'inconsistent-font-sizes':
        addIssue('Low', 'Typography', pageName, 
          `Too many font sizes (${issue.count}) - consider consolidating for consistency`);
        break;
    }
  });
}

async function checkPerformance(page, pageName) {
  console.log(`Checking performance for ${pageName}...`);
  
  // Check for render-blocking resources
  const resources = await page.evaluate(() => {
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    
    return {
      stylesheets: stylesheets.length,
      scripts: scripts.length,
      inlineStyles: document.querySelectorAll('style').length,
      inlineScripts: document.querySelectorAll('script:not([src])').length
    };
  });
  
  if (resources.stylesheets > 5) {
    addIssue('Low', 'Performance', pageName, 
      `Many external stylesheets (${resources.stylesheets}) - consider bundling`);
  }
  
  if (resources.scripts > 10) {
    addIssue('Low', 'Performance', pageName, 
      `Many external scripts (${resources.scripts}) - consider bundling`);
  }
  
  // Check for large images
  const largeImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => {
      const rect = img.getBoundingClientRect();
      return rect.width > 1200 || rect.height > 800;
    }).map(img => ({
      src: img.src,
      width: Math.round(img.getBoundingClientRect().width),
      height: Math.round(img.getBoundingClientRect().height)
    }));
  });
  
  if (largeImages.length > 0) {
    addIssue('Low', 'Performance', pageName, 
      `Large images that may impact loading`, 
      largeImages.map(img => `${img.src} (${img.width}x${img.height}px)`).join(', '));
  }
}

async function runComprehensiveTest() {
  console.log('Starting comprehensive visual bug scan...');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const page of PAGES) {
      console.log(`\n=== Testing ${page.name} (${page.path}) ===`);
      
      // Test desktop version
      console.log('Testing desktop version...');
      const desktopContext = await browser.newContext({
        viewport: DESKTOP_VIEWPORTS[1], // Medium desktop
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      
      const desktopPage = await desktopContext.newPage();
      
      try {
        await desktopPage.goto(`${BASE_URL}${page.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // Wait for page to fully load
        await desktopPage.waitForTimeout(2000);
        
        // Take screenshot
        await takeScreenshot(desktopPage, `${page.name}-desktop`);
        
        // Run all checks
        await checkAccessibility(desktopPage, `${page.name} (Desktop)`);
        await checkColorContrast(desktopPage, `${page.name} (Desktop)`);
        await checkLayoutIssues(desktopPage, `${page.name} (Desktop)`);
        await checkInteractiveElements(desktopPage, `${page.name} (Desktop)`);
        await checkTypography(desktopPage, `${page.name} (Desktop)`);
        await checkPerformance(desktopPage, `${page.name} (Desktop)`);
        
      } catch (error) {
        addIssue('Critical', 'Loading', `${page.name} (Desktop)`, 
          `Page failed to load: ${error.message}`);
      }
      
      await desktopContext.close();
      
      // Test mobile version
      console.log('Testing mobile version...');
      const mobileContext = await browser.newContext({
        viewport: MOBILE_VIEWPORTS[1], // iPhone 12 Pro
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const mobilePage = await mobileContext.newPage();
      
      try {
        await mobilePage.goto(`${BASE_URL}${page.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // Wait for page to fully load
        await mobilePage.waitForTimeout(2000);
        
        // Take screenshot
        await takeScreenshot(mobilePage, `${page.name}-mobile`);
        
        // Run mobile-specific checks
        await checkLayoutIssues(mobilePage, `${page.name} (Mobile)`);
        await checkInteractiveElements(mobilePage, `${page.name} (Mobile)`);
        
        // Check for mobile-specific issues
        const mobileIssues = await mobilePage.evaluate(() => {
          const issues = [];
          
          // Check viewport meta tag
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          if (!viewportMeta) {
            issues.push({ type: 'missing-viewport', description: 'Missing viewport meta tag' });
          }
          
          // Check for text that might be too small on mobile
          const smallText = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            return fontSize < 16 && el.textContent.trim().length > 10;
          });
          
          if (smallText.length > 0) {
            issues.push({ 
              type: 'small-mobile-text', 
              count: smallText.length,
              description: `${smallText.length} text elements smaller than 16px on mobile` 
            });
          }
          
          return issues;
        });
        
        mobileIssues.forEach(issue => {
          const severity = issue.type === 'missing-viewport' ? 'High' : 'Medium';
          addIssue(severity, 'Mobile', `${page.name} (Mobile)`, issue.description);
        });
        
      } catch (error) {
        addIssue('Critical', 'Loading', `${page.name} (Mobile)`, 
          `Page failed to load: ${error.message}`);
      }
      
      await mobileContext.close();
    }
    
  } finally {
    await browser.close();
  }
  
  // Generate report
  console.log('\n=== Generating Report ===');
  generateReport();
}

function generateReport() {
  // Sort issues by severity and category
  const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  // Group issues by severity
  const groupedIssues = allIssues.reduce((groups, issue) => {
    groups[issue.severity] = groups[issue.severity] || [];
    groups[issue.severity].push(issue);
    return groups;
  }, {});
  
  // Generate summary
  const summary = {
    totalIssues: allIssues.length,
    critical: (groupedIssues['Critical'] || []).length,
    high: (groupedIssues['High'] || []).length,
    medium: (groupedIssues['Medium'] || []).length,
    low: (groupedIssues['Low'] || []).length,
    categories: {}
  };
  
  // Count by category
  allIssues.forEach(issue => {
    summary.categories[issue.category] = (summary.categories[issue.category] || 0) + 1;
  });
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    issues: groupedIssues,
    recommendations: generateRecommendations(groupedIssues)
  };
  
  // Save report
  const reportPath = path.join(__dirname, 'visual-bug-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate human-readable report
  generateHumanReadableReport(report);
  
  console.log(`\\n✅ Scan complete! Found ${allIssues.length} issues.`);
  console.log(`📊 Critical: ${summary.critical}, High: ${summary.high}, Medium: ${summary.medium}, Low: ${summary.low}`);
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log(`📄 Human-readable report: ${path.join(__dirname, 'visual-bug-report.txt')}`);
}

function generateRecommendations(groupedIssues) {
  const recommendations = [];
  
  if (groupedIssues['Critical']) {
    recommendations.push({
      priority: 'Immediate',
      description: 'Fix critical issues immediately - these severely impact user experience',
      issues: groupedIssues['Critical'].length
    });
  }
  
  if (groupedIssues['High']) {
    recommendations.push({
      priority: 'High',
      description: 'Address high priority issues within 1-2 days',
      issues: groupedIssues['High'].length
    });
  }
  
  // Add specific recommendations based on issue patterns
  const accessibilityIssues = allIssues.filter(i => i.category === 'Accessibility').length;
  if (accessibilityIssues > 0) {
    recommendations.push({
      priority: 'High',
      description: 'Accessibility compliance is crucial for legal compliance and user experience',
      action: 'Implement WCAG 2.1 AA standards'
    });
  }
  
  return recommendations;
}

function generateHumanReadableReport(report) {
  let output = '';
  output += '='.repeat(80) + '\\n';
  output += 'SKAN.AL VISUAL BUG SCAN REPORT\\n';
  output += '='.repeat(80) + '\\n\\n';
  
  output += `Generated: ${new Date(report.timestamp).toLocaleString()}\\n`;
  output += `Base URL: ${BASE_URL}\\n\\n`;
  
  // Summary
  output += 'SUMMARY\\n';
  output += '-'.repeat(40) + '\\n';
  output += `Total Issues Found: ${report.summary.totalIssues}\\n`;
  output += `🔴 Critical: ${report.summary.critical}\\n`;
  output += `🟠 High: ${report.summary.high}\\n`;
  output += `🟡 Medium: ${report.summary.medium}\\n`;
  output += `🔵 Low: ${report.summary.low}\\n\\n`;
  
  // Categories
  output += 'ISSUES BY CATEGORY\\n';
  output += '-'.repeat(40) + '\\n';
  Object.entries(report.summary.categories).forEach(([category, count]) => {
    output += `${category}: ${count}\\n`;
  });
  output += '\\n';
  
  // Detailed issues
  ['Critical', 'High', 'Medium', 'Low'].forEach(severity => {
    if (report.issues[severity] && report.issues[severity].length > 0) {
      output += `${severity.toUpperCase()} PRIORITY ISSUES\\n`;
      output += '-'.repeat(40) + '\\n';
      
      report.issues[severity].forEach((issue, index) => {
        output += `${index + 1}. [${issue.category}] ${issue.page}\\n`;
        output += `   ${issue.description}\\n`;
        if (issue.element) {
          output += `   Element: ${issue.element}\\n`;
        }
        if (issue.screenshot) {
          output += `   Screenshot: ${issue.screenshot}\\n`;
        }
        output += '\\n';
      });
    }
  });
  
  // Recommendations
  if (report.recommendations.length > 0) {
    output += 'RECOMMENDATIONS\\n';
    output += '-'.repeat(40) + '\\n';
    report.recommendations.forEach((rec, index) => {
      output += `${index + 1}. [${rec.priority}] ${rec.description}\\n`;
      if (rec.action) {
        output += `   Action: ${rec.action}\\n`;
      }
      if (rec.issues) {
        output += `   Issues: ${rec.issues}\\n`;
      }
      output += '\\n';
    });
  }
  
  // Save human-readable report
  const txtReportPath = path.join(__dirname, 'visual-bug-report.txt');
  fs.writeFileSync(txtReportPath, output);
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);