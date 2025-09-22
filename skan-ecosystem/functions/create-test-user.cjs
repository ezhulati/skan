const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'qr-restaurant-api'
  });
}

const db = admin.firestore();

// Simple password hashing function
function hashPassword(password) {
  return crypto.scryptSync(password, 'salt', 64).toString('hex');
}

async function createTestUser() {
  console.log('🔧 Creating test user for Beach Bar Durrës...');
  
  try {
    // Create test user data
    const userData = {
      email: 'demo.beachbar@skan.al',
      passwordHash: hashPassword('BeachBarDemo2024'),
      fullName: 'Beach Bar Manager',
      role: 'manager',
      venueId: 'beach-bar-durres',
      isActive: true,
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Create venue data
    const venueData = {
      id: 'beach-bar-durres',
      name: 'Beach Bar Durrës',
      slug: 'beach-bar-durres',
      address: 'Rruga e Plazhit, Durrës 2001, Albania',
      phone: '+355 52 222 333',
      description: 'A beautiful beachfront bar and restaurant in Durrës offering fresh seafood, refreshing drinks, and stunning sea views.',
      settings: {
        currency: 'ALL',
        orderingEnabled: true,
        estimatedPreparationTime: 15
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Create user
    await db.collection('users').doc('demo.beachbar@skan.al').set(userData);
    console.log('✅ Test user created: demo.beachbar@skan.al');
    
    // Create venue
    await db.collection('venues').doc('beach-bar-durres').set(venueData);
    console.log('✅ Test venue created: beach-bar-durres');
    
    // Create some menu items
    const menuCategories = [
      {
        id: 'drinks',
        name: 'Drinks',
        nameAlbanian: 'Pije',
        sortOrder: 1
      },
      {
        id: 'appetizers', 
        name: 'Appetizers',
        nameAlbanian: 'Antipasta',
        sortOrder: 2
      }
    ];
    
    const menuItems = [
      {
        id: 'albanian-beer',
        name: 'Albanian Beer',
        nameAlbanian: 'Birrë Shqiptare',
        description: 'Local Tirana beer, cold and refreshing',
        descriptionAlbanian: 'Birrë vendore Tirana, e ftohtë dhe freske',
        price: 350,
        categoryId: 'drinks',
        allergens: ['gluten'],
        preparationTime: 2,
        sortOrder: 1,
        isAvailable: true
      },
      {
        id: 'greek-salad',
        name: 'Greek Salad',
        nameAlbanian: 'Sallatë Greke',
        description: 'Fresh tomatoes, cucumbers, olives, feta cheese with olive oil dressing',
        descriptionAlbanian: 'Domate të freskëta, kastravec, ullinj, djathë feta me vaj ulliri',
        price: 900,
        categoryId: 'appetizers',
        allergens: ['dairy'],
        preparationTime: 10,
        sortOrder: 1,
        isAvailable: true
      }
    ];
    
    // Create menu categories
    for (const category of menuCategories) {
      await db.collection('venues').doc('beach-bar-durres')
        .collection('menuCategory').doc(category.id).set(category);
    }
    console.log('✅ Menu categories created');
    
    // Create menu items
    for (const item of menuItems) {
      await db.collection('venues').doc('beach-bar-durres')
        .collection('menuItem').doc(item.id).set(item);
    }
    console.log('✅ Menu items created');
    
    console.log('\n🎯 Test Setup Complete!');
    console.log('📧 Email: demo.beachbar@skan.al');
    console.log('🔐 Password: BeachBarDemo2024!');
    console.log('🏪 Venue: Beach Bar Durrës');
    console.log('💰 Items: Albanian Beer (350 ALL), Greek Salad (900 ALL)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();