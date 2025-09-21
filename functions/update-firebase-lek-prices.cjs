const admin = require('firebase-admin');

// Initialize Firebase Admin with project ID
admin.initializeApp({
  projectId: 'qr-restaurant-api'
});

const db = admin.firestore();

// Albanian Lek pricing data for Beach Bar Durrës
const beachBarLekMenuUpdates = {
  // Venue settings update
  venue: {
    settings: {
      currency: "ALL", // Albanian Lek
      orderingEnabled: true,
      estimatedPreparationTime: 15
    }
  },
  
  // Menu item price updates
  menuItems: [
    // Appetizers
    {
      id: "greek-salad",
      name: "Greek salad",
      nameAlbanian: "Sallatë Greke",
      price: 900, // was €8.50 -> 900 Lek
      category: "appetizers"
    },
    {
      id: "fried-calamari",
      name: "Fried Calamari",
      nameAlbanian: "Kallamar i Skuqur",
      price: 1200, // was €12.00 -> 1200 Lek
      category: "appetizers"
    },
    
    // Main Courses
    {
      id: "seafood-risotto",
      name: "Seafood Risotto",
      nameAlbanian: "Rizoto me Fruta Deti",
      price: 1800, // was €18.50 -> 1800 Lek
      category: "main-courses"
    },
    {
      id: "grilled-lamb-chops",
      name: "Grilled Lamb Chops",
      nameAlbanian: "Copë Qengji në Skarë",
      price: 2200, // was €22.00 -> 2200 Lek
      category: "main-courses"
    },
    {
      id: "grilled-sea-bass",
      name: "Grilled Sea Bass",
      nameAlbanian: "Levrek në Skarë",
      price: 2500, // was €24.00 -> 2500 Lek
      category: "main-courses"
    },
    
    // Drinks
    {
      id: "albanian-beer",
      name: "Albanian Beer",
      nameAlbanian: "Birrë Shqiptare",
      price: 350, // was €3.50 -> 350 Lek
      category: "drinks"
    },
    {
      id: "albanian-raki",
      name: "Albanian Raki",
      nameAlbanian: "Raki Shqiptare",
      price: 400, // was €4.00 -> 400 Lek
      category: "drinks"
    },
    {
      id: "mojito",
      name: "Mojito",
      nameAlbanian: "Mojito",
      price: 750, // was €7.50 -> 750 Lek
      category: "drinks"
    },
    
    // Desserts
    {
      id: "tiramisu",
      name: "Tiramisu",
      nameAlbanian: "Tiramisu",
      price: 650, // was €6.50 -> 650 Lek
      category: "desserts"
    },
    {
      id: "baklava",
      name: "Baklava",
      nameAlbanian: "Bakllava",
      price: 550, // was €5.50 -> 550 Lek
      category: "desserts"
    }
  ]
};

async function updateBeachBarLekPricing() {
  console.log('🇦🇱 UPDATING Beach Bar Durrës - EUR to Albanian Lek Conversion');
  console.log('===============================================================');
  
  try {
    const venueId = 'beach-bar-durres';
    
    // Step 1: Update venue settings to Albanian Lek
    console.log('\n🏪 Step 1: Updating venue currency settings...');
    const venueRef = db.collection('venues').doc(venueId);
    
    await venueRef.update({
      'settings.currency': 'ALL'
    });
    
    console.log('✅ Venue currency updated to Albanian Lek (ALL)');
    
    // Step 2: Update all menu item prices
    console.log('\n🍽️  Step 2: Updating menu item prices...');
    console.log(`Items to update: ${beachBarLekMenuUpdates.menuItems.length}`);
    
    const batch = db.batch();
    let updateCount = 0;
    
    for (const item of beachBarLekMenuUpdates.menuItems) {
      // Query for the menu item by looking in subcollections
      const menuItemRef = venueRef.collection('menuItem').doc(item.id);
      
      // Check if document exists first
      const doc = await menuItemRef.get();
      if (doc.exists) {
        const currentData = doc.data();
        const oldPrice = currentData.price;
        
        // Update price and ensure Albanian name is set
        batch.update(menuItemRef, {
          price: item.price,
          nameAlbanian: item.nameAlbanian
        });
        
        console.log(`  📝 ${item.name}: €${(oldPrice/100).toFixed(2)} → ${item.price} Lek`);
        updateCount++;
      } else {
        console.log(`  ⚠️  Item not found: ${item.id}`);
      }
    }
    
    // Commit all updates
    await batch.commit();
    
    console.log('\n✅ Batch update completed successfully!');
    console.log(`📊 Updated ${updateCount} menu items`);
    
    // Step 3: Verify the updates
    console.log('\n🔍 Step 3: Verifying updates...');
    
    const updatedVenue = await venueRef.get();
    const venueData = updatedVenue.data();
    
    console.log(`✅ Venue currency: ${venueData.settings.currency}`);
    
    // Check a few sample items
    const sampleItems = ['albanian-beer', 'greek-salad', 'seafood-risotto'];
    
    for (const itemId of sampleItems) {
      const itemRef = venueRef.collection('menuItem').doc(itemId);
      const itemDoc = await itemRef.get();
      
      if (itemDoc.exists) {
        const itemData = itemDoc.data();
        console.log(`✅ ${itemData.name}: ${itemData.price} Lek`);
      }
    }
    
    console.log('\n🎉 SUCCESS: Beach Bar Durrës pricing updated to Albanian Lek!');
    console.log('');
    console.log('📱 The customer app should now display:');
    console.log('   • Greek Salad: 900 Lek');
    console.log('   • Albanian Beer: 350 Lek');
    console.log('   • Seafood Risotto: 1800 Lek');
    console.log('   • All prices in "Lek" currency format');
    
    return {
      success: true,
      venueUpdated: true,
      itemsUpdated: updateCount,
      currency: 'ALL'
    };
    
  } catch (error) {
    console.error('❌ Error updating Beach Bar pricing:', error);
    throw error;
  }
}

// Run the update
updateBeachBarLekPricing()
  .then((result) => {
    console.log('\n🏁 Update completed:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });