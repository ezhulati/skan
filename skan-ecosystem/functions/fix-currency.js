const admin = require("firebase-admin");

// Initialize admin with project ID only
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "qr-restaurant-api"
  });
}

const db = admin.firestore();

async function fixCurrency() {
  try {
    console.log("🔧 Fixing Beach Bar Durrës currency setting...");
    
    const venueRef = db.collection("venue").doc("beach-bar-durres");
    
    // Update only the currency in settings
    await venueRef.update({
      "settings.currency": "ALL",
      "updatedAt": admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("✅ Currency updated from EUR to ALL (Albanian Lek)");
    console.log("🍽️  Menu prices will now display in Albanian Lek");
    console.log("📱 Test at: https://order.skan.al/beach-bar-durres/a1/menu");
    
  } catch (error) {
    console.error("❌ Error updating currency:", error.message);
    console.error(error);
  }
  
  process.exit(0);
}

fixCurrency();