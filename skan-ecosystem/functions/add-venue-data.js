const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin
admin.initializeApp({
  projectId: "qr-restaurant-api"
});

const db = admin.firestore();

async function addBeachBarData() {
  try {
    // Read the beach bar data
    const dataPath = path.join(__dirname, "../../beach-bar-data.json");
    const beachBarData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    
    console.log("🏖️  Adding Beach Bar Durrës venue data to Firestore...\n");
    
    // 1. Add venue
    const venueId = beachBarData.venue.id;
    const venueRef = db.collection("venue").doc(venueId);
    
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
    console.log("🍽️  Menu categories added:");
    beachBarData.menuCategories.forEach(cat => {
      console.log(`   ${cat.name} (${cat.nameAlbanian})`);
    });
    console.log("");
    console.log("🍕 Menu items added: " + beachBarData.menuItems.length + " items");
    console.log("💺 Tables added: " + beachBarData.tables.length + " tables");
    
  } catch (error) {
    console.error("❌ Error adding venue data:", error.message);
    console.error(error);
  }
  
  process.exit(0);
}

addBeachBarData();