/**
 * TEST: Smooth Drag Orchestration - Beautiful Application Experience
 * Verifies the enhanced drag system with elegant transitions and card orchestration
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  ADMIN_URL: 'http://localhost:3000',
  EMAIL: 'demo.beachbar@skan.al', 
  PASSWORD: 'BeachBarDemo2024!',
  HEADLESS: false,
  TIMEOUT: 30000
};

async function testSmoothDragOrchestration() {
  console.log('🎭 TESTING: Smooth Drag Orchestration - Beautiful Application Experience...');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    
    // Capture all console messages for drag system feedback
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯 INFINITE DRAG') || text.includes('DRAG') || text.includes('handleDrag')) {
        console.log(`🖥️  [DRAG]:`, text);
      }
    });
    
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Step 1: Login and prepare fresh state...');
    await page.goto(CONFIG.ADMIN_URL, { waitUntil: 'networkidle2' });
    
    // Clear cache for fresh state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.TIMEOUT });
    await page.type('input[type="email"]', CONFIG.EMAIL);
    await page.type('input[type="password"]', CONFIG.PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.orders-grid', { timeout: CONFIG.TIMEOUT });
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🎨 Step 2: Testing enhanced visual feedback during drag...');
    
    // Get the first order card
    const firstCard = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        return {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          orderNum: card.querySelector('.order-number')?.textContent,
          initialStyles: {
            transform: window.getComputedStyle(card).transform,
            opacity: window.getComputedStyle(card).opacity,
            boxShadow: window.getComputedStyle(card).boxShadow,
            zIndex: window.getComputedStyle(card).zIndex
          }
        };
      }
      return null;
    });

    if (!firstCard) {
      console.log('❌ No card found for testing');
      return;
    }

    console.log(`📋 Testing with order: ${firstCard.orderNum} at (${Math.round(firstCard.x)}, ${Math.round(firstCard.y)})`);
    console.log('   Initial styles:', firstCard.initialStyles);

    // Test 1: Enhanced Drag Start Visual Feedback
    console.log('\n🎭 TEST 1: Enhanced Drag Start Visual Feedback');
    await page.mouse.move(firstCard.x, firstCard.y);
    
    console.log('   📌 Capturing styles BEFORE mousedown...');
    const beforeMouseDown = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const styles = window.getComputedStyle(card);
        return {
          transform: styles.transform,
          opacity: styles.opacity,
          boxShadow: styles.boxShadow,
          zIndex: styles.zIndex,
          filter: styles.filter,
          borderRadius: styles.borderRadius
        };
      }
      return null;
    });
    
    await page.mouse.down();
    await new Promise(resolve => setTimeout(resolve, 300)); // Allow transition time
    
    console.log('   📌 Capturing styles DURING drag start...');
    const duringDragStart = await page.evaluate(() => {
      const card = document.querySelector('.order-card');
      if (card) {
        const styles = window.getComputedStyle(card);
        return {
          transform: styles.transform,
          opacity: styles.opacity,
          boxShadow: styles.boxShadow,
          zIndex: styles.zIndex,
          filter: styles.filter,
          borderRadius: styles.borderRadius
        };
      }
      return null;
    });
    
    console.log('   🎨 Visual Enhancement Analysis:');
    console.log(`     Transform: "${beforeMouseDown.transform}" → "${duringDragStart.transform}"`);
    console.log(`     Opacity: ${beforeMouseDown.opacity} → ${duringDragStart.opacity}`);
    console.log(`     Z-Index: ${beforeMouseDown.zIndex} → ${duringDragStart.zIndex}`);
    console.log(`     Filter: "${beforeMouseDown.filter}" → "${duringDragStart.filter}"`);
    console.log(`     Box Shadow: ${duringDragStart.boxShadow.length > 100 ? 'ENHANCED ✅' : 'BASIC ❌'}`);
    
    // Verify enhancements
    const hasEnhancedTransform = duringDragStart.transform.includes('scale') && duringDragStart.transform.includes('rotate');
    const hasEnhancedZIndex = parseInt(duringDragStart.zIndex) >= 2000;
    const hasEnhancedOpacity = parseFloat(duringDragStart.opacity) >= 0.9;
    const hasEnhancedShadow = duringDragStart.boxShadow.includes('rgba');
    
    console.log(`   ✨ Enhancement Results:`);
    console.log(`     Scale & Rotation: ${hasEnhancedTransform ? '✅ APPLIED' : '❌ MISSING'}`);
    console.log(`     High Z-Index: ${hasEnhancedZIndex ? '✅ APPLIED' : '❌ MISSING'}`);
    console.log(`     Preserved Opacity: ${hasEnhancedOpacity ? '✅ APPLIED' : '❌ MISSING'}`);
    console.log(`     Enhanced Shadow: ${hasEnhancedShadow ? '✅ APPLIED' : '❌ MISSING'}`);

    // Test 2: Fluid Drag Movement with Orchestration
    console.log('\n🌊 TEST 2: Fluid Drag Movement with Card Orchestration');
    
    // Move the card to trigger orchestration effects
    const targetX = firstCard.x + 200;
    const targetY = firstCard.y + 50;
    
    console.log(`   🎯 Moving card from (${Math.round(firstCard.x)}, ${Math.round(firstCard.y)}) to (${Math.round(targetX)}, ${Math.round(targetY)})`);
    
    await page.mouse.move(targetX, targetY, { steps: 10 });
    await new Promise(resolve => setTimeout(resolve, 500)); // Allow orchestration to take effect
    
    // Check for orchestration effects on other cards
    const orchestrationEffects = await page.evaluate(() => {
      const allCards = document.querySelectorAll('.order-card');
      const draggedCard = document.querySelector('.order-card'); // First card is being dragged
      const otherCards = Array.from(allCards).filter(card => card !== draggedCard);
      
      const effects = otherCards.map((card, index) => {
        const styles = window.getComputedStyle(card);
        return {
          index,
          transform: styles.transform,
          opacity: styles.opacity,
          hasTransform: styles.transform !== 'none' && styles.transform !== '',
          hasOpacityChange: parseFloat(styles.opacity) < 1
        };
      });
      
      // Check drop zone highlighting
      const dropZones = document.querySelectorAll('.station-lane, [data-station]');
      const highlightedZones = Array.from(dropZones).filter(zone => {
        const styles = window.getComputedStyle(zone);
        return styles.backgroundColor !== '' && styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
      });
      
      return {
        otherCards: effects,
        highlightedZones: highlightedZones.length,
        totalDropZones: dropZones.length
      };
    });
    
    console.log('   🎭 Orchestration Effects:');
    console.log(`     Other cards affected: ${orchestrationEffects.otherCards.filter(c => c.hasTransform || c.hasOpacityChange).length}/${orchestrationEffects.otherCards.length}`);
    console.log(`     Drop zones highlighted: ${orchestrationEffects.highlightedZones}/${orchestrationEffects.totalDropZones}`);
    
    orchestrationEffects.otherCards.forEach(card => {
      if (card.hasTransform || card.hasOpacityChange) {
        console.log(`       Card ${card.index}: transform="${card.transform}" opacity=${card.opacity}`);
      }
    });

    // Test 3: Beautiful Drop Animation
    console.log('\n💫 TEST 3: Beautiful Drop Animation');
    
    // Find a valid drop zone
    const dropZone = await page.evaluate(() => {
      const zones = document.querySelectorAll('.station-lane, [data-station]');
      for (const zone of zones) {
        const rect = zone.getBoundingClientRect();
        const station = zone.getAttribute('data-station') || 
                        Array.from(zone.classList)
                             .find(cls => cls.startsWith('station-') && cls !== 'station-lane')
                             ?.replace('station-', '');
        if (station && station !== 'new') { // Try to drop in a different station
          return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            station
          };
        }
      }
      return null;
    });
    
    if (dropZone) {
      console.log(`   🎯 Dropping in station: ${dropZone.station} at (${Math.round(dropZone.x)}, ${Math.round(dropZone.y)})`);
      
      // Move to drop zone
      await page.mouse.move(dropZone.x, dropZone.y, { steps: 5 });
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture styles just before drop
      const beforeDrop = await page.evaluate(() => {
        const card = document.querySelector('.order-card');
        if (card) {
          const styles = window.getComputedStyle(card);
          return {
            transform: styles.transform,
            opacity: styles.opacity,
            boxShadow: styles.boxShadow
          };
        }
        return null;
      });
      
      console.log('   📸 Before drop:', beforeDrop);
      
      // Execute drop
      await page.mouse.up();
      
      // Monitor the drop animation sequence
      const animationFrames = [];
      for (let i = 0; i < 8; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const frame = await page.evaluate(() => {
          const card = document.querySelector('.order-card');
          if (card) {
            const styles = window.getComputedStyle(card);
            return {
              timestamp: Date.now(),
              transform: styles.transform,
              opacity: styles.opacity,
              boxShadow: styles.boxShadow.length > 50 ? 'ENHANCED' : 'BASIC'
            };
          }
          return null;
        });
        if (frame) animationFrames.push(frame);
      }
      
      console.log('   🎬 Drop Animation Sequence:');
      animationFrames.forEach((frame, index) => {
        console.log(`     Frame ${index}: transform="${frame.transform}" opacity=${frame.opacity} shadow=${frame.boxShadow}`);
      });
      
      // Wait for complete animation and status update
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 4: Orchestrated Cleanup
    console.log('\n🧹 TEST 4: Orchestrated Cleanup');
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Allow cleanup time
    
    const finalState = await page.evaluate(() => {
      const allCards = document.querySelectorAll('.order-card');
      const allZones = document.querySelectorAll('.station-lane, [data-station]');
      
      const cardStates = Array.from(allCards).map((card, index) => {
        const styles = window.getComputedStyle(card);
        return {
          index,
          opacity: styles.opacity,
          transform: styles.transform,
          zIndex: styles.zIndex,
          isClean: styles.opacity === '1' && 
                  (styles.transform === 'none' || styles.transform === '') &&
                  (styles.zIndex === 'auto' || styles.zIndex === '0')
        };
      });
      
      const zoneStates = Array.from(allZones).map((zone, index) => {
        const styles = window.getComputedStyle(zone);
        return {
          index,
          backgroundColor: styles.backgroundColor,
          transform: styles.transform,
          isClean: (styles.backgroundColor === '' || styles.backgroundColor === 'rgba(0, 0, 0, 0)') &&
                  (styles.transform === 'none' || styles.transform === '')
        };
      });
      
      return {
        cards: cardStates,
        zones: zoneStates,
        cleanCards: cardStates.filter(c => c.isClean).length,
        cleanZones: zoneStates.filter(z => z.isClean).length
      };
    });
    
    console.log('   🧽 Cleanup Results:');
    console.log(`     Clean cards: ${finalState.cleanCards}/${finalState.cards.length}`);
    console.log(`     Clean zones: ${finalState.cleanZones}/${finalState.zones.length}`);
    
    // Show any cards that aren't properly cleaned
    finalState.cards.forEach(card => {
      if (!card.isClean) {
        console.log(`     ⚠️  Card ${card.index}: opacity=${card.opacity} transform="${card.transform}" zIndex=${card.zIndex}`);
      }
    });
    
    finalState.zones.forEach(zone => {
      if (!zone.isClean) {
        console.log(`     ⚠️  Zone ${zone.index}: backgroundColor="${zone.backgroundColor}" transform="${zone.transform}"`);
      }
    });

    // Overall Assessment
    console.log('\n' + '='.repeat(60));
    console.log('🎭 SMOOTH DRAG ORCHESTRATION ASSESSMENT');
    console.log('='.repeat(60));
    
    const assessmentScore = {
      visualEnhancements: hasEnhancedTransform && hasEnhancedZIndex && hasEnhancedShadow ? 100 : 70,
      orchestration: orchestrationEffects.otherCards.filter(c => c.hasTransform || c.hasOpacityChange).length > 0 ? 100 : 50,
      dropAnimation: (animationFrames && animationFrames.length > 5) ? 100 : 75,
      cleanup: (finalState.cleanCards / finalState.cards.length) * 100
    };
    
    const overallScore = Object.values(assessmentScore).reduce((a, b) => a + b) / Object.keys(assessmentScore).length;
    
    console.log(`📊 Performance Metrics:`);
    console.log(`   Visual Enhancements: ${assessmentScore.visualEnhancements}%`);
    console.log(`   Card Orchestration: ${assessmentScore.orchestration}%`);
    console.log(`   Drop Animation: ${assessmentScore.dropAnimation}%`);
    console.log(`   Cleanup Quality: ${Math.round(assessmentScore.cleanup)}%`);
    console.log(`   OVERALL SCORE: ${Math.round(overallScore)}%`);
    
    if (overallScore >= 90) {
      console.log('\n🎉 EXCELLENCE: Beautiful orchestration achieved! Cards dance together harmoniously.');
    } else if (overallScore >= 75) {
      console.log('\n✨ GOOD: Smooth drag working well with minor refinement opportunities.');
    } else {
      console.log('\n⚠️  NEEDS WORK: Drag system functioning but missing the beautiful orchestration.');
    }

    console.log('\n🔍 Keeping browser open for manual verification (15 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 15000));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testSmoothDragOrchestration().catch(console.error);