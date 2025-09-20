const admin = require("firebase-admin");

// Initialize admin with project ID only
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "qr-restaurant-api"
  });
}

const db = admin.firestore();

const beachBarData = {
  "venue": {
    "id": "beach-bar-durres",
    "name": "Beach Bar Durrës",
    "slug": "beach-bar-durres", 
    "address": "Rruga e Plazhit, Durrës 2001, Albania",
    "phone": "+355 52 222 333",
    "description": "A beautiful beachfront bar and restaurant in Durrës offering fresh seafood, refreshing drinks, and stunning sea views. Perfect for sunset dining and relaxed beach atmosphere.",
    "settings": {
      "currency": "ALL",
      "orderingEnabled": true,
      "estimatedPreparationTime": 15
    }
  },
  "menuCategories": [
    {
      "id": "appetizers",
      "name": "Appetizers",
      "nameAlbanian": "Antipasta",
      "sortOrder": 1
    },
    {
      "id": "mains", 
      "name": "Main Courses",
      "nameAlbanian": "Pjata Kryesore",
      "sortOrder": 2
    },
    {
      "id": "seafood",
      "name": "Fresh Seafood", 
      "nameAlbanian": "Peshk i Freskët",
      "sortOrder": 3
    },
    {
      "id": "drinks",
      "name": "Drinks",
      "nameAlbanian": "Pije",
      "sortOrder": 4
    },
    {
      "id": "desserts",
      "name": "Desserts",
      "nameAlbanian": "Ëmbëlsira",
      "sortOrder": 5
    }
  ],
  "menuItems": [
    {
      "id": "greek-salad",
      "name": "Greek Salad",
      "nameAlbanian": "Sallatë Greke",
      "description": "Fresh tomatoes, cucumbers, olives, feta cheese with olive oil dressing",
      "descriptionAlbanian": "Domate të freskëta, kastravec, ullinj, djathë feta me vaj ulliri",
      "price": 8.50,
      "categoryId": "appetizers",
      "allergens": ["dairy"],
      "preparationTime": 10,
      "isAvailable": true,
      "sortOrder": 1
    },
    {
      "id": "fried-calamari",
      "name": "Fried Calamari",
      "nameAlbanian": "Kallamar i Skuqur",
      "description": "Crispy fried squid rings served with marinara sauce",
      "descriptionAlbanian": "Unaza kallamari të krisur me salcë marinara",
      "price": 12.00,
      "categoryId": "appetizers", 
      "allergens": ["gluten", "seafood"],
      "preparationTime": 12,
      "isAvailable": true,
      "sortOrder": 2
    },
    {
      "id": "grilled-branzino",
      "name": "Grilled Sea Bass",
      "nameAlbanian": "Levrek në Skara",
      "description": "Fresh Mediterranean sea bass grilled with herbs and lemon",
      "descriptionAlbanian": "Levrek i freskët mesdhetar në skara me erëza dhe limon",
      "price": 24.00,
      "categoryId": "seafood",
      "allergens": ["seafood"],
      "preparationTime": 20,
      "isAvailable": true,
      "sortOrder": 1
    },
    {
      "id": "seafood-risotto",
      "name": "Seafood Risotto", 
      "nameAlbanian": "Rizoto me Peshk Deti",
      "description": "Creamy risotto with mixed seafood, mussels, and prawns",
      "descriptionAlbanian": "Rizoto kremore me peshk deti të përzier, midhje dhe karkaleca",
      "price": 18.50,
      "categoryId": "mains",
      "allergens": ["seafood", "dairy"],
      "preparationTime": 25,
      "isAvailable": true,
      "sortOrder": 1
    },
    {
      "id": "grilled-lamb",
      "name": "Grilled Lamb Chops",
      "nameAlbanian": "Copë Qengji në Skara", 
      "description": "Tender lamb chops grilled with rosemary and garlic",
      "descriptionAlbanian": "Copë qengji të buta në skara me ruzmarinë dhe hudhra",
      "price": 22.00,
      "categoryId": "mains",
      "allergens": [],
      "preparationTime": 18,
      "isAvailable": true,
      "sortOrder": 2
    },
    {
      "id": "albanian-beer",
      "name": "Albanian Beer",
      "nameAlbanian": "Birrë Shqiptare",
      "description": "Local Tirana beer, cold and refreshing",
      "descriptionAlbanian": "Birrë vendore Tirana, e ftohtë dhe freske",
      "price": 3.50,
      "categoryId": "drinks",
      "allergens": ["gluten"],
      "preparationTime": 2,
      "isAvailable": true,
      "sortOrder": 1
    },
    {
      "id": "raki",
      "name": "Albanian Raki",
      "nameAlbanian": "Raki Shqiptar",
      "description": "Traditional Albanian grape brandy",
      "descriptionAlbanian": "Raki tradicional shqiptar prej rrushi",
      "price": 4.00,
      "categoryId": "drinks",
      "allergens": [],
      "preparationTime": 2,
      "isAvailable": true,
      "sortOrder": 2
    },
    {
      "id": "mojito",
      "name": "Mojito",
      "nameAlbanian": "Mojito",
      "description": "Fresh mint, lime, rum and soda water",
      "descriptionAlbanian": "Mente e freskët, limon, rum dhe ujë me gaz",
      "price": 7.50,
      "categoryId": "drinks",
      "allergens": [],
      "preparationTime": 5,
      "isAvailable": true,
      "sortOrder": 3
    },
    {
      "id": "tiramisu",
      "name": "Tiramisu",
      "nameAlbanian": "Tiramisu", 
      "description": "Classic Italian dessert with coffee and mascarpone",
      "descriptionAlbanian": "Ëmbëlsirë klasike italiane me kafe dhe mascarpone",
      "price": 6.50,
      "categoryId": "desserts",
      "allergens": ["dairy", "eggs", "gluten"],
      "preparationTime": 5,
      "isAvailable": true,
      "sortOrder": 1
    },
    {
      "id": "baklava",
      "name": "Baklava",
      "nameAlbanian": "Bakllava",
      "description": "Traditional Albanian pastry with nuts and honey",
      "descriptionAlbanian": "Ëmbëlsirë tradicionale shqiptare me arra dhe mjaltë",
      "price": 5.50,
      "categoryId": "desserts",
      "allergens": ["nuts", "gluten"],
      "preparationTime": 3,
      "isAvailable": true,
      "sortOrder": 2
    }
  ],
  "tables": [
    {
      "id": "a1",
      "name": "Table A1",
      "capacity": 4,
      "location": "Beachfront Terrace"
    },
    {
      "id": "a2", 
      "name": "Table A2",
      "capacity": 6,
      "location": "Beachfront Terrace"
    },
    {
      "id": "b1",
      "name": "Table B1", 
      "capacity": 2,
      "location": "Indoor Seating"
    },
    {
      "id": "b2",
      "name": "Table B2",
      "capacity": 4,
      "location": "Indoor Seating"
    }
  ]
};

