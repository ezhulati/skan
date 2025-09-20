const https = require('https');

// Realistic Albanian Lek prices for Beach Bar Durrës
const priceUpdates = {
  // Appetizers
  "greek-salad": 900,        // €8.5 -> 900 Lek (reasonable for large Greek salad)
  "fried-calamari": 1200,    // €12 -> 1200 Lek (seafood appetizer)
  
  // Main Courses  
  "seafood-risotto": 1800,   // €18.5 -> 1800 Lek (premium seafood dish)
  "grilled-lamb-chops": 2200, // €22 -> 2200 Lek (premium meat dish)
  "grilled-sea-bass": 2500,  // €24 -> 2500 Lek (premium fresh fish)
  
  // Drinks
  "albanian-beer": 350,      // €3.5 -> 350 Lek (local beer)
  "albanian-raki": 400,      // €4 -> 400 Lek (traditional Albanian spirit)
  "mojito": 750,             // €7.5 -> 750 Lek (cocktail)
  
  // Desserts
  "tiramisu": 650,           // €6.5 -> 650 Lek (imported style dessert)
  "baklava": 550             // €5.5 -> 550 Lek (traditional Balkan dessert)
};

// Map all item names to IDs (since API returns name, not id)
const nameToIdMap = {
  "Greek salad": "greek-salad",
  "Fried Calamari": "fried-calamari", 
  "Seafood Risotto": "seafood-risotto",
  "Grilled Lamb Chops": "grilled-lamb-chops",
  "Grilled Sea Bass": "grilled-sea-bass",
  "Albanian Beer": "albanian-beer",
  "Albanian Raki": "albanian-raki",
  "Mojito": "mojito",
  "Tiramisu": "tiramisu",
  "Baklava": "baklava"
};

async function updateBeachBarPrices() {
  console.log('🇦🇱 Updating Beach Bar Durrës prices to Albanian Lek');
  console.log('=================================================\n');
  
  try {
    // First, get the current menu to see what needs updating
    const menuResponse = await fetch('https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/menu');
    const menuData = await menuResponse.json();
    
    console.log('📋 Current Menu Status:');
    console.log(`Currency: ${menuData.venue.settings.currency}`);
    console.log('Current Prices:');
    
    menuData.categories.forEach(category => {
      category.items.forEach(item => {
        const itemId = nameToIdMap[item.name] || item.id;
        const newPrice = priceUpdates[itemId];
        const currentPrice = item.price;
        const currency = menuData.venue.settings.currency;
        
        console.log(`  ${item.name}: ${currentPrice} ${currency} -> ${newPrice} Lek`);
      });
    });
    
    console.log('\n💰 Price Conversion Summary:');
    console.log('Appetizers: 900-1200 Lek (reasonable for quality appetizers)');
    console.log('Main Courses: 1800-2500 Lek (premium beachfront restaurant pricing)');
    console.log('Drinks: 350-750 Lek (local to cocktail range)');
    console.log('Desserts: 550-650 Lek (traditional to international)');
    
    console.log('\n🏦 Currency Change: EUR -> ALL (Albanian Lek)');
    console.log('These prices reflect realistic Albanian beachfront restaurant costs');
    console.log('Suitable for tourists and locals in Durrës beach area');
    
    console.log('\n✅ Price Update Summary Complete');
    console.log('Note: This script shows the intended price changes.');
    console.log('Database updates require backend deployment with new menu data.');
    
    return {
      success: true,
      currency: 'ALL',
      priceUpdates,
      itemCount: Object.keys(priceUpdates).length
    };
    
  } catch (error) {
    console.error('❌ Error updating prices:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the price update
updateBeachBarPrices().catch(console.error);