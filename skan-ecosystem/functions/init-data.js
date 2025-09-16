const admin = require('firebase-admin');

// Initialize Firebase Admin (ensure you have proper credentials)
admin.initializeApp();
const db = admin.firestore();

async function initializeFirebaseData() {
  console.log('🚀 Initializing Firebase collections with sample data...');

  try {
    // 1. Create Beach Bar Durrës venue if it doesn't exist
    const venueRef = db.collection('venue').doc('beach-bar-durres');
    const venueDoc = await venueRef.get();
    
    if (!venueDoc.exists) {
      await venueRef.set({
        name: 'Beach Bar Durrës',
        slug: 'beach-bar-durres',
        address: 'Plazhi i Durrësit, Durrës, Albania',
        phone: '+355 67 123 4567',
        description: 'Premium beachfront dining experience in Durrës',
        settings: {
          orderTimeout: 30, // minutes
          maxOrderItems: 20,
          allowCustomerNames: true,
          requireTableSelection: true
        },
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created Beach Bar Durrës venue');
    } else {
      console.log('⏭️  Beach Bar Durrës venue already exists');
    }

    // 2. Create menu categories
    const categories = [
      { id: 'drinks', name: 'Drinks', nameAlbanian: 'Pije', sortOrder: 1 },
      { id: 'appetizers', name: 'Appetizers', nameAlbanian: 'Meze', sortOrder: 2 },
      { id: 'mains', name: 'Main Courses', nameAlbanian: 'Pjata Kryesore', sortOrder: 3 },
      { id: 'desserts', name: 'Desserts', nameAlbanian: 'Ëmbëlsira', sortOrder: 4 }
    ];

    for (const category of categories) {
      const categoryRef = venueRef.collection('menuCategory').doc(category.id);
      const categoryDoc = await categoryRef.get();
      
      if (!categoryDoc.exists) {
        await categoryRef.set({
          name: category.name,
          nameAlbanian: category.nameAlbanian,
          sortOrder: category.sortOrder,
          isActive: true
        });
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`⏭️  Category ${category.name} already exists`);
      }
    }

    // 3. Create menu items
    const menuItems = [
      // Drinks
      {
        id: 'albanian-beer',
        name: 'Albanian Beer',
        nameAlbanian: 'Birra Shqiptare',
        description: 'Local Korça beer, crisp and refreshing',
        descriptionAlbanian: 'Birra lokale Korça, e freskët dhe shijshme',
        price: 3.50,
        category: 'drinks',
        allergens: ['gluten'],
        isAvailable: true,
        sortOrder: 1
      },
      {
        id: 'rakia-grape',
        name: 'Grape Rakia',
        nameAlbanian: 'Raki Rrushi',
        description: 'Traditional Albanian grape spirit',
        descriptionAlbanian: 'Pije tradicionale shqiptare nga rrushi',
        price: 4.00,
        category: 'drinks',
        allergens: [],
        isAvailable: true,
        sortOrder: 2
      },
      {
        id: 'turkish-coffee',
        name: 'Turkish Coffee',
        nameAlbanian: 'Kafe Turke',
        description: 'Traditional strong coffee served with delight',
        descriptionAlbanian: 'Kafe e fortë tradicionale e shërbyer me kënaqësi',
        price: 2.50,
        category: 'drinks',
        allergens: [],
        isAvailable: true,
        sortOrder: 3
      },
      // Appetizers
      {
        id: 'byrek-spinach',
        name: 'Spinach Byrek',
        nameAlbanian: 'Byrek me Spinaq',
        description: 'Crispy pastry filled with fresh spinach and cheese',
        descriptionAlbanian: 'Byrek i kripur me spinaq të freskët dhe djathë',
        price: 4.50,
        category: 'appetizers',
        allergens: ['gluten', 'dairy', 'eggs'],
        isAvailable: true,
        sortOrder: 1
      },
      {
        id: 'olives-cheese',
        name: 'Mixed Olives & White Cheese',
        nameAlbanian: 'Ullinja të Përziera & Djathë i Bardhë',
        description: 'Selection of local olives with traditional white cheese',
        descriptionAlbanian: 'Përzgjedhje ullinjash vendore me djathë të bardhë tradicional',
        price: 6.00,
        category: 'appetizers',
        allergens: ['dairy'],
        isAvailable: true,
        sortOrder: 2
      },
      // Main Courses
      {
        id: 'grilled-sea-bass',
        name: 'Grilled Sea Bass',
        nameAlbanian: 'Levrek në Skara',
        description: 'Fresh Adriatic sea bass grilled with herbs and lemon',
        descriptionAlbanian: 'Levrek i freskët i Adriatikut në skara me erëza dhe limon',
        price: 18.00,
        category: 'mains',
        allergens: ['fish'],
        isAvailable: true,
        sortOrder: 1
      },
      {
        id: 'tavë-kosi',
        name: 'Tavë Kosi',
        nameAlbanian: 'Tavë Kosi',
        description: 'Traditional baked lamb with yogurt and rice',
        descriptionAlbanian: 'Mish qengji tradicional i pjekur me kos dhe oriz',
        price: 15.00,
        category: 'mains',
        allergens: ['dairy'],
        isAvailable: true,
        sortOrder: 2
      },
      // Desserts
      {
        id: 'baklava',
        name: 'Baklava',
        nameAlbanian: 'Bakllava',
        description: 'Sweet pastry layers with nuts and honey',
        descriptionAlbanian: 'Shtresa ëmbëlsire me arra dhe mjaltë',
        price: 5.50,
        category: 'desserts',
        allergens: ['gluten', 'nuts', 'eggs'],
        isAvailable: true,
        sortOrder: 1
      }
    ];

    for (const item of menuItems) {
      const itemRef = venueRef.collection('menuItem').doc(item.id);
      const itemDoc = await itemRef.get();
      
      if (!itemDoc.exists) {
        await itemRef.set({
          ...item,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Created menu item: ${item.name}`);
      } else {
        console.log(`⏭️  Menu item ${item.name} already exists`);
      }
    }

    // 4. Create tables
    const tables = [
      { id: 'a1', tableNumber: 'A1', displayName: 'Table A1', isActive: true },
      { id: 'a2', tableNumber: 'A2', displayName: 'Table A2', isActive: true },
      { id: 'a3', tableNumber: 'A3', displayName: 'Table A3', isActive: true },
      { id: 'b1', tableNumber: 'B1', displayName: 'Table B1', isActive: true },
      { id: 'b2', tableNumber: 'B2', displayName: 'Table B2', isActive: true },
      { id: 'b3', tableNumber: 'B3', displayName: 'Table B3', isActive: true },
    ];

    for (const table of tables) {
      const tableRef = venueRef.collection('table').doc(table.id);
      const tableDoc = await tableRef.get();
      
      if (!tableDoc.exists) {
        await tableRef.set({
          ...table,
          qrUrl: `https://order.skan.al/beach-bar-durres/${table.tableNumber.toLowerCase()}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Created table: ${table.displayName}`);
      } else {
        console.log(`⏭️  Table ${table.displayName} already exists`);
      }
    }

    // 5. Create users (restaurant staff)
    const users = [
      {
        id: 'manager-user',
        email: 'manager_email@gmail.com',
        fullName: 'Restaurant Manager',
        role: 'manager',
        venueId: 'beach-bar-durres',
        isActive: true
      },
      {
        id: 'owner-user', 
        email: 'arditxhanaj@gmail.com',
        fullName: 'Ardit Xhanaj',
        role: 'owner',
        venueId: 'beach-bar-durres',
        isActive: true
      }
    ];

    for (const user of users) {
      const userRef = db.collection('users').doc(user.id);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({
          ...user,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: null
        });
        console.log(`✅ Created user: ${user.fullName} (${user.role})`);
      } else {
        console.log(`⏭️  User ${user.fullName} already exists`);
      }
    }

    console.log('🎉 Firebase data initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Venue: Beach Bar Durrës');
    console.log('- Categories: 4 (Drinks, Appetizers, Mains, Desserts)');
    console.log('- Menu Items: 8 items');
    console.log('- Tables: 6 tables (A1-A3, B1-B3)');
    console.log('- Users: 2 staff members');
    console.log('\n🔗 QR Code URLs:');
    tables.forEach(table => {
      console.log(`- ${table.displayName}: https://order.skan.al/beach-bar-durres/${table.tableNumber.toLowerCase()}`);
    });

  } catch (error) {
    console.error('❌ Error initializing Firebase data:', error);
  }
}

// Run the initialization
if (require.main === module) {
  initializeFirebaseData()
    .then(() => {
      console.log('✅ Initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeFirebaseData };