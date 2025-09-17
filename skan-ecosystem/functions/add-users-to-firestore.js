const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  projectId: "qr-restaurant-api"
});

const db = admin.firestore();

async function addTestUsers() {
  const testUsers = [
    {
      id: "test-manager-1",
      email: "manager@skan.al",
      passwordHash: "00a614a1ba0648b0a204c6d523562fd55f5efba83393bf5951374c7b112699f322b877bca6a20a815d1d0a10bb5075096301a384f7611daac4f40ca965daefcd",
      salt: "7019cd4c74c85f1a102bf165ab69a8f9e5aa7de3c7b2f536afeae61c844a9750",
      role: "manager",
      name: "Test Manager",
      createdAt: "2025-09-17T00:45:18.208Z"
    },
    {
      id: "test-admin-1",
      email: "admin@skan.al",
      passwordHash: "8bf895d9e5548593dd0830ae80b468554b3a696aa891718991f92a6804a8106ad2f1ee2241d125cece3f3272e22c772e832c5ee81658b391f7e1ffd6ea04615c",
      salt: "28e763a925814ed84e41d8b4cb21df978ac9667bbe902c32209dedcd45af39d6",
      role: "admin",
      name: "Test Admin",
      createdAt: "2025-09-17T00:45:18.228Z"
    }
  ];

  try {
    for (const user of testUsers) {
      const { id, ...userData } = user;
      await db.collection("users").doc(id).set(userData);
      console.log(`✅ Added user: ${userData.email}`);
    }
    
    console.log("\n🎉 SUCCESS! Test credentials added to Firestore:");
    console.log("==================================================");
    console.log("📧 Email: manager@skan.al");
    console.log("🔑 Password: SkanManager2024!");
    console.log("👤 Role: manager");
    console.log("");
    console.log("📧 Email: admin@skan.al");
    console.log("🔑 Password: SkanAdmin2024!");
    console.log("👤 Role: admin");
    console.log("");
    console.log("🌐 Test these at: https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
  
  process.exit(0);
}

addTestUsers();