async function importData() {
  try {
    console.log("🏖️  Adding Beach Bar Durrës venue data to Firestore...\n");
    
    const venueId = beachBarData.venue.id;
    const venueRef = db.collection("venue").doc(venueId);
    
    // 1. Add venue
    await venueRef.set({
      name: beachBarData.venue.name,
      slug: beachBarData.venue.slug,
      address: beachBarData.venue.address,
      phone: beachBarData.venue.phone,
      description: beachBarData.venue.description,
      settings: beachBarData.venue.settings,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Added venue: ${beachBarData.venue.name}`);
    
    // 2. Add menu categories
    for (const category of beachBarData.menuCategories) {
      const categoryRef = venueRef.collection("menuCategory").doc(category.id);
      await categoryRef.set({
        name: category.name,
        nameAlbanian: category.nameAlbanian,
        sortOrder: category.sortOrder,
        isActive: true
      });
      console.log(`✅ Added category: ${category.name}`);
    }
    
    // 3. Add menu items
    for (const item of beachBarData.menuItems) {
      const itemRef = venueRef.collection("menuItem").doc(item.id);
      await itemRef.set({
        name: item.name,
        nameAlbanian: item.nameAlbanian,
        description: item.description,
        descriptionAlbanian: item.descriptionAlbanian,
        price: item.price,
        category: item.categoryId,
        allergens: item.allergens,
        preparationTime: item.preparationTime,
        isAvailable: item.isAvailable,
        sortOrder: item.sortOrder
      });
      console.log(`✅ Added menu item: ${item.name} (€${item.price})`);
    }
    
    // 4. Add tables
    for (const table of beachBarData.tables) {
      const tableRef = venueRef.collection("table").doc(table.id);
      await tableRef.set({
        tableNumber: table.id,
        displayName: table.name,
        capacity: table.capacity,
        location: table.location,
        isActive: true
      });
      console.log(`✅ Added table: ${table.name} (${table.capacity} seats, ${table.location})`);
    }
    
    console.log("\n🎉 SUCCESS! Beach Bar Durrës data added to Firestore!");
    console.log("==================================================");
    console.log("🌐 Test the customer app at:");
    console.log("   https://skan-order.netlify.app/beach-bar-durres/a1");
    console.log("");
    console.log("📱 QR Code URLs generated:");
    beachBarData.tables.forEach(table => {
      console.log(`   Table ${table.id}: https://order.skan.al/beach-bar-durres/${table.id}`);
    });
    console.log("");
    console.log("🍽️  Menu categories: " + beachBarData.menuCategories.length + " categories");
    console.log("🍕 Menu items: " + beachBarData.menuItems.length + " items");
    console.log("💺 Tables: " + beachBarData.tables.length + " tables");
    
  } catch (error) {
    console.error("❌ Error adding venue data:", error.message);
    console.error(error);
  }
  
  process.exit(0);
}

importData();