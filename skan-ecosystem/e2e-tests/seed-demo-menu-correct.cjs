const axios = require('axios');

async function seedDemoMenuCorrect() {
  console.log('🍽️ Seeding demo venue with correct API endpoints...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Login to demo account
    console.log('1️⃣ Logging into demo account...');
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo.owner@skan.al',
      password: 'Demo2024!'
    });
    
    const token = loginResponse.data.token;
    const demoVenueId = loginResponse.data.user.venueId;
    console.log('✅ Logged in, venue ID:', demoVenueId);
    
    // Get source menu data to copy
    console.log('\n2️⃣ Fetching source menu from beach-bar-durres...');
    const sourceMenu = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    console.log('✅ Source menu loaded with', sourceMenu.data.categories.length, 'categories');
    
    // Create categories and items using correct endpoints
    console.log('\n3️⃣ Creating menu categories and items...');
    
    for (const category of sourceMenu.data.categories) {
      console.log(`\n📂 Creating category: ${category.name}`);
      
      try {
        // Create category - use correct endpoint
        const categoryResponse = await axios.post(`${API_BASE}/v1/venue/${demoVenueId}/categories`, {
          name: category.name,
          nameAlbanian: category.nameAlbanian || category.name,
          sortOrder: category.sortOrder || 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const newCategoryId = categoryResponse.data.categoryId || categoryResponse.data.id;
        console.log(`✅ Category created with ID: ${newCategoryId}`);
        
        // Create items for this category - use correct endpoint  
        for (const item of category.items) {
          console.log(`  ➕ Adding item: ${item.name} (€${item.price})`);
          
          try {
            const itemResponse = await axios.post(`${API_BASE}/v1/venue/${demoVenueId}/categories/${newCategoryId}/items`, {
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
            
            console.log(`    ✅ ${item.name} added successfully`);
          } catch (itemError) {
            console.log(`    ❌ Failed to add ${item.name}:`, itemError.response?.data?.error || itemError.message);
          }
        }
        
      } catch (categoryError) {
        console.log(`❌ Failed to create category ${category.name}:`, categoryError.response?.data?.error || categoryError.message);
      }
    }
    
    // Verify the demo menu
    console.log('\n4️⃣ Verifying demo menu...');
    const demoMenu = await axios.get(`${API_BASE}/v1/venue/demo-bistro/menu`);
    
    console.log('\n🎉 Demo menu created successfully!');
    console.log(`📋 Categories: ${demoMenu.data.categories.length}`);
    
    let totalItems = 0;
    demoMenu.data.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.items.length} items`);
      totalItems += cat.items.length;
    });
    
    console.log(`🍽️ Total menu items: ${totalItems}`);
    
    console.log('\n🎯 Demo is ready!');
    console.log('📱 Customer URL: https://order.skan.al/demo-bistro/table-1/menu');
    console.log('🖥️ Admin URL: https://admin.skan.al');
    console.log('🔑 Login: demo.owner@skan.al / Demo2024!');
    
  } catch (error) {
    console.error('❌ Error seeding menu:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed. Login may have expired.');
    }
  }
}

seedDemoMenuCorrect();