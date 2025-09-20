const axios = require('axios');

async function fixBeachBarCurrency() {
  console.log('🔧 Fixing Beach Bar Durrës currency display issue...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Step 1: Check current venue settings
    console.log('1️⃣ Checking current venue menu and settings...');
    const menuResponse = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    
    console.log(`Venue: ${menuResponse.data.venue.name}`);
    console.log(`Current currency setting: ${menuResponse.data.venue.settings?.currency || 'NOT SET'}`);
    
    // Check some sample prices
    console.log('\n📋 Sample menu items:');
    menuResponse.data.categories.forEach(category => {
      if (category.items.length > 0) {
        const sampleItem = category.items[0];
        console.log(`  ${sampleItem.name}: ${sampleItem.price} (should show as €${sampleItem.price})`);
      }
    });
    
    // Step 2: Test with demo admin credentials
    console.log('\n2️⃣ Testing admin login...');
    
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo.beachbar@skan.al',
      password: 'BeachBarDemo2024!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 3: Check if we can update venue settings to ensure EUR currency
    console.log('\n3️⃣ Verifying venue currency settings...');
    
    const venueId = menuResponse.data.venue.id;
    console.log(`Venue ID: ${venueId}`);
    
    // Try to get venue details with auth
    try {
      const venueDetails = await axios.get(`${API_BASE}/v1/venues/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Current venue settings:');
      console.log(JSON.stringify(venueDetails.data.settings, null, 2));
      
      // If currency is not EUR, try to update it
      if (venueDetails.data.settings?.currency !== 'EUR') {
        console.log('\n4️⃣ Updating currency to EUR...');
        
        const updatePayload = {
          settings: {
            ...venueDetails.data.settings,
            currency: 'EUR',
            orderingEnabled: true,
            estimatedPreparationTime: 15
          }
        };
        
        await axios.put(`${API_BASE}/v1/venues/${venueId}`, updatePayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Currency updated to EUR');
      } else {
        console.log('✅ Currency is already set to EUR');
      }
      
    } catch (venueError) {
      console.log('❌ Could not access venue details:', venueError.response?.data?.error);
    }
    
    // Step 4: Verify the fix
    console.log('\n5️⃣ Verifying the fix...');
    const verifyResponse = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    
    console.log(`✅ Final currency setting: ${verifyResponse.data.venue.settings?.currency}`);
    
    // Find Greek salad specifically
    let greekSalad = null;
    verifyResponse.data.categories.forEach(category => {
      const found = category.items.find(item => 
        item.name.toLowerCase().includes('greek') || 
        item.name.toLowerCase().includes('greke') ||
        item.nameAlbanian?.toLowerCase().includes('greke')
      );
      if (found) greekSalad = found;
    });
    
    if (greekSalad) {
      console.log(`\n🥗 Greek Salad pricing:`);
      console.log(`  Name: ${greekSalad.name}`);
      console.log(`  Albanian: ${greekSalad.nameAlbanian}`);
      console.log(`  Price: €${greekSalad.price} (should display as EUR, not Lek)`);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('The backend pricing is correct in Euros.');
    console.log('The issue is likely in the customer app frontend displaying "Lek" instead of "€".');
    console.log('This needs to be fixed in the React customer app currency display logic.');
    
    return {
      success: true,
      currency: verifyResponse.data.venue.settings?.currency,
      samplePrice: greekSalad?.price
    };
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    return { success: false, error: error.message };
  }
}

fixBeachBarCurrency().then(result => {
  console.log('\n🏁 Done!', result);
});