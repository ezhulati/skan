const admin = require("firebase-admin");

// Initialize Firebase Admin with project ID
try {
  admin.initializeApp({
    projectId: "qr-restaurant-api"
  });
} catch (error) {
  // Already initialized
}

async function resetPassword() {
  const auth = admin.auth();
  
  try {
    // Update the manager account with a new password
    const userRecord = await auth.updateUser("KNsoT98sN7MZ8JRB034butbiuim2", {
      password: "NewPassword123!"
    });
    
    console.log("✅ Password reset successful!");
    console.log("📧 Email: manager_email@gmail.com");
    console.log("🔑 New Password: NewPassword123!");
    console.log("🆔 User ID:", userRecord.uid);
    
    // Also create a new test admin account
    const newAdmin = await auth.createUser({
      email: "admin@skan.al",
      password: "SkanAdmin2024!",
      emailVerified: true,
      displayName: "SKAN Admin"
    });
    
    console.log("\n✅ New admin account created!");
    console.log("📧 Email: admin@skan.al");
    console.log("🔑 Password: SkanAdmin2024!");
    console.log("🆔 User ID:", newAdmin.uid);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
  
  process.exit(0);
}

resetPassword();