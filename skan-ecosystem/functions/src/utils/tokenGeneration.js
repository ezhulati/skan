const crypto = require("crypto");

/**
 * Generate a secure random token for invitations
 * @param {number} length - Token length (default: 32 bytes = 64 hex chars)
 * @returns {string} Secure random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a shorter token for password resets (URL-friendly)
 * @returns {string} URL-safe token
 */
function generatePasswordResetToken() {
  return crypto.randomBytes(20).toString("hex");
}

/**
 * Hash password using scrypt (Node.js built-in)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password with salt
 */
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString("hex");
    
    // Hash the password with scrypt
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      
      // Combine salt and hash
      const hashedPassword = salt + ":" + derivedKey.toString("hex");
      resolve(hashedPassword);
    });
  });
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash (salt:hash format)
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    try {
      const [salt, key] = hash.split(":");
      
      if (!salt || !key) {
        resolve(false);
        return;
      }
      
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        
        const isValid = key === derivedKey.toString("hex");
        resolve(isValid);
      });
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Generate order number in format SKN-YYYYMMDD-NNN
 * @param {number} orderCount - Daily order count
 * @returns {string} Order number
 */
function generateOrderNumber(orderCount = 1) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const sequence = String(orderCount).padStart(3, "0");
  
  return `SKN-${year}${month}${day}-${sequence}`;
}

module.exports = {
  generateSecureToken,
  generatePasswordResetToken,
  hashPassword,
  verifyPassword,
  generateUUID,
  generateOrderNumber
};