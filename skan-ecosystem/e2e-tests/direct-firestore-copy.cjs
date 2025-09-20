const axios = require('axios');

async function directFirestoreCopy() {
  console.log('🔧 Direct Firestore copy approach...\n');
  
  // Since we can't use menu management APIs, let's copy the existing 
  // data structure from beach-bar-durres to our demo venue
  
  // The existing venue has this structure in Firestore:
  // venues/beach-bar-durres/
  //   ├── menuCategory/ (subcollection)
  //   └── menuItem/ (subcollection)
  
  // We need to add the same subcollections to:
  // venues/demo-bistro/
  
  console.log('📋 Menu data that needs to be copied:');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Get the source menu structure
    const sourceMenu = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    
    console.log('Source venue menu structure:');
    sourceMenu.data.categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.nameAlbanian})`);
      cat.items.forEach((item, itemIndex) => {
        console.log(`   ${itemIndex + 1}. ${item.name} - €${item.price}`);
      });
    });
    
    // Since we can't use APIs, let's use the Firebase Admin approach
    // First, let's check if we can access the Firebase project
    
    console.log('\n🔑 Demo venue credentials:');
    console.log('Email: demo.owner@skan.al');
    console.log('Password: Demo2024!');
    console.log('Venue Slug: demo-bistro');
    
    // Login to get venue details
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo.owner@skan.al',
      password: 'Demo2024!'
    });
    
    console.log('\n📍 Demo venue details:');
    console.log('Venue ID:', loginResponse.data.user.venueId);
    console.log('Venue Name:', loginResponse.data.venue.name);
    
    const demoVenueId = loginResponse.data.user.venueId;
    
    console.log('\n📝 Manual Firestore setup instructions:');
    console.log('==========================================');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/qr-restaurant-api');
    console.log('2. Navigate to Firestore Database');
    console.log(`3. Find document: venues/${demoVenueId}`);
    console.log('4. Add these subcollections:');
    console.log('');
    
    console.log('📁 menuCategory subcollection:');
    sourceMenu.data.categories.forEach((cat, index) => {
      console.log(`Document ID: ${cat.id || 'category-' + (index + 1)}`);
      console.log(`  name: "${cat.name}"`);
      console.log(`  nameAlbanian: "${cat.nameAlbanian || cat.name}"`);
      console.log(`  sortOrder: ${cat.sortOrder || (index + 1)}`);
      console.log('');
    });
    
    console.log('📁 menuItem subcollection:');
    sourceMenu.data.categories.forEach(cat => {
      cat.items.forEach((item, itemIndex) => {
        console.log(`Document ID: ${item.id || item.name.toLowerCase().replace(/\s+/g, '-')}`);
        console.log(`  name: "${item.name}"`);
        console.log(`  nameAlbanian: "${item.nameAlbanian || item.name}"`);
        console.log(`  description: "${item.description || ''}"`);
        console.log(`  descriptionAlbanian: "${item.descriptionAlbanian || item.description || ''}"`);
        console.log(`  price: ${item.price}`);
        console.log(`  categoryId: "${cat.id || 'category-' + (sourceMenu.data.categories.indexOf(cat) + 1)}"`);
        console.log(`  allergens: [${item.allergens ? item.allergens.map(a => `"${a}"`).join(', ') : ''}]`);
        console.log(`  preparationTime: ${item.preparationTime || 15}`);
        console.log(`  sortOrder: ${item.sortOrder || (itemIndex + 1)}`);
        console.log('');
      });
    });
    
    console.log('5. After adding all menu data, test the demo:');
    console.log('   https://order.skan.al/demo-bistro/table-1/menu');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
  }
}

directFirestoreCopy();