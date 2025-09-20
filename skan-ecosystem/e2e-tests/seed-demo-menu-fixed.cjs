const axios = require('axios');

async function seedDemoMenuFixed() {
  console.log('🍽️ Seeding demo venue with correct field names...\n');
  
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
    
    // Get source menu data
    console.log('\n2️⃣ Fetching source menu from beach-bar-durres...');
    const sourceMenu = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    console.log('✅ Source menu loaded with', sourceMenu.data.categories.length, 'categories');
    
    // Get existing categories (they were already created)
    console.log('\n3️⃣ Getting existing demo categories...');
    const demoMenuCheck = await axios.get(`${API_BASE}/v1/venue/demo-bistro/menu`);
    
    if (demoMenuCheck.data.categories.length === 0) {
      console.log('No categories found, creating them first...');
      
      // Create categories first
      for (const category of sourceMenu.data.categories) {
        console.log(`📂 Creating category: ${category.name}`);
        
        try {
          await axios.post(`${API_BASE}/v1/venue/${demoVenueId}/categories`, {
            name: category.name,
            nameAlbanian: category.nameAlbanian || category.name,
            sortOrder: category.sortOrder || 1
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`✅ Category created: ${category.name}`);
        } catch (error) {
          console.log(`❌ Failed to create category ${category.name}:`, error.response?.data?.error);
        }
      }
      
      // Refresh menu data
      const refreshedMenu = await axios.get(`${API_BASE}/v1/venue/demo-bistro/menu`);
      demoMenuCheck.data = refreshedMenu.data;
    }
    
    console.log(`📋 Found ${demoMenuCheck.data.categories.length} categories in demo venue`);
    
    // Create items for each category with correct field names
    console.log('\n4️⃣ Adding menu items...');
    
    for (let i = 0; i < sourceMenu.data.categories.length; i++) {
      const sourceCategory = sourceMenu.data.categories[i];
      const demoCategory = demoMenuCheck.data.categories[i];
      
      if (!demoCategory) {
        console.log(`⚠️ Demo category not found for: ${sourceCategory.name}`);
        continue;
      }
      
      console.log(`\n📂 Adding items to category: ${demoCategory.name}`);
      
      for (const item of sourceCategory.items) {
        console.log(`  ➕ Adding item: ${item.name} (€${item.price})`);
        
        try {
          await axios.post(`${API_BASE}/v1/venue/${demoVenueId}/categories/${demoCategory.id}/items`, {
            name: item.nameAlbanian || item.name,  // Albanian name in 'name' field
            nameEn: item.name,                     // English name in 'nameEn' field  
            price: item.price,
            isActive: true,
            description: item.description || 'Delicious menu item',
            descriptionAlbanian: item.descriptionAlbanian || item.description || 'Gjellë e shijshme',
            allergens: item.allergens || [],
            preparationTime: item.preparationTime || 15,
            imageUrl: item.imageUrl || null
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log(`    ✅ ${item.name} added successfully`);
        } catch (itemError) {
          console.log(`    ❌ Failed to add ${item.name}:`, itemError.response?.data?.error || itemError.message);
        }
      }
    }
    
    // Final verification
    console.log('\n5️⃣ Final verification...');
    const finalMenu = await axios.get(`${API_BASE}/v1/venue/demo-bistro/menu`);
    
    console.log('\n🎉 Demo menu setup complete!');
    console.log(`📋 Categories: ${finalMenu.data.categories.length}`);
    
    let totalItems = 0;
    finalMenu.data.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.items.length} items`);
      totalItems += cat.items.length;
    });
    
    console.log(`🍽️ Total menu items: ${totalItems}`);
    
    if (totalItems > 0) {
      console.log('\n🎯 Demo is ready and working!');
      console.log('📱 Customer URL: https://order.skan.al/demo-bistro/table-1/menu');
      console.log('🖥️ Admin URL: https://admin.skan.al');
      console.log('🔑 Login: demo.owner@skan.al / Demo2024!');
    } else {
      console.log('\n⚠️ No items were added. Check the API logs for details.');
    }
    
  } catch (error) {
    console.error('❌ Error seeding menu:', error.response?.data?.error || error.message);
  }
}

seedDemoMenuFixed();