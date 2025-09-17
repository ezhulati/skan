// Add test users to Firestore users collection
const crypto = require("crypto");

// Generate scrypt hash for password (matching API logic)
function hashPassword(password) {
  const salt = crypto.randomBytes(32);
  const hashedPassword = crypto.scryptSync(password, salt, 64);
  return {
    hash: hashedPassword.toString("hex"),
    salt: salt.toString("hex")
  };
}

// Test users to add
const testUsers = [
  {
    id: "test-manager-1",
    email: "manager@skan.al",
    password: "SkanManager2024!",
    role: "manager",
    name: "Test Manager"
  },
  {
    id: "test-admin-1", 
    email: "admin@skan.al",
    password: "SkanAdmin2024!",
    role: "admin",
    name: "Test Admin"
  }
];

console.log("🔑 TEST CREDENTIALS CREATED:");
console.log("================================");

testUsers.forEach(user => {
  const { hash, salt } = hashPassword(user.password);
  
  console.log(`\n📧 Email: ${user.email}`);
  console.log(`🔑 Password: ${user.password}`);
  console.log(`👤 Role: ${user.role}`);
  console.log(`🆔 ID: ${user.id}`);
  console.log(`🔐 Hash: ${hash}`);
  console.log(`🧂 Salt: ${salt}`);
  
  // Firebase CLI command to add to Firestore
  console.log(`\n📝 Firebase CLI Command:`);
  console.log(`firebase firestore:set users/${user.id} '{"email":"${user.email}","passwordHash":"${hash}","salt":"${salt}","role":"${user.role}","name":"${user.name}","createdAt":"${new Date().toISOString()}"}'`);
});

console.log("\n\n✅ Use these credentials to login to the admin portal!");
console.log("🌐 Admin Portal: https://skan-admin.netlify.app/login");
console.log("🌐 API Login: https://api-mkazmlu7ta-ew.a.run.app/v1/auth/login");