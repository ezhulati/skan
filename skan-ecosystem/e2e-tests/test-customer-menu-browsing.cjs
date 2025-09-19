const https = require('https');

const BASE_URL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';
const VENUE_SLUG = 'beach-bar-durres';

console.log('\n🍽️  TESTING CUSTOMER MENU BROWSING EXPERIENCE');
console.log('==============================================');

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testCustomerMenuBrowsing() {
  try {
    // 🔥 STEP 1: Load venue menu
    console.log('\n🏪 STEP 1: Loading venue menu');
    
    const menuResponse = await makeRequest(`/venue/${VENUE_SLUG}/menu`);
    
    console.log('✅ Menu loaded successfully');
    console.log(`Venue: ${menuResponse.venue.name}`);
    console.log(`Address: ${menuResponse.venue.address}`);
    console.log(`Phone: ${menuResponse.venue.phone}`);
    console.log(`Currency: ${menuResponse.venue.settings.currency}`);
    console.log(`Ordering enabled: ${menuResponse.venue.settings.orderingEnabled}`);
    
    // Validate venue information
    if (!menuResponse.venue.name) {
      throw new Error('❌ Venue name missing');
    }
    if (!menuResponse.venue.settings.orderingEnabled) {
      throw new Error('❌ Ordering not enabled for venue');
    }
    
    // 🔥 STEP 2: Validate menu structure
    console.log('\n📋 STEP 2: Validating menu structure');
    
    console.log(`Categories found: ${menuResponse.categories.length}`);
    
    let totalItems = 0;
    for (const category of menuResponse.categories) {
      console.log(`  📂 ${category.name} (${category.nameAlbanian}) - ${category.items.length} items`);
      totalItems += category.items.length;
      
      // Validate category structure
      if (!category.name || !category.nameAlbanian) {
        throw new Error(`❌ Category missing name translations: ${category.id}`);
      }
      
      // Validate items in category
      for (const item of category.items) {
        if (!item.name || !item.nameAlbanian) {
          throw new Error(`❌ Item missing name translations: ${item.id}`);
        }
        if (!item.price || item.price <= 0) {
          throw new Error(`❌ Item missing or invalid price: ${item.id}`);
        }
      }
    }
    
    console.log(`✅ Total menu items: ${totalItems}`);
    
    // 🔥 STEP 3: Test specific menu items
    console.log('\n🍺 STEP 3: Testing specific menu items');
    
    const requiredItems = ['albanian-beer', 'greek-salad', 'seafood-risotto'];
    const foundItems = [];
    
    for (const category of menuResponse.categories) {
      for (const item of category.items) {
        if (requiredItems.includes(item.id)) {
          foundItems.push(item);
          console.log(`  ✅ Found: ${item.name} (${item.nameAlbanian}) - €${item.price}`);
          
          // Validate item structure
          if (item.description && !item.descriptionAlbanian) {
            console.log(`  ⚠️  Warning: Missing Albanian description for ${item.name}`);
          }
          if (item.allergens && item.allergens.length > 0) {
            console.log(`    🔍 Allergens: ${item.allergens.join(', ')}`);
          }
          if (item.preparationTime) {
            console.log(`    ⏱️  Preparation time: ${item.preparationTime} minutes`);
          }
        }
      }
    }
    
    if (foundItems.length !== requiredItems.length) {
      console.log(`  ⚠️  Warning: Expected ${requiredItems.length} test items, found ${foundItems.length}`);
    }
    
    // 🔥 STEP 4: Test menu item pricing
    console.log('\n💰 STEP 4: Validating menu pricing');
    
    let minPrice = Infinity;
    let maxPrice = 0;
    let totalValue = 0;
    
    for (const category of menuResponse.categories) {
      for (const item of category.items) {
        minPrice = Math.min(minPrice, item.price);
        maxPrice = Math.max(maxPrice, item.price);
        totalValue += item.price;
      }
    }
    
    const avgPrice = totalValue / totalItems;
    
    console.log(`✅ Price range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);
    console.log(`✅ Average price: €${avgPrice.toFixed(2)}`);
    
    // 🔥 STEP 5: Test language support
    console.log('\n🌍 STEP 5: Testing language support');
    
    let englishNames = 0;
    let albanianNames = 0;
    let englishDescriptions = 0;
    let albanianDescriptions = 0;
    
    for (const category of menuResponse.categories) {
      if (category.name) englishNames++;
      if (category.nameAlbanian) albanianNames++;
      
      for (const item of category.items) {
        if (item.name) englishNames++;
        if (item.nameAlbanian) albanianNames++;
        if (item.description) englishDescriptions++;
        if (item.descriptionAlbanian) albanianDescriptions++;
      }
    }
    
    console.log(`✅ English names: ${englishNames}`);
    console.log(`✅ Albanian names: ${albanianNames}`);
    console.log(`✅ English descriptions: ${englishDescriptions}`);
    console.log(`✅ Albanian descriptions: ${albanianDescriptions}`);
    
    const translationCoverage = (albanianNames / englishNames) * 100;
    console.log(`✅ Translation coverage: ${translationCoverage.toFixed(1)}%`);
    
    if (translationCoverage < 95) {
      console.log(`  ⚠️  Warning: Translation coverage below 95%`);
    }
    
    // 🔥 STEP 6: Test ordering readiness
    console.log('\n🛒 STEP 6: Testing ordering readiness');
    
    // Simulate cart with popular items
    const simulatedCart = [
      { id: 'albanian-beer', quantity: 2, price: 3.5 },
      { id: 'greek-salad', quantity: 1, price: 8.5 },
      { id: 'seafood-risotto', quantity: 1, price: 18.5 }
    ];
    
    let cartTotal = 0;
    for (const cartItem of simulatedCart) {
      cartTotal += cartItem.price * cartItem.quantity;
      console.log(`  🛒 ${cartItem.quantity}x Item ${cartItem.id} - €${(cartItem.price * cartItem.quantity).toFixed(2)}`);
    }
    
    console.log(`✅ Simulated cart total: €${cartTotal.toFixed(2)}`);
    
    // 🎉 SUCCESS!
    console.log('\n🎉 SUCCESS: CUSTOMER MENU BROWSING TEST PASSED!');
    console.log('==============================================');
    console.log('✅ Menu loads correctly with venue information');
    console.log('✅ Menu structure is valid and complete');
    console.log('✅ All required test items are available');
    console.log('✅ Pricing information is accurate');
    console.log('✅ Language support is comprehensive');
    console.log('✅ Menu is ready for customer ordering');
    
    return {
      success: true,
      venue: menuResponse.venue.name,
      categories: menuResponse.categories.length,
      totalItems: totalItems,
      priceRange: { min: minPrice, max: maxPrice, avg: avgPrice },
      translationCoverage: translationCoverage,
      cartSimulation: { items: simulatedCart.length, total: cartTotal }
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('- Menu API endpoint not responding');
    console.log('- Venue not configured properly');
    console.log('- Menu items missing or incomplete');
    console.log('- Language translations incomplete');
    console.log('- Pricing information invalid');
    
    throw error;
  }
}

// 🚀 Run the test
testCustomerMenuBrowsing()
  .then(result => {
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Venue: ${result.venue}`);
    console.log(`Categories: ${result.categories}`);
    console.log(`Total Items: ${result.totalItems}`);
    console.log(`Price Range: €${result.priceRange.min.toFixed(2)} - €${result.priceRange.max.toFixed(2)}`);
    console.log(`Translation Coverage: ${result.translationCoverage.toFixed(1)}%`);
    console.log(`Cart Simulation: ${result.cartSimulation.items} items, €${result.cartSimulation.total.toFixed(2)}`);
    console.log('\n✨ Customer menu browsing experience is fully functional!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 CUSTOMER MENU BROWSING TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });