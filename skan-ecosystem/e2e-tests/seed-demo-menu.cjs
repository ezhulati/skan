const axios = require('axios');

async function seedDemoMenu() {
  console.log('🍽️ Seeding demo venue with menu data...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // First, get the existing menu from beach-bar-durres
    console.log('1️⃣ Fetching existing menu from beach-bar-durres...');
    const existingMenu = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    
    console.log('✅ Found menu with', existingMenu.data.categories.length, 'categories');
    existingMenu.data.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.items.length} items`);
    });
    
    // Login to demo account to get admin token
    console.log('\n2️⃣ Logging into demo account...');
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo.owner@skan.al',
      password: 'Demo2024!'
    });
    
    const token = loginResponse.data.token;
    const demoVenueId = loginResponse.data.user.venueId;
    console.log('✅ Logged in, venue ID:', demoVenueId);
    
    // Create menu categories and items for demo venue
    console.log('\n3️⃣ Creating menu categories and items...');
    
    for (const category of existingMenu.data.categories) {
      console.log(`\n📂 Creating category: ${category.name}`);
      
      // Create category
      try {
        const categoryResponse = await axios.post(`${API_BASE}/v1/venues/${demoVenueId}/menu/categories`, {
          name: category.name,
          nameAlbanian: category.nameAlbanian || category.name,
          sortOrder: category.sortOrder || 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const categoryId = categoryResponse.data.categoryId;
        console.log(`✅ Category created: ${categoryId}`);
        
        // Create items for this category
        for (const item of category.items) {
          console.log(`  ➕ Adding item: ${item.name} (€${item.price})`);
          
          try {
            await axios.post(`${API_BASE}/v1/venues/${demoVenueId}/menu/categories/${categoryId}/items`, {
              name: item.name,
              nameAlbanian: item.nameAlbanian || item.name,
              description: item.description || 'Delicious menu item',
              descriptionAlbanian: item.descriptionAlbanian || item.description || 'Gjellë e shijshme',
              price: item.price,
              allergens: item.allergens || [],
              preparationTime: item.preparationTime || 15,
              sortOrder: item.sortOrder || 1
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log(`    ✅ ${item.name} added`);
          } catch (itemError) {
            console.log(`    ❌ Failed to add ${item.name}:`, itemError.response?.data?.error || itemError.message);
          }
        }
        
      } catch (categoryError) {
        console.log(`❌ Failed to create category ${category.name}:`, categoryError.response?.data?.error || categoryError.message);
      }
    }
    
    // Verify the menu was created
    console.log('\n4️⃣ Verifying demo menu...');
    const demoMenu = await axios.get(`${API_BASE}/v1/venue/demo-bistro/menu`);
    
    console.log('✅ Demo menu created successfully!');
    console.log(`📋 Categories: ${demoMenu.data.categories.length}`);
    
    let totalItems = 0;
    demoMenu.data.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.items.length} items`);
      totalItems += cat.items.length;
    });
    
    console.log(`🍽️ Total menu items: ${totalItems}`);
    console.log('\n🎉 Demo venue is ready!');
    console.log('📱 Customer URL: https://order.skan.al/demo-bistro/table-1/menu');
    console.log('🖥️ Admin URL: https://admin.skan.al (login with demo.owner@skan.al)');
    
  } catch (error) {
    console.error('❌ Error seeding menu:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed. The demo user might need to be created again.');
    }
  }
}

seedDemoMenu();