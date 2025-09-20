const axios = require('axios');

async function copyMenuData() {
  console.log('📋 Copying menu data from beach-bar-durres to demo-bistro...\n');
  
  const API_BASE = 'https://api-mkazmlu7ta-ew.a.run.app';
  
  try {
    // Get source menu data
    console.log('1️⃣ Fetching source menu data...');
    const sourceMenu = await axios.get(`${API_BASE}/v1/venue/beach-bar-durres/menu`);
    
    console.log('✅ Source menu loaded:');
    sourceMenu.data.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.items.length} items`);
    });
    
    // The menu data needs to be copied directly in Firestore
    // Since we don't have menu management API endpoints, 
    // let's create a comprehensive menu structure for the demo venue
    
    const demoMenuData = {
      venue: {
        id: 'demo-bistro',
        name: 'Demo Bistro',
        slug: 'demo-bistro',
        address: '456 Demo Avenue, Tirana, Albania',
        phone: '+355691234568',
        description: 'Try our QR ordering system with this interactive demo',
        settings: {
          currency: 'EUR',
          orderingEnabled: true,
          estimatedPreparationTime: 15
        }
      },
      categories: [
        {
          id: 'appetizers',
          name: 'Appetizers',
          nameAlbanian: 'Antipastet',
          sortOrder: 1,
          items: [
            {
              id: 'bruschetta',
              name: 'Classic Bruschetta',
              nameAlbanian: 'Bruschetta Klasike',
              description: 'Toasted bread with fresh tomatoes, basil, and olive oil',
              descriptionAlbanian: 'Bukë e pjekur me domate të freskët, borzilok dhe vaj ulliri',
              price: 8.50,
              allergens: ['gluten'],
              preparationTime: 10,
              sortOrder: 1
            },
            {
              id: 'greek-salad',
              name: 'Greek Salad',
              nameAlbanian: 'Sallatë Greke',
              description: 'Fresh cucumber, tomatoes, olives, and feta cheese',
              descriptionAlbanian: 'Kastravec të freskët, domate, ullinj dhe djathë feta',
              price: 9.50,
              allergens: ['dairy'],
              preparationTime: 8,
              sortOrder: 2
            }
          ]
        },
        {
          id: 'main-courses',
          name: 'Main Courses',
          nameAlbanian: 'Pjatat Kryesore',
          sortOrder: 2,
          items: [
            {
              id: 'grilled-sea-bass',
              name: 'Grilled Sea Bass',
              nameAlbanian: 'Levrek në Skarë',
              description: 'Fresh sea bass grilled to perfection with herbs and lemon',
              descriptionAlbanian: 'Levrek i freskët në skarë me erëza dhe limon',
              price: 22.00,
              allergens: ['fish'],
              preparationTime: 25,
              sortOrder: 1
            },
            {
              id: 'seafood-risotto',
              name: 'Seafood Risotto',
              nameAlbanian: 'Risotto me Fruta Deti',
              description: 'Creamy risotto with mixed seafood and saffron',
              descriptionAlbanian: 'Risotto kremoz me fruta deti të përziera dhe shafran',
              price: 18.50,
              allergens: ['dairy', 'shellfish'],
              preparationTime: 30,
              sortOrder: 2
            }
          ]
        },
        {
          id: 'drinks',
          name: 'Drinks',
          nameAlbanian: 'Pije',
          sortOrder: 3,
          items: [
            {
              id: 'albanian-beer',
              name: 'Albanian Beer',
              nameAlbanian: 'Birrë Shqiptare',
              description: 'Local craft beer brewed in Albania',
              descriptionAlbanian: 'Birrë artizanale lokale e prodhuar në Shqipëri',
              price: 3.50,
              allergens: ['gluten'],
              preparationTime: 2,
              sortOrder: 1
            },
            {
              id: 'fresh-lemonade',
              name: 'Fresh Lemonade',
              nameAlbanian: 'Limonadë e Freskët',
              description: 'Freshly squeezed lemons with mint',
              descriptionAlbanian: 'Limon të shtrydhur të freskët me mente',
              price: 4.00,
              allergens: [],
              preparationTime: 5,
              sortOrder: 2
            },
            {
              id: 'house-wine',
              name: 'House Wine (Glass)',
              nameAlbanian: 'Verë e Shtëpisë (Gotë)',
              description: 'Local Albanian wine, red or white',
              descriptionAlbanian: 'Verë lokale shqiptare, e kuqe ose e bardhë',
              price: 6.50,
              allergens: ['sulfites'],
              preparationTime: 3,
              sortOrder: 3
            }
          ]
        },
        {
          id: 'desserts',
          name: 'Desserts',
          nameAlbanian: 'Ëmbëlsira',
          sortOrder: 4,
          items: [
            {
              id: 'baklava',
              name: 'Traditional Baklava',
              nameAlbanian: 'Bakllava Tradicionale',
              description: 'Layers of phyllo pastry with nuts and honey',
              descriptionAlbanian: 'Shtresa brumi fillo me arra dhe mjaltë',
              price: 6.00,
              allergens: ['nuts', 'gluten'],
              preparationTime: 5,
              sortOrder: 1
            },
            {
              id: 'tiramisu',
              name: 'Tiramisu',
              nameAlbanian: 'Tiramisu',
              description: 'Classic Italian dessert with coffee and mascarpone',
              descriptionAlbanian: 'Ëmbëlsirë klasike italiane me kafe dhe mascarpone',
              price: 7.50,
              allergens: ['dairy', 'eggs'],
              preparationTime: 3,
              sortOrder: 2
            }
          ]
        }
      ]
    };
    
    console.log('\n2️⃣ Demo menu structure created:');
    demoMenuData.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.items.length} items`);
    });
    
    // Save the menu structure to a file for manual import
    require('fs').writeFileSync('./demo-menu-structure.json', JSON.stringify(demoMenuData, null, 2));
    
    console.log('\n📋 Menu structure saved to demo-menu-structure.json');
    console.log('\n⚠️ Note: Since there are no API endpoints for menu management,');
    console.log('the menu data needs to be manually added to Firestore or');
    console.log('the menu management endpoints need to be implemented in the API.');
    
    console.log('\n📝 To add this menu data:');
    console.log('1. Use Firebase Console to add subcollections to venues/demo-bistro/');
    console.log('2. Add menuCategory and menuItem subcollections');
    console.log('3. Or implement menu management API endpoints');
    
    console.log('\n🎯 Demo URLs (after menu is added):');
    console.log('Customer: https://order.skan.al/demo-bistro/table-1/menu');
    console.log('Admin: https://admin.skan.al');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
  }
}

copyMenuData();