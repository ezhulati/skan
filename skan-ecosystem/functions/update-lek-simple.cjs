// Simple Node.js script to update Firebase database with Albanian Lek pricing
const admin = require('firebase-admin');

// Use the same Firebase project configuration as the deployed functions
const projectConfig = {
  projectId: 'qr-restaurant-api'
};

try {
  admin.initializeApp(projectConfig);
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.log('ℹ️ Firebase already initialized or using environment credentials');
}

const db = admin.firestore();

async function updateBeachBarPricing() {
  console.log('🇦🇱 UPDATING Beach Bar Durrës to Albanian Lek');
  console.log('===========================================');
  
  try {
    const venueId = 'beach-bar-durres';
    
    // First, let's check what data exists
    console.log('\n🔍 Checking current venue data...');
    const venueRef = db.collection('venues').doc(venueId);
    const venueDoc = await venueRef.get();
    
    if (!venueDoc.exists) {
      console.log('❌ Venue not found. Checking "venue" collection instead...');
      const altVenueRef = db.collection('venue').doc(venueId);
      const altVenueDoc = await altVenueRef.get();
      
      if (altVenueDoc.exists) {
        console.log('✅ Found venue in "venue" collection');
        return updateVenueCollection(altVenueRef);
      } else {
        console.log('❌ Venue not found in either collection');
        return;
      }
    } else {
      console.log('✅ Found venue in "venues" collection');
      return updateVenuesCollection(venueRef);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function updateVenueCollection(venueRef) {
  console.log('\n📝 Updating venue in "venue" collection...');
  
  // Albanian Lek pricing data
  const lekPricing = [
    { id: 'greek-salad', price: 900, nameAlbanian: 'Sallatë Greke' },
    { id: 'fried-calamari', price: 1200, nameAlbanian: 'Kallamar i Skuqur' },
    { id: 'seafood-risotto', price: 1800, nameAlbanian: 'Rizoto me Fruta Deti' },
    { id: 'grilled-lamb', price: 2200, nameAlbanian: 'Copë Qengji në Skarë' },
    { id: 'grilled-branzino', price: 2500, nameAlbanian: 'Levrek në Skarë' },
    { id: 'albanian-beer', price: 350, nameAlbanian: 'Birrë Shqiptare' },
    { id: 'raki', price: 400, nameAlbanian: 'Raki Shqiptare' },
    { id: 'mojito', price: 750, nameAlbanian: 'Mojito' },
    { id: 'tiramisu', price: 650, nameAlbanian: 'Tiramisu' },
    { id: 'baklava', price: 550, nameAlbanian: 'Bakllava' }
  ];
  
  // Update venue currency
  console.log('🏪 Updating venue currency to Albanian Lek...');
  await venueRef.update({
    'settings.currency': 'ALL'
  });
  console.log('✅ Venue currency updated');
  
  // Update menu items
  console.log('🍽️ Updating menu item prices...');
  let updateCount = 0;
  
  for (const item of lekPricing) {
    try {
      const menuItemRef = venueRef.collection('menuItem').doc(item.id);
      const doc = await menuItemRef.get();
      
      if (doc.exists) {
        const currentData = doc.data();
        const oldPrice = currentData.price;
        
        await menuItemRef.update({
          price: item.price,
          nameAlbanian: item.nameAlbanian
        });
        
        console.log(`  ✅ ${item.id}: €${oldPrice} → ${item.price} Lek`);
        updateCount++;
      } else {
        console.log(`  ⚠️  ${item.id}: Not found`);
      }
    } catch (error) {
      console.log(`  ❌ ${item.id}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Successfully updated ${updateCount} menu items!`);
  console.log('\n📱 Customer app should now show Albanian Lek pricing');
  console.log('🔗 Test at: https://order.skan.al/beach-bar-durres/a1/menu');
  
  return updateCount;
}

async function updateVenuesCollection(venueRef) {
  console.log('\n📝 Updating venue in "venues" collection...');
  // Similar logic for venues collection if needed
  return updateVenueCollection(venueRef);
}

// Run the update
updateBeachBarPricing()
  .then((result) => {
    console.log('\n✅ Update process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });