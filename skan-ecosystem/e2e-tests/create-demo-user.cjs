const axios = require('axios');

// Script to create demo user and venue for production demos
async function createDemoEnvironment() {
  console.log('🚀 Setting up demo environment...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Step 1: Create demo venue and owner
    console.log('1️⃣ Creating demo venue and owner...');
    const venueResponse = await axios.post(`${API_BASE}/v1/register/venue`, {
      venueName: 'Demo Restaurant & Bar',
      address: 'Rruga Demo, 1001 Tirana, Albania',
      phone: '+355 69 123 4567',
      description: 'Experience our QR ordering system with this interactive demo restaurant',
      currency: 'EUR',
      ownerName: 'Demo Manager',
      ownerEmail: 'demo@skan.al',
      password: 'DemoPassword123!',
      tableCount: 8
    });
    
    console.log(`   ✅ Demo venue created: ${venueResponse.data.venue.name}`);
    console.log(`   ✅ Venue slug: ${venueResponse.data.venue.slug}`);
    console.log(`   ✅ Demo user: ${venueResponse.data.user.email}`);
    
    const venueId = venueResponse.data.venueId;
    const userToken = venueResponse.data.credentials?.token || 'temp-token';
    
    // Step 2: Login to get proper token
    console.log('\n2️⃣ Logging in as demo user...');
    const loginResponse = await axios.post(`${API_BASE}/v1/auth/login`, {
      email: 'demo@skan.al',
      password: 'DemoPassword123!'
    });
    
    const token = loginResponse.data.token;
    console.log('   ✅ Demo user login successful');
    
    // Step 3: Enhance the menu with demo items
    console.log('\n3️⃣ Adding demo menu items...');
    
    const demoMenuItems = [
      // Appetizers
      {
        name: 'Olive Tapenade',
        nameAlbanian: 'Tapenada me Ullira',
        description: 'Traditional Albanian olive spread with fresh herbs and garlic',
        descriptionAlbanian: 'Krem traditional me ullira të zeza dhe erëza të freskëta',
        price: 6.50,
        categoryName: 'Appetizers',
        preparationTime: 5,
        allergens: ['olives']
      },
      {
        name: 'Grilled Halloumi',
        nameAlbanian: 'Djathë Hallumi në Skarë',
        description: 'Cyprus cheese grilled to perfection with honey and herbs',
        descriptionAlbanian: 'Djathë nga Qipro në skarë me mjaltë dhe erëza',
        price: 8.90,
        categoryName: 'Appetizers',
        preparationTime: 8,
        allergens: ['dairy']
      },
      
      // Main Courses
      {
        name: 'Tavë Kosi',
        nameAlbanian: 'Tavë Kosi',
        description: 'Traditional Albanian baked lamb with yogurt and rice',
        descriptionAlbanian: 'Mish qengji i pjekur me kos dhe oriz sipas recetës tradicionale',
        price: 16.50,
        categoryName: 'Main Courses',
        preparationTime: 25,
        allergens: ['dairy', 'gluten']
      },
      {
        name: 'Grilled Sea Bass',
        nameAlbanian: 'Levrek në Skarë',
        description: 'Fresh sea bass grilled with Mediterranean herbs and lemon',
        descriptionAlbanian: 'Levrek i freskët në skarë me erëza mesdhetare dhe limon',
        price: 22.00,
        categoryName: 'Main Courses',
        preparationTime: 20,
        allergens: ['fish']
      },
      {
        name: 'Vegetarian Moussaka',
        nameAlbanian: 'Musakë Vegjitariane',
        description: 'Layers of eggplant, zucchini and béchamel sauce',
        descriptionAlbanian: 'Shtresa patëlxhani, kungullesh dhe salcë bechamel',
        price: 14.50,
        categoryName: 'Main Courses',
        preparationTime: 30,
        allergens: ['dairy', 'gluten', 'eggs']
      },
      
      // Beverages
      {
        name: 'Albanian Mountain Tea',
        nameAlbanian: 'Çaj Mali',
        description: 'Traditional herbal tea from Albanian mountains',
        descriptionAlbanian: 'Çaj tradicional me bimë nga malet shqiptare',
        price: 3.50,
        categoryName: 'Beverages',
        preparationTime: 3,
        allergens: []
      },
      {
        name: 'Craft Beer Selection',
        nameAlbanian: 'Birra Artizanale',
        description: 'Local craft beer rotating selection',
        descriptionAlbanian: 'Birra artizanale lokale, përzgjedhje e ndryshme',
        price: 4.50,
        categoryName: 'Beverages',
        preparationTime: 2,
        allergens: ['gluten']
      },
      
      // Desserts
      {
        name: 'Baklava',
        nameAlbanian: 'Bakllava',
        description: 'Traditional pastry with nuts and honey syrup',
        descriptionAlbanian: 'Ëmbëlsirë tradicionale me arra dhe mjaltë',
        price: 5.90,
        categoryName: 'Desserts',
        preparationTime: 5,
        allergens: ['nuts', 'gluten', 'dairy']
      }
    ];
    
    // Note: We would need API endpoints to add menu items
    // For now, we'll document what should be added manually
    console.log('   📝 Demo menu items to add manually:');
    demoMenuItems.forEach(item => {
      console.log(`      - ${item.name} (${item.nameAlbanian}) - €${item.price}`);
    });
    
    // Step 4: Create sample orders for demo
    console.log('\n4️⃣ Creating sample demo orders...');
    
    const sampleOrders = [
      {
        tableNumber: 'T01',
        customerName: 'Maria K.',
        items: [
          { id: 'olive-tapenade', name: 'Olive Tapenade', price: 6.50, quantity: 1 },
          { id: 'tavë-kosi', name: 'Tavë Kosi', price: 16.50, quantity: 1 },
          { id: 'craft-beer', name: 'Craft Beer Selection', price: 4.50, quantity: 2 }
        ],
        specialInstructions: 'No garlic please',
        status: 'preparing'
      },
      {
        tableNumber: 'T03',
        customerName: 'Gentian M.',
        items: [
          { id: 'grilled-sea-bass', name: 'Grilled Sea Bass', price: 22.00, quantity: 1 },
          { id: 'mountain-tea', name: 'Albanian Mountain Tea', price: 3.50, quantity: 1 }
        ],
        specialInstructions: 'Extra lemon on the side',
        status: 'ready'
      },
      {
        tableNumber: 'T05',
        customerName: 'Elena P.',
        items: [
          { id: 'grilled-halloumi', name: 'Grilled Halloumi', price: 8.90, quantity: 1 },
          { id: 'vegetarian-moussaka', name: 'Vegetarian Moussaka', price: 14.50, quantity: 1 },
          { id: 'baklava', name: 'Baklava', price: 5.90, quantity: 1 }
        ],
        specialInstructions: '',
        status: 'served'
      }
    ];
    
    for (const order of sampleOrders) {
      try {
        const orderResponse = await axios.post(`${API_BASE}/v1/orders`, {
          venueId: venueId,
          tableNumber: order.tableNumber,
          customerName: order.customerName,
          items: order.items,
          specialInstructions: order.specialInstructions
        });
        
        const orderId = orderResponse.data.orderId;
        console.log(`   ✅ Created order ${orderResponse.data.orderNumber} for ${order.customerName}`);
        
        // Update status if not 'new'
        if (order.status !== 'new') {
          await axios.put(`${API_BASE}/v1/orders/${orderId}/status`, {
            status: order.status
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`      - Updated status to: ${order.status}`);
        }
        
        // Small delay between orders
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (orderError) {
        console.log(`   ⚠️  Could not create order for ${order.customerName}: ${orderError.response?.data?.error || orderError.message}`);
      }
    }
    
    // Step 5: Summary
    console.log('\n🎉 Demo environment setup completed!');
    console.log('\n📋 Demo Credentials:');
    console.log(`   Email: demo@skan.al`);
    console.log(`   Password: DemoPassword123!`);
    console.log(`   Venue: Demo Restaurant & Bar`);
    console.log(`   Admin Portal: admin.skan.al`);
    console.log(`   Customer App: order.skan.al/${venueResponse.data.venue.slug}`);
    
    console.log('\n📝 Marketing Site Integration:');
    console.log('   Add "Try Demo" button that logs in automatically with demo@skan.al');
    console.log('   QR codes link to: order.skan.al/demo-restaurant-bar/T01 (etc.)');
    
    console.log('\n🔄 Maintenance:');
    console.log('   - Run this script monthly to refresh demo data');
    console.log('   - Monitor demo orders and reset when needed');
    console.log('   - Keep menu items updated with latest features');
    
  } catch (error) {
    console.error('❌ Demo setup failed:', error.response?.data || error.message);
    
    if (error.response?.status === 409) {
      console.log('\n💡 Demo user may already exist. Try logging in:');
      console.log('   Email: demo@skan.al');
      console.log('   Password: DemoPassword123!');
    }
  }
}

// Run the setup
createDemoEnvironment();