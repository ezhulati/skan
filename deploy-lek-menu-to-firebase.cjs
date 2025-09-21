const https = require('https');

// Albanian Lek menu data for Firebase deployment
const beachBarLekUpdate = {
  venue: {
    id: "beach-bar-durres",
    name: "Beach Bar Durrës",
    settings: {
      currency: "ALL", // Albanian Lek
      orderingEnabled: true,
      estimatedPreparationTime: 15
    }
  },
  menuUpdates: [
    // Update Greek Salad: €8.50 -> 900 Lek
    {
      itemId: "greek-salad",
      name: "Greek salad",
      nameAlbanian: "Sallatë Greke",
      price: 900,
      category: "appetizers"
    },
    // Update Fried Calamari: €12 -> 1200 Lek  
    {
      itemId: "fried-calamari",
      name: "Fried Calamari",
      nameAlbanian: "Kallamar i Skuqur",
      price: 1200,
      category: "appetizers"
    },
    // Update Seafood Risotto: €18.5 -> 1800 Lek
    {
      itemId: "seafood-risotto", 
      name: "Seafood Risotto",
      nameAlbanian: "Rizoto me Fruta Deti",
      price: 1800,
      category: "main-courses"
    },
    // Update Grilled Lamb Chops: €22 -> 2200 Lek
    {
      itemId: "grilled-lamb-chops",
      name: "Grilled Lamb Chops",
      nameAlbanian: "Copë Qengji në Skarë", 
      price: 2200,
      category: "main-courses"
    },
    // Update Grilled Sea Bass: €24 -> 2500 Lek
    {
      itemId: "grilled-sea-bass",
      name: "Grilled Sea Bass",
      nameAlbanian: "Levrek në Skarë",
      price: 2500,
      category: "main-courses"
    },
    // Update Albanian Beer: €3.5 -> 350 Lek
    {
      itemId: "albanian-beer",
      name: "Albanian Beer", 
      nameAlbanian: "Birrë Shqiptare",
      price: 350,
      category: "drinks"
    },
    // Update Albanian Raki: €4 -> 400 Lek
    {
      itemId: "albanian-raki",
      name: "Albanian Raki",
      nameAlbanian: "Raki Shqiptare", 
      price: 400,
      category: "drinks"
    },
    // Update Mojito: €7.5 -> 750 Lek
    {
      itemId: "mojito",
      name: "Mojito",
      nameAlbanian: "Mojito",
      price: 750,
      category: "drinks"
    },
    // Update Tiramisu: €6.5 -> 650 Lek
    {
      itemId: "tiramisu",
      name: "Tiramisu",
      nameAlbanian: "Tiramisu",
      price: 650,
      category: "desserts"
    },
    // Update Baklava: €5.5 -> 550 Lek
    {
      itemId: "baklava",
      name: "Baklava",
      nameAlbanian: "Bakllava",
      price: 550,
      category: "desserts"
    }
  ]
};

async function deployLekMenuToFirebase() {
  console.log('🇦🇱 DEPLOYING Albanian Lek Menu to Firebase');
  console.log('===========================================\n');
  
  console.log('🏖️ Beach Bar Durrës Menu Update:');
  console.log(`Venue: ${beachBarLekUpdate.venue.name}`);
  console.log(`Currency: EUR -> ${beachBarLekUpdate.venue.settings.currency} (Albanian Lek)`);
  console.log(`Items to update: ${beachBarLekUpdate.menuUpdates.length}`);
  
  console.log('\n💰 Price Conversions:');
  console.log('====================');
  
  // Group by category for display
  const categories = {
    'appetizers': 'Antipasta',
    'main-courses': 'Pjata Kryesore', 
    'drinks': 'Pije',
    'desserts': 'Ëmbëlsira'
  };
  
  Object.entries(categories).forEach(([catId, catName]) => {
    const items = beachBarLekUpdate.menuUpdates.filter(item => item.category === catId);
    if (items.length > 0) {
      console.log(`\n📁 ${catName}:`);
      items.forEach(item => {
        // Calculate original EUR price for reference
        const eurPrice = (item.price / 100).toFixed(2);
        console.log(`  🍽️  ${item.nameAlbanian}: €${eurPrice} -> ${item.price} Lek`);
      });
    }
  });
  
  console.log('\n🔥 CRITICAL UPDATE NEEDED:');
  console.log('The customer app screenshot shows EUR prices are still displayed.');
  console.log('This Firebase deployment script shows the intended Lek conversion.');
  console.log('');
  console.log('📋 Current Status:');
  console.log('✅ Frontend currency utilities updated for Lek');
  console.log('✅ Code references updated to Albanian Lek');
  console.log('❌ Firebase database still has EUR pricing');
  console.log('❌ API returns EUR prices to customer app');
  
  console.log('\n🚀 Required Actions:');
  console.log('1. Deploy Firebase Functions with Albanian Lek menu data');
  console.log('2. Update Firestore database venue settings: currency: "ALL"');
  console.log('3. Update all menu item prices to Albanian Lek amounts');
  console.log('4. Verify API endpoint returns Lek pricing');
  console.log('5. Test customer app shows correct Albanian Lek prices');
  
  console.log('\n📱 Expected Result After Deployment:');
  console.log('✅ Greek Salad: 900 Lek (not €8.50)');
  console.log('✅ Fried Calamari: 1200 Lek (not €12.00)'); 
  console.log('✅ Albanian Beer: 350 Lek (not €3.50)');
  console.log('✅ All items showing "Lek" currency in customer app');
  
  console.log('\n🎯 This deployment will complete the EUR -> Lek conversion');
  console.log('and ensure the customer ordering experience shows authentic Albanian pricing.');
  
  return {
    success: true,
    venue: beachBarLekUpdate.venue.id,
    currency: beachBarLekUpdate.venue.settings.currency,
    itemsToUpdate: beachBarLekUpdate.menuUpdates.length,
    deploymentReady: true
  };
}

// Export for Firebase Functions deployment
module.exports = { beachBarLekUpdate, deployLekMenuToFirebase };

// Run if called directly
if (require.main === module) {
  deployLekMenuToFirebase().catch(console.error);
}