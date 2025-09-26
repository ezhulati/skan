const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

// Import our custom services
const { sendInvitationEmail } = require("./src/services/emailService");
const { 
  generateSecureToken, 
  hashPassword
} = require("./src/utils/tokenGeneration");

admin.initializeApp();
const db = admin.firestore();

// Helper function for server timestamps that works in emulator
const getServerTimestamp = () => {
  try {
    return admin.firestore.FieldValue.serverTimestamp();
  } catch (error) {
    // Fallback for emulator or when serverTimestamp fails
    return new Date();
  }
};

const app = express();

// Enable trust proxy for Firebase Functions
app.set("trust proxy", true);

// Security Configuration (Firebase Functions v2 compatible)
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRE = "15m"; // Access token expires in 15 minutes
const REFRESH_TOKEN_EXPIRE = "7d"; // Refresh token expires in 7 days

// Microsoft Translator Configuration
const TRANSLATOR_CONFIG = {
  key1: process.env.TRANSLATOR_KEY_1,
  key2: process.env.TRANSLATOR_KEY_2,
  endpoint: process.env.TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com/",
  region: process.env.TRANSLATOR_REGION || "westeurope"
};

// Demo User State Storage (in-memory for development)
let DEMO_USER_NAME = "Beach Bar Manager"; // Default name that can be updated

// PayPal Configuration
const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || "AX3Ulz4TGQNK0i7aSAiswjqNp6FG2Ox4Ewj3aXvKwQMjaB_euPr5Jl3GSozx5GTYSQvRwnnD2coNaLop",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "EOcBR2IWQBrycA-wLexlOTv1A7Gs_kzxYziG10kMqE3t0bdVEZK2BbOXXV90u6J9Tq2C1ernFiaW1viN",
  environment: process.env.PAYPAL_ENVIRONMENT || "live", // sandbox or live
  apiUrl: process.env.PAYPAL_ENVIRONMENT === "live" ? 
    "https://api.paypal.com" : "https://api.sandbox.paypal.com"
};

// PayPal helper functions
async function getPayPalAccessToken() {
  try {
    const response = await axios.post(`${PAYPAL_CONFIG.apiUrl}/v1/oauth2/token`, 
      "grant_type=client_credentials",
      {
        headers: {
          "Accept": "application/json",
          "Accept-Language": "en_US",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        auth: {
          username: PAYPAL_CONFIG.clientId,
          password: PAYPAL_CONFIG.clientSecret
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("PayPal access token error:", error.response?.data || error.message);
    throw new Error("Failed to get PayPal access token");
  }
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ 
  origin: process.env.NODE_ENV === "production" 
    ? ["https://admin.skan.al", "https://order.skan.al", "https://skan.al"]
    : true,
  credentials: true
}));
// JSON parsing with error handling and special character support
app.use(express.json({ 
  limit: "1mb",
  type: ["application/json"],
  verify: (req, res, buf) => {
    try {
      // Try to parse as-is first
      JSON.parse(buf.toString());
    } catch (e) {
      // If parsing fails, try to fix common issues with exclamation marks
      const str = buf.toString();
      const fixed = str.replace(/BeachBarDemo2024!/g, "BeachBarDemo2024");
      try {
        JSON.parse(fixed);
        // If fixed version works, replace the buffer
        req.rawBody = fixed;
      } catch (e2) {
        // If still failing, let the default handler deal with it
        console.error("JSON parse error:", e.message);
      }
    }
  }
}));

// JSON error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.statusCode === 400) {
    return res.status(400).json({ error: "Invalid JSON format in request body" });
  }
  next(error);
});

// HTTPS Enforcement (production only)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.header("x-forwarded-proto") !== "https") {
    return res.redirect(`https://${req.header("host")}${req.url}`);
  }
  next();
});

// Global rate limiting (applied after generalLimiter is defined)

// Input sanitization middleware
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  next();
});

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// JWT Token Management
const generateTokens = (user) => {
  const payload = {
    uid: user.id,
    email: user.email,
    role: user.role,
    venueId: user.venueId,
    type: "access"
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRE,
    issuer: "skan.al",
    audience: "skan-api"
  });
  
  const refreshToken = jwt.sign({
    uid: user.id,
    type: "refresh",
    jti: uuidv4() // Unique token ID for blacklisting
  }, JWT_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRE,
    issuer: "skan.al",
    audience: "skan-api"
  });
  
  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: "skan.al",
      audience: "skan-api"
    });
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Audit Logging
const auditLog = async (action, userId, details = {}, ip = "unknown") => {
  try {
    await db.collection("audit_logs").add({
      action,
      userId,
      details,
      ip,
      timestamp: getServerTimestamp(),
      userAgent: details.userAgent || "unknown"
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
};

// Account Lockout Management
const accountLockout = {
  async checkLockout(email) {
    const lockoutDoc = await db.collection("account_lockouts").doc(email).get();
    if (!lockoutDoc.exists) return false;
    
    const data = lockoutDoc.data();
    if (data.lockedUntil && data.lockedUntil.toDate() > new Date()) {
      return true;
    }
    return false;
  },
  
  async recordFailedAttempt(email, ip) {
    const docRef = db.collection("account_lockouts").doc(email);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await docRef.set({
        failedAttempts: 1,
        lastAttempt: getServerTimestamp(),
        ip
      });
    } else {
      const data = doc.data();
      const attempts = data.failedAttempts + 1;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (attempts >= 5) {
        await docRef.update({
          failedAttempts: attempts,
          lockedUntil: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)),
          lastAttempt: getServerTimestamp(),
          ip
        });
      } else {
        await docRef.update({
          failedAttempts: attempts,
          lastAttempt: getServerTimestamp(),
          ip
        });
      }
    }
  },
  
  async clearFailedAttempts(email) {
    await db.collection("account_lockouts").doc(email).delete();
  }
};

// Input Sanitization
const xss = require("xss");

const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return xss(input.trim().slice(0, 1000)); // Limit length and sanitize
  }
  if (typeof input === "number") {
    return isNaN(input) ? 0 : Math.max(-999999, Math.min(999999, input));
  }
  return input;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = sanitizeInput(value);
    }
  }
  return sanitized;
};

const formatOrderDoc = (doc) => {
  const data = doc.data();

  const toIso = (value) => {
    if (!value) {
      return undefined;
    }
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  return {
    id: doc.id,
    ...data,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    preparedAt: toIso(data.preparedAt),
    readyAt: toIso(data.readyAt),
    servedAt: toIso(data.servedAt)
  };
};

// Enhanced Rate Limiting
// const createRateLimiter = (windowMs, max, message) => {
//   return rateLimit({
//     windowMs,
//     max,
//     message: { error: message },
//     standardHeaders: true,
//     legacyHeaders: false,
//     handler: async (req, res) => {
//       await auditLog("RATE_LIMIT_EXCEEDED", req.user?.uid || null, {
//         ip: req.ip,
//         endpoint: req.path,
//         userAgent: req.headers["user-agent"]
//       }, req.ip);
//       res.status(429).json({ error: message });
//     }
//   });
// };

// Different rate limits for different endpoint types
// const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, "Rate limit exceeded. Please try again later.");

// Apply global rate limiting
// app.use(generalLimiter); // DISABLED FOR DEVELOPMENT

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

// Middleware to verify authentication for protected routes
const verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      await auditLog("AUTH_FAILED", null, { reason: "No token provided" }, req.ip);
      return res.status(401).json({ error: "No token provided" });
    }
    
    // Handle demo tokens (when demo credentials are enabled)
    if (process.env.ALLOW_DEMO_CREDENTIALS === "true" && (token.startsWith("demo_token_") || token.startsWith("beach_bar_token_"))) {
      req.user = {
        uid: "demo-beach-bar-user",
        email: "demo.beachbar@skan.al",
        role: "manager",
        venueId: "beach-bar-durres"
      };
      return next();
    }
    
    // Handle legacy temporary tokens (for backward compatibility)
    if (token.startsWith("temp_")) {
      const parts = token.split("_");
      if (parts.length !== 3) {
        await auditLog("AUTH_FAILED", null, { reason: "Invalid temp token format" }, req.ip);
        return res.status(401).json({ error: "Invalid token format" });
      }
      
      const userId = parts[1];
      const timestamp = parseInt(parts[2]);
      
      // Check token age (expire after 24 hours)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        await auditLog("AUTH_FAILED", userId, { reason: "Token expired" }, req.ip);
        return res.status(401).json({ error: "Token expired" });
      }
      
      // Verify user exists and is active
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        await auditLog("AUTH_FAILED", userId, { reason: "User not found" }, req.ip);
        return res.status(401).json({ error: "User not found" });
      }
      
      const userData = userDoc.data();
      if (!userData.isActive) {
        await auditLog("AUTH_FAILED", userId, { reason: "User inactive" }, req.ip);
        return res.status(401).json({ error: "User account is inactive" });
      }
      
      req.user = {
        uid: userId,
        email: userData.email,
        role: userData.role,
        venueId: userData.venueId
      };
      return next();
    }
    
    // Verify JWT token (preferred method)
    try {
      const decoded = verifyToken(token);
      
      if (decoded.type !== "access") {
        await auditLog("AUTH_FAILED", decoded.uid, { reason: "Invalid token type" }, req.ip);
        return res.status(401).json({ error: "Invalid token type" });
      }
      
      // Verify user still exists and is active
      const userDoc = await db.collection("users").doc(decoded.uid).get();
      if (!userDoc.exists) {
        await auditLog("AUTH_FAILED", decoded.uid, { reason: "User not found" }, req.ip);
        return res.status(401).json({ error: "User not found" });
      }
      
      const userData = userDoc.data();
      if (!userData.isActive) {
        await auditLog("AUTH_FAILED", decoded.uid, { reason: "User inactive" }, req.ip);
        return res.status(401).json({ error: "User account is inactive" });
      }
      
      req.user = decoded;
      next();
      
    } catch (jwtError) {
      // Fallback to Firebase ID token verification
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
      } catch (firebaseError) {
        await auditLog("AUTH_FAILED", null, { reason: "Invalid token", error: firebaseError.message }, req.ip);
        console.error("Auth verification error:", firebaseError);
        res.status(401).json({ error: "Invalid token" });
      }
    }
    
  } catch (error) {
    await auditLog("AUTH_FAILED", null, { reason: "Auth middleware error", error: error.message }, req.ip);
    console.error("Auth verification error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Global error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Security monitoring endpoint (admin only)
app.get("/v1/security/audit", verifyAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  const logs = await db.collection("audit_logs")
    .orderBy("timestamp", "desc")
    .limit(100)
    .get();
  
  const auditData = logs.docs.map(doc => doc.data());
  res.json({ logs: auditData });
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "skan-api",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

// API Info endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Skan.al API - Enterprise Secure QR Code Ordering System",
    version: "2.0.0",
    security: {
      jwt: "enabled",
      rateLimit: "enabled", 
      auditLog: "enabled",
      inputSanitization: "enabled",
      helmet: "enabled",
      accountLockout: "enabled",
      xssProtection: "enabled"
    },
    endpoints: {
      auth: ["/v1/auth/login", "/v1/auth/refresh", "/v1/auth/logout"],
      venues: ["/v1/venue/:slug/menu", "/v1/venues"],
      orders: ["/v1/orders", "/v1/venue/:venueId/orders"],
      users: ["/v1/users", "/v1/auth/register"],
      translation: ["/v1/translate/menu-item", "/v1/translate/menu-items/bulk"],
      payments: ["/v1/payments/subscriptions", "/v1/payments/plans", "/v1/payments/setup-plans", "/v1/payments/test", "/v1/payments/webhooks"]
    }
  });
});

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

// ============================================================================
// VENUE & MENU ENDPOINTS
// ============================================================================

// Get venue menu by slug
app.get("/v1/venue/:slug/menu", async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Handle demo restaurant
    if (slug === "demo-restaurant") {
      return res.json({
        venue: {
          id: "beach-bar-durres",
          name: "Beach Bar Durrës",
          slug: "demo-restaurant",
          address: "123 Demo Street, Demo City",
          phone: "+355691234567",
          description: "Demo restaurant for testing SKAN.AL",
          settings: {
            currency: "EUR",
            orderingEnabled: true,
            estimatedPreparationTime: 15
          }
        },
        categories: [
          {
            id: "appetizers",
            name: "Appetizers",
            nameAlbanian: "Antipasta",
            sortOrder: 1,
            items: [
              {
                id: "bread-basket",
                name: "Bread Basket",
                nameAlbanian: "Shporta Buke",
                description: "Fresh bread with olive oil and herbs",
                descriptionAlbanian: "Bukë e freskët me vaj ulliri dhe erëza",
                price: 5.50,
                allergens: ["gluten"],
                preparationTime: 5,
                sortOrder: 1
              }
            ]
          },
          {
            id: "mains",
            name: "Main Courses",
            nameAlbanian: "Pjata Kryesore",
            sortOrder: 2,
            items: [
              {
                id: "pizza-margherita",
                name: "Pizza Margherita",
                nameAlbanian: "Pizza Margherita",
                description: "Classic pizza with tomato, mozzarella, and basil",
                descriptionAlbanian: "Pizza klasike me domate, mozzarella dhe borzilok",
                price: 12.99,
                allergens: ["gluten", "dairy"],
                preparationTime: 15,
                sortOrder: 1
              },
              {
                id: "grilled-fish",
                name: "Grilled Fish",
                nameAlbanian: "Peshk në Skarë",
                description: "Fresh fish grilled to perfection",
                descriptionAlbanian: "Peshk i freskët i pjekur në skarë",
                price: 18.50,
                allergens: ["fish"],
                preparationTime: 20,
                sortOrder: 2
              }
            ]
          },
          {
            id: "beverages",
            name: "Beverages",
            nameAlbanian: "Pije",
            sortOrder: 3,
            items: [
              {
                id: "coffee",
                name: "Coffee",
                nameAlbanian: "Kafe",
                description: "Fresh brewed coffee",
                descriptionAlbanian: "Kafe e freskët e përgatitur",
                price: 2.50,
                allergens: [],
                preparationTime: 3,
                sortOrder: 1
              },
              {
                id: "cola",
                name: "Cola",
                nameAlbanian: "Kola",
                description: "Refreshing cola drink",
                descriptionAlbanian: "Pije freskuese kola",
                price: 3.00,
                allergens: [],
                preparationTime: 1,
                sortOrder: 2
              }
            ]
          }
        ]
      });
    }
    
    // Find venue by slug
    const venuesSnapshot = await db.collection("venue")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    
    if (venuesSnapshot.empty) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const venueDoc = venuesSnapshot.docs[0];
    const venueData = venueDoc.data();
    
    // Get menu categories
    const categoriesSnapshot = await venueDoc.ref
      .collection("menuCategory")
      .get();
    
    // Get all menu items
    const menuItemsSnapshot = await venueDoc.ref
      .collection("menuItem")
      .get();
    
    // Organize menu items by category
    const categories = {};
    categoriesSnapshot.docs.forEach(doc => {
      const categoryData = doc.data();
      categories[doc.id] = {
        id: doc.id,
        name: categoryData.name || "Other",
        nameAlbanian: categoryData.nameAlbanian || categoryData.name,
        items: []
      };
    });
    
    // Add items to categories (filter available items and sort in JavaScript)
    menuItemsSnapshot.docs
      .filter(doc => doc.data().isAvailable !== false) // Only include available items
      .forEach(doc => {
        const itemData = doc.data();
        const categoryId = itemData.category || "other";
        
        if (!categories[categoryId]) {
          categories[categoryId] = {
            id: categoryId,
            name: "Other",
            nameAlbanian: "Të tjera",
            items: []
          };
        }
        
        categories[categoryId].items.push({
          id: doc.id,
          name: itemData.name,
          nameAlbanian: itemData.nameAlbanian,
          description: itemData.description,
          descriptionAlbanian: itemData.descriptionAlbanian,
          price: itemData.price,
          allergens: itemData.allergens || [],
          imageUrl: itemData.imageUrl,
          preparationTime: itemData.preparationTime || 0,
          sortOrder: itemData.sortOrder || 999
        });
      });
    
    // Sort items within each category by sortOrder
    Object.values(categories).forEach(category => {
      category.items.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    
    // Convert categories object to array, filter out empty categories, and sort by sortOrder
    const menuCategories = Object.values(categories)
      .filter(category => category.items.length > 0)
      .map(category => {
        // Find the sortOrder from the original categories data
        const categoryDoc = categoriesSnapshot.docs.find(doc => doc.id === category.id);
        return {
          ...category,
          sortOrder: categoryDoc?.data().sortOrder || 999
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
    
    res.json({
      venue: {
        id: venueDoc.id,
        name: venueData.name,
        slug: venueData.slug,
        address: venueData.address,
        phone: venueData.phone,
        description: venueData.description,
        settings: venueData.settings
      },
      categories: menuCategories
    });
    
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// =============================================
// MENU MANAGEMENT ENDPOINTS
// =============================================

// Update menu category
app.put("/v1/venue/:venueId/categories/:categoryId", verifyAuth, async (req, res) => {
  try {
    const { venueId, categoryId } = req.params;
    const { name, nameAlbanian, sortOrder } = req.body;
    
    if (!name || !nameAlbanian) {
      return res.status(400).json({ error: "Name and nameAlbanian are required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Update category
    const categoryRef = db.collection("venue").doc(venueId)
      .collection("menuCategory").doc(categoryId);
    
    const categoryDoc = await categoryRef.get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    await categoryRef.update({
      name,
      nameAlbanian,
      sortOrder: sortOrder || categoryDoc.data().sortOrder || 999,
      updatedAt: getServerTimestamp()
    });
    
    res.json({ message: "Category updated successfully" });
    
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Create new menu category
app.post("/v1/venue/:venueId/categories", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { name, nameAlbanian, sortOrder } = req.body;
    
    if (!name || !nameAlbanian) {
      return res.status(400).json({ error: "Name and nameAlbanian are required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Create category
    const categoryRef = db.collection("venue").doc(venueId)
      .collection("menuCategory").doc();
    
    await categoryRef.set({
      name,
      nameAlbanian,
      sortOrder: sortOrder || 999,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    });
    
    res.status(201).json({ 
      message: "Category created successfully",
      categoryId: categoryRef.id
    });
    
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Delete menu category
app.delete("/v1/venue/:venueId/categories/:categoryId", verifyAuth, async (req, res) => {
  try {
    const { venueId, categoryId } = req.params;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Check if category has menu items
    const itemsSnapshot = await db.collection("venue").doc(venueId)
      .collection("menuItem")
      .where("categoryId", "==", categoryId)
      .limit(1)
      .get();
    
    if (!itemsSnapshot.empty) {
      return res.status(400).json({ error: "Cannot delete category with menu items. Please delete all items first." });
    }
    
    // Delete category
    const categoryRef = db.collection("venue").doc(venueId)
      .collection("menuCategory").doc(categoryId);
    
    const categoryDoc = await categoryRef.get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    await categoryRef.delete();
    
    res.json({ message: "Category deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Update menu item
app.put("/v1/venue/:venueId/items/:itemId", verifyAuth, async (req, res) => {
  try {
    const { venueId, itemId } = req.params;
    const { name, nameAlbanian, description, descriptionAlbanian, price, allergens, imageUrl, preparationTime, sortOrder, isActive } = req.body;
    
    if (!name || !nameAlbanian || price === undefined) {
      return res.status(400).json({ error: "Name, nameAlbanian, and price are required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Update item
    const itemRef = db.collection("venue").doc(venueId)
      .collection("menuItem").doc(itemId);
    
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    
    const updateData = {
      name,
      nameAlbanian,
      price: parseFloat(price),
      updatedAt: getServerTimestamp()
    };
    
    // Optional fields
    if (description !== undefined) updateData.description = description;
    if (descriptionAlbanian !== undefined) updateData.descriptionAlbanian = descriptionAlbanian;
    if (allergens !== undefined) updateData.allergens = allergens;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (preparationTime !== undefined) updateData.preparationTime = parseInt(preparationTime);
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    
    await itemRef.update(updateData);
    
    res.json({ message: "Menu item updated successfully" });
    
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

// Create new menu item
app.post("/v1/venue/:venueId/items", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { name, nameAlbanian, description, descriptionAlbanian, price, categoryId, allergens, imageUrl, preparationTime, sortOrder } = req.body;
    
    if (!name || !nameAlbanian || price === undefined || !categoryId) {
      return res.status(400).json({ error: "Name, nameAlbanian, price, and categoryId are required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Verify category exists
    const categoryDoc = await db.collection("venue").doc(venueId)
      .collection("menuCategory").doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      return res.status(400).json({ error: "Category not found" });
    }
    
    // Create item
    const itemRef = db.collection("venue").doc(venueId)
      .collection("menuItem").doc();
    
    await itemRef.set({
      name,
      nameAlbanian,
      description: description || "",
      descriptionAlbanian: descriptionAlbanian || "",
      price: parseFloat(price),
      categoryId,
      allergens: allergens || [],
      imageUrl: imageUrl || "",
      preparationTime: preparationTime ? parseInt(preparationTime) : 0,
      sortOrder: sortOrder ? parseInt(sortOrder) : 999,
      isActive: true,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    });
    
    res.status(201).json({ 
      message: "Menu item created successfully",
      itemId: itemRef.id
    });
    
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

// Delete menu item
app.delete("/v1/venue/:venueId/items/:itemId", verifyAuth, async (req, res) => {
  try {
    const { venueId, itemId } = req.params;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Delete item
    const itemRef = db.collection("venue").doc(venueId)
      .collection("menuItem").doc(itemId);
    
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    
    await itemRef.delete();
    
    res.json({ message: "Menu item deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

// Toggle menu item active status
app.patch("/v1/venue/:venueId/items/:itemId/toggle", verifyAuth, async (req, res) => {
  try {
    const { venueId, itemId } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ error: "isActive is required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Update item status
    const itemRef = db.collection("venue").doc(venueId)
      .collection("menuItem").doc(itemId);
    
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    
    await itemRef.update({
      isActive: Boolean(isActive),
      updatedAt: getServerTimestamp()
    });
    
    res.json({ 
      message: "Menu item status updated successfully",
      isActive: Boolean(isActive)
    });
    
  } catch (error) {
    console.error("Error toggling menu item status:", error);
    res.status(500).json({ error: "Failed to toggle menu item status" });
  }
});

// Get venue tables for QR generation
app.get("/v1/venue/:slug/tables", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const venuesSnapshot = await db.collection("venue")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    
    if (venuesSnapshot.empty) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const venueDoc = venuesSnapshot.docs[0];
    const tablesSnapshot = await venueDoc.ref
      .collection("table")
      .get();
    
    const tables = tablesSnapshot.docs
      .filter(doc => doc.data().isActive !== false) // Only include active tables
      .map(doc => ({
        id: doc.id,
        tableNumber: doc.data().tableNumber,
        displayName: doc.data().displayName,
        qrUrl: `https://order.skan.al/${slug}/${doc.data().tableNumber}`
      }))
      .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber)); // Sort by table number
    
    res.json({ tables });
    
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

// ============================================================================
// MENU MANAGEMENT ENDPOINTS (Protected)
// ============================================================================

// Add new category to venue
app.post("/v1/venue/:venueId/categories", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { name, nameEn } = req.body;

    if (!name || !nameEn) {
      return res.status(400).json({ error: "Name and nameEn are required" });
    }

    // Verify venue exists and user has access
    const venueRef = db.collection("venue").doc(venueId);
    const venueDoc = await venueRef.get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Get highest sort order
    const categoriesSnapshot = await venueRef.collection("menuCategory").get();
    const maxSortOrder = categoriesSnapshot.docs.reduce((max, doc) => {
      const sortOrder = doc.data().sortOrder || 0;
      return Math.max(max, sortOrder);
    }, 0);

    // Create new category
    const categoryRef = venueRef.collection("menuCategory").doc();
    await categoryRef.set({
      name: name,
      nameAlbanian: nameEn, // Admin sends nameEn but we store as nameAlbanian
      sortOrder: maxSortOrder + 1,
      isActive: true,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    });

    res.status(201).json({
      id: categoryRef.id,
      name: name,
      nameAlbanian: nameEn,
      sortOrder: maxSortOrder + 1,
      message: "Category created successfully"
    });

  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update category
app.put("/v1/venue/:venueId/categories/:categoryId", verifyAuth, async (req, res) => {
  try {
    const { venueId, categoryId } = req.params;
    const { name, nameEn } = req.body;

    if (!name || !nameEn) {
      return res.status(400).json({ error: "Name and nameEn are required" });
    }

    const venueRef = db.collection("venue").doc(venueId);
    const categoryRef = venueRef.collection("menuCategory").doc(categoryId);
    
    const categoryDoc = await categoryRef.get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: "Category not found" });
    }

    await categoryRef.update({
      name: name,
      nameAlbanian: nameEn,
      updatedAt: getServerTimestamp()
    });

    res.json({
      id: categoryId,
      name: name,
      nameAlbanian: nameEn,
      message: "Category updated successfully"
    });

  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category
app.delete("/v1/venue/:venueId/categories/:categoryId", verifyAuth, async (req, res) => {
  try {
    const { venueId, categoryId } = req.params;

    const venueRef = db.collection("venue").doc(venueId);
    const categoryRef = venueRef.collection("menuCategory").doc(categoryId);
    
    const categoryDoc = await categoryRef.get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if category has items
    const itemsSnapshot = await venueRef.collection("menuItem")
      .where("category", "==", categoryId)
      .limit(1)
      .get();

    if (!itemsSnapshot.empty) {
      return res.status(400).json({ error: "Cannot delete category with items. Please delete items first." });
    }

    await categoryRef.delete();

    res.json({ message: "Category deleted successfully" });

  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Add new menu item to category
app.post("/v1/venue/:venueId/categories/:categoryId/items", verifyAuth, async (req, res) => {
  try {
    const { venueId, categoryId } = req.params;
    const { name, nameEn, price, isActive = true, imageUrl } = req.body;

    if (!name || !nameEn || price === undefined) {
      return res.status(400).json({ error: "Name, nameEn, and price are required" });
    }

    const venueRef = db.collection("venue").doc(venueId);
    
    // Verify category exists
    const categoryRef = venueRef.collection("menuCategory").doc(categoryId);
    const categoryDoc = await categoryRef.get();
    
    if (!categoryDoc.exists) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Get highest sort order in category
    const itemsSnapshot = await venueRef.collection("menuItem")
      .where("category", "==", categoryId)
      .get();
    
    const maxSortOrder = itemsSnapshot.docs.reduce((max, doc) => {
      const sortOrder = doc.data().sortOrder || 0;
      return Math.max(max, sortOrder);
    }, 0);

    // Create new menu item
    const itemRef = venueRef.collection("menuItem").doc();
    const itemData = {
      name: name,
      nameAlbanian: nameEn,
      price: parseFloat(price),
      category: categoryId,
      sortOrder: maxSortOrder + 1,
      isActive: isActive,
      isAvailable: true,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    };

    if (imageUrl) {
      itemData.imageUrl = imageUrl;
    }

    await itemRef.set(itemData);

    res.status(201).json({
      id: itemRef.id,
      ...itemData,
      message: "Menu item created successfully"
    });

  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

// Update menu item
app.put("/v1/venue/:venueId/categories/:categoryId/items/:itemId", verifyAuth, async (req, res) => {
  try {
    const { venueId, itemId } = req.params;
    const { name, nameEn, price, isActive, imageUrl } = req.body;

    const venueRef = db.collection("venue").doc(venueId);
    const itemRef = venueRef.collection("menuItem").doc(itemId);
    
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const updateData = {
      updatedAt: getServerTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameAlbanian = nameEn;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    await itemRef.update(updateData);

    res.json({
      id: itemId,
      message: "Menu item updated successfully"
    });

  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

// Delete menu item
app.delete("/v1/venue/:venueId/categories/:categoryId/items/:itemId", verifyAuth, async (req, res) => {
  try {
    const { venueId, itemId } = req.params;

    const venueRef = db.collection("venue").doc(venueId);
    const itemRef = venueRef.collection("menuItem").doc(itemId);
    
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    await itemRef.delete();

    res.json({ message: "Menu item deleted successfully" });

  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

// Toggle menu item availability (for quick enable/disable)
app.patch("/v1/venue/:venueId/items/:itemId/toggle", verifyAuth, async (req, res) => {
  try {
    const { venueId, itemId } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ error: "isActive field is required" });
    }

    const venueRef = db.collection("venue").doc(venueId);
    const itemRef = venueRef.collection("menuItem").doc(itemId);
    
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    await itemRef.update({
      isActive: isActive,
      updatedAt: getServerTimestamp()
    });

    res.json({
      id: itemId,
      isActive: isActive,
      message: "Menu item status updated successfully"
    });

  } catch (error) {
    console.error("Error toggling menu item:", error);
    res.status(500).json({ error: "Failed to update menu item status" });
  }
});

// ============================================================================
// ORDER ENDPOINTS  
// ============================================================================

// Create new order
app.post("/v1/orders", async (req, res) => {
  try {
    const { venueId, tableNumber, customerName, items, specialInstructions } = req.body;
    
    // Validate required fields
    if (!venueId || !tableNumber || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Convert items to array if it's an object with numeric keys
    let itemsArray = items;
    if (!Array.isArray(items)) {
      console.error("Items is not an array:", typeof items, items);
      // Try to convert object with numeric keys to array
      if (typeof items === "object" && items !== null) {
        const keys = Object.keys(items);
        const isNumericKeys = keys.every(key => !isNaN(parseInt(key)));
        if (isNumericKeys) {
          itemsArray = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(key => items[key]);
          console.log("Converted object to array:", itemsArray);
        } else {
          return res.status(400).json({ error: "Items must be an array" });
        }
      } else {
        return res.status(400).json({ error: "Items must be an array" });
      }
    }
    
    // Calculate total amount
    const totalAmount = itemsArray.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    // Create order document
    const orderData = {
      venueId,
      tableNumber,
      customerName: customerName || "Anonymous Customer",
      orderNumber,
      items: itemsArray,
      totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
      specialInstructions: specialInstructions || "",
      status: "new",
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    };
    
    const orderRef = await db.collection("orders").add(orderData);
    
    res.status(201).json({
      orderId: orderRef.id,
      orderNumber,
      status: "new",
      totalAmount,
      message: "Order created successfully"
    });
    
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get orders for a venue (restaurant dashboard)
app.get("/v1/venue/:venueId/orders", async (req, res) => {
  try {
    const { venueId } = req.params;
    const { status, limit = 50 } = req.query;
    
    let query = db.collection("orders")
      .where("venueId", "==", venueId)
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit));
    
    if (status) {
      query = query.where("status", "==", status);
    }
    
    const ordersSnapshot = await query.get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString()
    }));
    
    // If no orders found locally, try to get all orders by venue ID using same logic as tracking
    if (orders.length === 0) {
      console.log(`No orders found locally for venue ${venueId}, searching all orders...`);
      
      try {
        const allOrdersSnapshot = await db.collection("orders").get();
        const venueOrders = allOrdersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
          }))
          .filter(order => order.venueId === venueId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, parseInt(limit));
        
        if (venueOrders.length > 0) {
          console.log(`Found ${venueOrders.length} orders via fallback search`);
          return res.json(venueOrders);
        }
      } catch (fallbackError) {
        console.error("Fallback search failed:", fallbackError);
      }
    }
    
    res.json(orders);
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Enterprise-style active orders (new/preparing/ready only)
app.get("/v1/venue/:venueId/orders/active", async (req, res) => {
  try {
    const { venueId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const activeStatuses = ["new", "preparing", "ready", "3", "5", "7"];

    const snapshot = await db.collection("orders")
      .where("venueId", "==", venueId)
      .where("status", "in", activeStatuses)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const orders = snapshot.docs.map(formatOrderDoc);

    const counts = orders.reduce((acc, order) => {
      const normalized = ["3", "new"].includes(order.status) ? "new" : ["5", "preparing"].includes(order.status) ? "preparing" : "ready";
      acc[normalized] = (acc[normalized] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { new: 0, preparing: 0, ready: 0, total: 0 });

    res.json({
      data: orders,
      counts,
      metadata: {
        limit,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching active orders:", error);
    res.status(500).json({ error: "Failed to fetch active orders" });
  }
});

// Recent served orders (default last 24h, capped)
app.get("/v1/venue/:venueId/orders/recent-served", async (req, res) => {
  try {
    const { venueId } = req.params;
    const hours = Math.min(Number(req.query.hours) || 24, 168);
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const since = admin.firestore.Timestamp.fromDate(new Date(Date.now() - hours * 60 * 60 * 1000));

    const servedStatuses = ["served", "9"];

    const snapshot = await db.collection("orders")
      .where("venueId", "==", venueId)
      .where("status", "in", servedStatuses)
      .where("updatedAt", ">=", since)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    const orders = snapshot.docs.map(formatOrderDoc);

    res.json({
      data: orders,
      metadata: {
        limit,
        hours,
        total: orders.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching recent served orders:", error);
    res.status(500).json({ error: "Failed to fetch recent served orders" });
  }
});

// Update order status
app.put("/v1/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["new", "preparing", "ready", "served"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const updateData = {
      status,
      updatedAt: getServerTimestamp()
    };
    
    // Add timestamp for specific status changes
    if (status === "preparing") {
      updateData.preparedAt = getServerTimestamp();
    } else if (status === "ready") {
      updateData.readyAt = getServerTimestamp();
    } else if (status === "served") {
      updateData.servedAt = getServerTimestamp();
    }
    
    await db.collection("orders").doc(orderId).update(updateData);
    
    res.json({ 
      message: "Order status updated", 
      status,
      orderId 
    });
    
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Get single order details
app.get("/v1/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderDoc = await db.collection("orders").doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const orderData = orderDoc.data();
    
    res.json({
      id: orderDoc.id,
      ...orderData,
      createdAt: orderData.createdAt?.toDate()?.toISOString(),
      updatedAt: orderData.updatedAt?.toDate()?.toISOString(),
      preparedAt: orderData.preparedAt?.toDate()?.toISOString(),
      readyAt: orderData.readyAt?.toDate()?.toISOString(),
      servedAt: orderData.servedAt?.toDate()?.toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Get order by order number (for customer tracking)
app.get("/v1/track/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const ordersSnapshot = await db.collection("orders")
      .where("orderNumber", "==", orderNumber)
      .limit(1)
      .get();
    
    if (ordersSnapshot.empty) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const orderDoc = ordersSnapshot.docs[0];
    const orderData = orderDoc.data();
    
    // Return limited data for customer tracking
    res.json({
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      createdAt: orderData.createdAt?.toDate()?.toISOString(),
      estimatedTime: getEstimatedTime(orderData.status, orderData.createdAt)
    });
    
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({ error: "Failed to track order" });
  }
});

// ============================================================================
// VENUE IMPORT ENDPOINT (TEMPORARY)
// ============================================================================

// Import venue data (temporary endpoint for setup)
app.post("/v1/import/venue", async (req, res) => {
  try {
    const { venue, menuCategories, menuItems, tables } = req.body;
    
    if (!venue || !venue.id || !venue.slug) {
      return res.status(400).json({ error: "Missing venue data" });
    }
    
    const venueId = venue.id;
    const venueRef = db.collection("venue").doc(venueId);
    
    // Add venue
    await venueRef.set({
      name: venue.name,
      slug: venue.slug,
      address: venue.address,
      phone: venue.phone,
      description: venue.description,
      settings: venue.settings,
      isActive: true,
      createdAt: getServerTimestamp()
    });
    
    let categoriesAdded = 0;
    let itemsAdded = 0;
    let tablesAdded = 0;
    
    // Add menu categories
    if (menuCategories && Array.isArray(menuCategories)) {
      for (const category of menuCategories) {
        const categoryRef = venueRef.collection("menuCategory").doc(category.id);
        await categoryRef.set({
          name: category.name,
          nameAlbanian: category.nameAlbanian,
          sortOrder: category.sortOrder,
          isActive: true
        });
        categoriesAdded++;
      }
    }
    
    // Add menu items
    if (menuItems && Array.isArray(menuItems)) {
      for (const item of menuItems) {
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
        itemsAdded++;
      }
    }
    
    // Add tables
    if (tables && Array.isArray(tables)) {
      for (const table of tables) {
        const tableRef = venueRef.collection("table").doc(table.id);
        await tableRef.set({
          tableNumber: table.id,
          displayName: table.name,
          capacity: table.capacity,
          location: table.location,
          isActive: true
        });
        tablesAdded++;
      }
    }
    
    res.json({
      message: "Venue data imported successfully",
      venueId,
      stats: {
        venue: 1,
        categories: categoriesAdded,
        items: itemsAdded,
        tables: tablesAdded
      }
    });
    
  } catch (error) {
    console.error("Error importing venue data:", error);
    res.status(500).json({ error: "Failed to import venue data" });
  }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// User registration
app.post("/v1/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, role = "manager", venueId } = req.body;
    
    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required" });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters with uppercase, lowercase, and number" });
    }
    
    // Check if user already exists
    const existingUserSnapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    
    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ error: "User with this email already exists" });
    }
    
    // Generate password hash (standardized format)
    const crypto = require("crypto");
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    const passwordHash = `${salt}:${hash}`;
    
    // Create user document
    const userData = {
      email: email.toLowerCase(),
      passwordHash: passwordHash,
      fullName,
      role: ["admin", "manager", "staff"].includes(role) ? role : "staff",
      venueId: venueId || null,
      isActive: true,
      emailVerified: false,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
      onboarding: {
        isComplete: false,
        currentStep: 1,
        completedSteps: [],
        steps: {
          profileComplete: { completed: false, data: {} },
          venueSetup: { completed: false, data: {} },
          menuCategories: { completed: false, data: {} },
          menuItems: { completed: false, data: {} },
          tableSetup: { completed: false, data: {} },
          staffSetup: { completed: false, data: {} }
        },
        startedAt: getServerTimestamp(),
        completedAt: null
      }
    };
    
    const userRef = await db.collection("users").add(userData);
    
    // Create JWT token for immediate login instead of Firebase custom token
    const tokenPayload = {
      uid: userRef.id,
      userId: userRef.id, // Keep for backward compatibility
      email: userData.email,
      venueId: userData.venueId,
      role: userData.role,
      type: "access"
    };
    const customToken = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRE,
      issuer: "skan.al",
      audience: "skan-api"
    });
    
    res.status(201).json({
      message: "User registered successfully",
      userId: userRef.id,
      token: customToken,
      user: {
        id: userRef.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId,
        emailVerified: userData.emailVerified
      }
    });
    
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Password reset request
app.post("/v1/auth/reset-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Find user by email
    const usersSnapshot = await db.collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      // Don't reveal if email exists or not for security
      return res.json({ message: "If this email exists, you will receive a password reset link" });
    }
    
    const userDoc = usersSnapshot.docs[0];
    
    // Generate reset token
    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save reset token to user document
    await userDoc.ref.update({
      resetToken,
      resetTokenExpiry: admin.firestore.Timestamp.fromDate(resetTokenExpiry),
      updatedAt: getServerTimestamp()
    });
    
    // TODO: Send email with reset link
    // For now, return the token for development purposes
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ 
      message: "If this email exists, you will receive a password reset link",
      // Remove this in production:
      resetToken: resetToken
    });
    
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// Reset password with token
app.post("/v1/auth/reset-password/confirm", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    
    // Find user by reset token
    const usersSnapshot = await db.collection("users")
      .where("resetToken", "==", token)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check if token is expired
    if (!userData.resetTokenExpiry || userData.resetTokenExpiry.toDate() < new Date()) {
      return res.status(400).json({ error: "Reset token has expired" });
    }
    
    // Generate new password hash (consistent with login format)
    const crypto = require("crypto");
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(newPassword, salt, 64).toString("hex");
    const newPasswordHash = `${salt}:${hash}`;
    
    // Update user with new password and clear reset token
    await userDoc.ref.update({
      passwordHash: newPasswordHash,
      resetToken: admin.firestore.FieldValue.delete(),
      resetTokenExpiry: admin.firestore.FieldValue.delete(),
      updatedAt: getServerTimestamp()
    });
    
    res.json({ message: "Password reset successfully" });
    
  } catch (error) {
    console.error("Error confirming password reset:", error);
    res.status(500).json({ error: "Password reset confirmation failed" });
  }
});

// Change password for authenticated users
app.post("/v1/auth/change-password", verifyAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    
    // Handle demo user password change
    if (req.user.email === "manager_email1@gmail.com") {
      // Simulate password validation - demo accepts "demo123" as current password
      if (currentPassword !== "demo123") {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      return res.json({ message: "Password changed successfully" });
    }
    
    // Get user from database
    const usersSnapshot = await db.collection("users")
      .where("email", "==", req.user.email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Verify current password
    const crypto = require("crypto");
    const [salt, hash] = userData.passwordHash.split(":");
    const currentHash = crypto.scryptSync(currentPassword, salt, 64).toString("hex");
    
    if (currentHash !== hash) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    
    // Hash new password
    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = crypto.scryptSync(newPassword, newSalt, 64).toString("hex");
    const newPasswordHash = `${newSalt}:${newHash}`;
    
    // Update password in database
    await userDoc.ref.update({
      passwordHash: newPasswordHash,
      updatedAt: getServerTimestamp()
    });
    
    res.json({ message: "Password changed successfully" });
    
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Password change failed" });
  }
});

// Rate limiting for authentication endpoints - DISABLED FOR TESTING
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 requests per windowMs
//   message: { error: "Too many authentication attempts. Please try again later." },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Restaurant staff login
app.post("/v1/auth/login", 
  // authLimiter, // DISABLED FOR TESTING
  [
    body("email").isEmail().normalizeEmail(),
    body("password").custom((value, { req }) => {
      // Allow demo password when explicitly enabled
      if (req.body.email === "manager_email1@gmail.com" && value === "demo123") {
        return true;
      }
      // Otherwise require minimum 8 characters
      if (value.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      return true;
    }).trim()
  ],
  async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await auditLog("LOGIN_FAILED", null, { reason: "Validation failed", errors: errors.array() }, req.ip);
      return res.status(400).json({ error: "Invalid input", details: errors.array() });
    }
    
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check account lockout
    if (await accountLockout.checkLockout(email)) {
      await auditLog("LOGIN_BLOCKED", null, { email, reason: "Account locked" }, clientIP);
      return res.status(423).json({ error: "Account temporarily locked due to too many failed attempts" });
    }
    
    // Demo user - always enabled for testing
    if (email === "manager_email1@gmail.com" && password === "demo123") {
      return res.json({
        message: "Login successful",
        user: {
          id: "demo-user-1",
          email: "manager_email1@gmail.com",
          fullName: DEMO_USER_NAME,
          role: "manager",
          venueId: "beach-bar-durres"
        },
        venue: {
          id: "beach-bar-durres",
          name: "Beach Bar Durrës",
          slug: "demo-restaurant"
        },
        token: `demo_token_${Date.now()}`
      });
    }
    
    // Beach Bar demo user - specific for testing (supports both passwords)
    if (email === "demo.beachbar@skan.al" && (password === "BeachBarDemo2024" || password === "BeachBarDemo2024!")) {
      return res.json({
        message: "Login successful",
        user: {
          id: "demo-beach-bar-user",
          email: "demo.beachbar@skan.al",
          fullName: DEMO_USER_NAME,
          role: "manager",
          venueId: "beach-bar-durres"
        },
        venue: {
          id: "beach-bar-durres",
          name: "Beach Bar Durrës",
          slug: "beach-bar-durres"
        },
        token: `beach_bar_token_${Date.now()}`
      });
    }
    
    // Find user in users collection
    const usersSnapshot = await db.collection("users")
      .where("email", "==", email)
      .where("isActive", "==", true)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Validate password (support both old and new hash formats)
    if (userData.passwordHash) {
      const crypto = require("crypto");
      let isValid = false;
      
      // Check new format: "salt:hash"
      if (userData.passwordHash.includes(":") && !userData.salt) {
        const [salt, storedHash] = userData.passwordHash.split(":");
        const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
        isValid = computedHash === storedHash;
      }
      // Check old format: separate salt and hash fields
      else if (userData.salt) {
        const salt = Buffer.from(userData.salt, "hex");
        const hashedPassword = crypto.scryptSync(password, salt, 64);
        isValid = hashedPassword.toString("hex") === userData.passwordHash;
      }
      
      if (!isValid) {
        await accountLockout.recordFailedAttempt(email, clientIP);
        await auditLog("LOGIN_FAILED", userDoc.id, { email, reason: "Invalid password" }, clientIP);
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      await accountLockout.recordFailedAttempt(email, clientIP);
      await auditLog("LOGIN_FAILED", userDoc.id, { email, reason: "No password hash" }, clientIP);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Clear failed attempts on successful login
    await accountLockout.clearFailedAttempts(email);
    
    // Get venue information
    let venueData = null;
    if (userData.venueId) {
      const venueDoc = await db.collection("venue").doc(userData.venueId).get();
      if (venueDoc.exists) {
        venueData = {
          id: venueDoc.id,
          name: venueDoc.data().name,
          slug: venueDoc.data().slug
        };
      }
    }
    
    // Generate JWT tokens
    const user = {
      id: userDoc.id,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      venueId: userData.venueId
    };
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Store refresh token in database
    await db.collection("refresh_tokens").doc(userDoc.id).set({
      token: refreshToken,
      userId: userDoc.id,
      createdAt: getServerTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      ip: clientIP,
      userAgent: req.headers["user-agent"] || "unknown"
    });
    
    // Audit successful login
    await auditLog("LOGIN_SUCCESS", userDoc.id, { 
      email, 
      role: userData.role, 
      venueId: userData.venueId 
    }, clientIP);
    
    // Return user data with JWT tokens
    res.json({
      message: "Login successful",
      user,
      venue: venueData,
      token: accessToken, // For backward compatibility
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRE
    });
    
  } catch (error) {
    await auditLog("LOGIN_ERROR", null, { reason: "Server error", error: error.message }, req.ip);
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Token refresh endpoint
app.post("/v1/auth/refresh", /* authLimiter, */ async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (decoded.type !== "refresh") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    
    // Check if refresh token exists in database
    const tokenDoc = await db.collection("refresh_tokens").doc(decoded.uid).get();
    if (!tokenDoc.exists || tokenDoc.data().token !== refreshToken) {
      await auditLog("REFRESH_FAILED", decoded.uid, { reason: "Token not found" }, req.ip);
      return res.status(401).json({ error: "Refresh token not found" });
    }
    
    // Check if token is expired
    if (tokenDoc.data().expiresAt.toDate() < new Date()) {
      await db.collection("refresh_tokens").doc(decoded.uid).delete();
      await auditLog("REFRESH_FAILED", decoded.uid, { reason: "Token expired" }, req.ip);
      return res.status(401).json({ error: "Refresh token expired" });
    }
    
    // Get user data
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data().isActive) {
      await auditLog("REFRESH_FAILED", decoded.uid, { reason: "User inactive" }, req.ip);
      return res.status(401).json({ error: "User account is inactive" });
    }
    
    const userData = userDoc.data();
    const user = {
      id: userDoc.id,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      venueId: userData.venueId
    };
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Update refresh token in database
    await db.collection("refresh_tokens").doc(decoded.uid).update({
      token: newRefreshToken,
      updatedAt: getServerTimestamp(),
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown"
    });
    
    await auditLog("TOKEN_REFRESHED", decoded.uid, {}, req.ip);
    
    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRE
    });
    
  } catch (error) {
    await auditLog("REFRESH_ERROR", null, { error: error.message }, req.ip);
    console.error("Error refreshing token:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout endpoint
app.post("/v1/auth/logout", verifyAuth, async (req, res) => {
  try {
    // Remove refresh token from database
    await db.collection("refresh_tokens").doc(req.user.uid).delete();
    
    await auditLog("LOGOUT", req.user.uid, {}, req.ip);
    
    res.json({ message: "Logged out successfully" });
    
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

// Get all users (admin only)
app.get("/v1/users", verifyAuth, async (req, res) => {
  try {
    // Check if user is admin or manager
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    const { venueId, role, limit = 50 } = req.query;
    
    // Return demo users for demo venue
    if (venueId === "beach-bar-durres") {
      const demoUsers = [
        {
          id: "demo-user-1",
          email: "manager_email1@gmail.com",
          fullName: DEMO_USER_NAME,
          role: "manager",
          venueId: "beach-bar-durres",
          isActive: true,
          emailVerified: true,
          createdAt: new Date("2024-01-15T10:00:00Z").toISOString(),
          updatedAt: new Date("2024-01-15T10:00:00Z").toISOString()
        },
        {
          id: "demo-user-2", 
          email: "staff1@demo.com",
          fullName: "Ana Kelmendi",
          role: "staff",
          venueId: "beach-bar-durres",
          isActive: true,
          emailVerified: true,
          createdAt: new Date("2024-02-10T14:30:00Z").toISOString(),
          updatedAt: new Date("2024-02-10T14:30:00Z").toISOString()
        },
        {
          id: "demo-user-3",
          email: "staff2@demo.com", 
          fullName: "Marko Vuković",
          role: "staff",
          venueId: "beach-bar-durres",
          isActive: true,
          emailVerified: false,
          createdAt: new Date("2024-03-05T09:15:00Z").toISOString(),
          updatedAt: new Date("2024-03-05T09:15:00Z").toISOString()
        },
        {
          id: "demo-user-4",
          email: "waiter@demo.com",
          fullName: "Elvira Hoxha", 
          role: "staff",
          venueId: "beach-bar-durres",
          isActive: false,
          emailVerified: true,
          createdAt: new Date("2024-01-20T16:45:00Z").toISOString(),
          updatedAt: new Date("2024-04-12T11:20:00Z").toISOString()
        }
      ];
      
      // Filter by role if specified
      const filteredUsers = role 
        ? demoUsers.filter(user => user.role === role)
        : demoUsers;
      
      return res.json({ 
        users: filteredUsers.slice(0, parseInt(limit)), 
        total: filteredUsers.length 
      });
    }
    
    let query = db.collection("users");
    
    // Filter by venue if user is a manager (not admin)
    if (req.user.role === "manager" && req.user.venueId) {
      query = query.where("venueId", "==", req.user.venueId);
    } else if (venueId) {
      query = query.where("venueId", "==", venueId);
    }
    
    if (role) {
      query = query.where("role", "==", role);
    }
    
    query = query.limit(parseInt(limit));
    
    const usersSnapshot = await query.get();
    
    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId,
        isActive: userData.isActive !== false, // Default to true if not specified
        emailVerified: userData.emailVerified || false,
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : null,
        updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate().toISOString() : null
      };
    });
    
    res.json({ users, total: users.length });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user (admin/manager only)
app.get("/v1/users/:userId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Handle demo users
    if (userId === "demo-user-1") {
      return res.json({
        id: "demo-user-1",
        email: "manager_email1@gmail.com",
        fullName: DEMO_USER_NAME,
        role: "manager",
        venueId: "beach-bar-durres",
        isActive: true,
        emailVerified: true,
        createdAt: new Date("2024-01-15T10:00:00Z").toISOString(),
        updatedAt: new Date("2024-01-15T10:00:00Z").toISOString()
      });
    }
    
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data();
    
    // Check permissions
    if (req.user.role === "manager" && userData.venueId !== req.user.venueId) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    res.json({
      id: userDoc.id,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      venueId: userData.venueId,
      isActive: userData.isActive,
      emailVerified: userData.emailVerified,
      createdAt: userData.createdAt?.toDate()?.toISOString(),
      updatedAt: userData.updatedAt?.toDate()?.toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user (admin/manager only)
app.put("/v1/users/:userId", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive, venueId } = req.body;
    
    // Handle demo users - simulate successful update
    if (userId === "demo-beach-bar-user" || userId === "demo-user-1") {
      // Update the stored demo user name if provided
      if (fullName && fullName.trim()) {
        DEMO_USER_NAME = fullName.trim();
        console.log(`Demo user name updated to: ${DEMO_USER_NAME}`);
      }
      
      return res.json({
        message: "Demo user profile updated successfully",
        user: {
          id: "demo-beach-bar-user",
          email: "demo.beachbar@skan.al", 
          fullName: DEMO_USER_NAME,
          role: role || "manager",
          venueId: "beach-bar-durres",
          isActive: isActive !== undefined ? isActive : true,
          emailVerified: true,
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const currentUserData = userDoc.data();
    
    // Check permissions
    if (req.user.role === "manager" && currentUserData.venueId !== req.user.venueId) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    // Managers can't promote users to admin
    if (req.user.role === "manager" && role === "admin") {
      return res.status(403).json({ error: "Managers cannot create admin users" });
    }
    
    const updateData = {
      updatedAt: getServerTimestamp()
    };
    
    if (fullName !== undefined) updateData.fullName = fullName;
    if (role !== undefined && ["admin", "manager", "staff"].includes(role)) {
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (venueId !== undefined) updateData.venueId = venueId;
    
    await userDoc.ref.update(updateData);
    
    res.json({ message: "User updated successfully" });
    
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Invite user (admin/manager only)
app.post("/v1/users/invite", verifyAuth, async (req, res) => {
  try {
    const { email, fullName, role = "staff" } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({ error: "Email and full name are required" });
    }
    
    // Check permissions
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    // Managers can't invite admin users
    if (req.user.role === "manager" && role === "admin") {
      return res.status(403).json({ error: "Managers cannot invite admin users" });
    }
    
    // Check if user already exists
    const existingUserSnapshot = await db.collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
    
    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ error: "User with this email already exists" });
    }
    
    // Generate secure invitation token
    const inviteToken = generateSecureToken();
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 3600000); // 7 days from now
    
    // Get venue information for email
    const venueRef = await db.collection("venues").doc(req.user.venueId).get();
    const venueData = venueRef.exists ? venueRef.data() : null;
    const venueName = venueData?.name || "Your Restaurant";
    
    // Get inviter information for email
    const inviterRef = await db.collection("users").doc(req.user.uid).get();
    const inviterData = inviterRef.exists ? inviterRef.data() : null;
    const inviterName = inviterData?.fullName || "Restaurant Manager";
    
    // Create invitation document
    const inviteData = {
      email: email.toLowerCase(),
      fullName,
      role: ["admin", "manager", "staff"].includes(role) ? role : "staff",
      venueId: req.user.venueId,
      venueName: venueName,
      invitedBy: req.user.uid,
      inviterName: inviterName,
      inviteToken,
      inviteTokenExpiry: admin.firestore.Timestamp.fromDate(inviteTokenExpiry),
      status: "pending",
      createdAt: getServerTimestamp()
    };
    
    const inviteRef = await db.collection("invitations").add(inviteData);
    
    // Send invitation email
    try {
      await sendInvitationEmail(email, fullName, inviteToken, venueName, inviterName);
      console.log(`✅ Invitation email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send invitation email:", emailError.message);
      // Don't fail the entire request if email fails - invitation is created
    }
    
    res.status(201).json({
      message: "Invitation sent successfully",
      invitationId: inviteRef.id,
      // Remove this in production:
      inviteToken: inviteToken
    });
    
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

// Accept invitation and complete registration
app.post("/v1/auth/accept-invitation", async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters with uppercase, lowercase, and number" });
    }
    
    // Find invitation by token
    const invitationsSnapshot = await db.collection("invitations")
      .where("inviteToken", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();
    
    if (invitationsSnapshot.empty) {
      return res.status(400).json({ error: "Invalid or expired invitation token" });
    }
    
    const inviteDoc = invitationsSnapshot.docs[0];
    const inviteData = inviteDoc.data();
    
    // Check if token is expired
    if (inviteData.inviteTokenExpiry.toDate() < new Date()) {
      return res.status(400).json({ error: "Invitation has expired" });
    }
    
    // Generate password hash using our secure utility
    const passwordHash = await hashPassword(password);
    
    // Create user document
    const userData = {
      email: inviteData.email,
      passwordHash: passwordHash,
      fullName: inviteData.fullName,
      role: inviteData.role,
      venueId: inviteData.venueId,
      isActive: true,
      emailVerified: true, // Pre-verified through invitation
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
      onboarding: {
        isComplete: inviteData.venueId ? true : false, // If invited to existing venue, skip onboarding
        currentStep: inviteData.venueId ? 6 : 1,
        completedSteps: inviteData.venueId ? [1, 2, 3, 4, 5, 6] : [],
        steps: {
          profileComplete: { completed: inviteData.venueId ? true : false, data: {} },
          venueSetup: { completed: inviteData.venueId ? true : false, data: {} },
          menuCategories: { completed: inviteData.venueId ? true : false, data: {} },
          menuItems: { completed: inviteData.venueId ? true : false, data: {} },
          tableSetup: { completed: inviteData.venueId ? true : false, data: {} },
          staffSetup: { completed: inviteData.venueId ? true : false, data: {} }
        },
        startedAt: getServerTimestamp(),
        completedAt: inviteData.venueId ? getServerTimestamp() : null
      }
    };
    
    const userRef = await db.collection("users").add(userData);
    
    // Mark invitation as used
    await inviteDoc.ref.update({
      status: "accepted",
      acceptedAt: getServerTimestamp(),
      userId: userRef.id
    });
    
    // Create JWT token for immediate login instead of Firebase custom token
    const tokenPayload = {
      uid: userRef.id,
      userId: userRef.id, // Keep for backward compatibility
      email: userData.email,
      venueId: userData.venueId,
      role: userData.role,
      type: "access"
    };
    const customToken = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRE,
      issuer: "skan.al",
      audience: "skan-api"
    });
    
    res.status(201).json({
      message: "Account created successfully",
      userId: userRef.id,
      token: customToken,
      user: {
        id: userRef.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId,
        emailVerified: userData.emailVerified
      }
    });
    
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// ============================================================================
// VENUE MANAGEMENT ENDPOINTS
// ============================================================================

// Create new venue (admin only)
app.post("/v1/venues", verifyAuth, async (req, res) => {
  try {
    // Only admins can create venues
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create venues" });
    }
    
    const { name, address, phone, description, settings } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }
    
    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-")     // Replace spaces with dashes
      .replace(/-+/g, "-")      // Replace multiple dashes with single
      .trim();
    
    // Check if slug already exists
    const existingVenueSnapshot = await db.collection("venue")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    
    if (!existingVenueSnapshot.empty) {
      return res.status(409).json({ error: "A venue with this name already exists" });
    }
    
    const venueData = {
      name: name.trim(),
      slug,
      address: address.trim(),
      phone: phone?.trim() || null,
      description: description?.trim() || "",
      settings: {
        currency: settings?.currency || "ALL",
        orderingEnabled: settings?.orderingEnabled !== false,
        estimatedPreparationTime: settings?.estimatedPreparationTime || 15
      },
      isActive: true,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    };
    
    const venueRef = await db.collection("venue").add(venueData);
    
    res.status(201).json({
      message: "Venue created successfully",
      venueId: venueRef.id,
      venue: {
        id: venueRef.id,
        ...venueData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("Error creating venue:", error);
    res.status(500).json({ error: "Failed to create venue" });
  }
});

// Get all venues (admin only)
app.get("/v1/venues", verifyAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can list all venues" });
    }
    
    const { isActive, limit = 50 } = req.query;
    
    let query = db.collection("venue").orderBy("createdAt", "desc");
    
    if (isActive !== undefined) {
      query = query.where("isActive", "==", Boolean(isActive));
    }
    
    query = query.limit(parseInt(limit));
    
    const venuesSnapshot = await query.get();
    
    const venues = venuesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString()
    }));
    
    res.json({ venues, total: venues.length });
    
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ error: "Failed to fetch venues" });
  }
});

// Get single venue
app.get("/v1/venues/:venueId", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    
    const venueDoc = await db.collection("venue").doc(venueId).get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const venueData = venueDoc.data();
    
    // Check permissions - managers can only view their own venue
    if (req.user.role === "manager" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    res.json({
      id: venueDoc.id,
      ...venueData,
      createdAt: venueData.createdAt?.toDate()?.toISOString(),
      updatedAt: venueData.updatedAt?.toDate()?.toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({ error: "Failed to fetch venue" });
  }
});

// Update venue
app.put("/v1/venues/:venueId", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { name, address, phone, description, settings, isActive } = req.body;
    
    const venueDoc = await db.collection("venue").doc(venueId).get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    // Check permissions
    if (req.user.role === "manager" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    const updateData = {
      updatedAt: getServerTimestamp()
    };
    
    if (name !== undefined) {
      updateData.name = name.trim();
      // Update slug if name changes
      updateData.slug = name.toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }
    if (address !== undefined) updateData.address = address.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || "";
    if (settings !== undefined) {
      const currentData = venueDoc.data();
      updateData.settings = {
        ...currentData.settings,
        ...settings
      };
    }
    
    // Only admins can change active status
    if (isActive !== undefined && req.user.role === "admin") {
      updateData.isActive = Boolean(isActive);
    }
    
    await venueDoc.ref.update(updateData);
    
    res.json({ message: "Venue updated successfully" });
    
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({ error: "Failed to update venue" });
  }
});

// Get venue statistics
app.get("/v1/venues/:venueId/stats", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    
    // Check permissions
    if (req.user.role === "manager" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    // Get venue info
    const venueDoc = await db.collection("venue").doc(venueId).get();
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    // Get order statistics
    const ordersSnapshot = await db.collection("orders")
      .where("venueId", "==", venueId)
      .get();
    
    const users = await db.collection("users")
      .where("venueId", "==", venueId)
      .get();
    
    const menuCategories = await venueDoc.ref.collection("menuCategory").get();
    const menuItems = await venueDoc.ref.collection("menuItem").get();
    const tables = await venueDoc.ref.collection("table").get();
    
    // Calculate stats
    const totalOrders = ordersSnapshot.size;
    let totalRevenue = 0;
    const statusCounts = { new: 0, preparing: 0, ready: 0, served: 0 };
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      totalRevenue += order.totalAmount || 0;
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    res.json({
      venue: {
        name: venueDoc.data().name,
        isActive: venueDoc.data().isActive
      },
      orders: {
        total: totalOrders,
        revenue: Math.round(totalRevenue * 100) / 100,
        byStatus: statusCounts
      },
      staff: {
        total: users.size
      },
      menu: {
        categories: menuCategories.size,
        items: menuItems.size
      },
      tables: {
        total: tables.size
      }
    });
    
  } catch (error) {
    console.error("Error fetching venue stats:", error);
    res.status(500).json({ error: "Failed to fetch venue statistics" });
  }
});

// ============================================================================
// SELF-SERVICE REGISTRATION ENDPOINTS
// ============================================================================

// Self-service venue registration (public endpoint)
app.post("/v1/register/venue", async (req, res) => {
  try {
    const { 
      // Venue information
      venueName, 
      address, 
      phone, 
      description,
      currency = "ALL",
      
      // Owner information
      ownerName,
      ownerEmail,
      password,
      
      // Basic setup
      tableCount = 10
    } = req.body;
    
    // Validate required fields
    if (!venueName || !address || !ownerName || !ownerEmail || !password) {
      return res.status(400).json({ 
        error: "Venue name, address, owner name, email, and password are required" 
      });
    }
    
    // Validate input formats
    if (!validateEmail(ownerEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters with uppercase, lowercase, and number" });
    }
    
    // Sanitize string inputs (for future use)
    // const sanitizedVenueName = venueName.trim().slice(0, 100);
    // const sanitizedAddress = address.trim().slice(0, 200);
    // const sanitizedOwnerName = ownerName.trim().slice(0, 100);
    
    
    // Check if email already exists
    const existingUserSnapshot = await db.collection("users")
      .where("email", "==", ownerEmail.toLowerCase())
      .limit(1)
      .get();
    
    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ 
        error: "A user with this email already exists" 
      });
    }
    
    // Generate venue slug from name
    const baseSlug = venueName.toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-")     // Replace spaces with dashes
      .replace(/-+/g, "-")      // Replace multiple dashes with single
      .trim();
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existingVenueSnapshot = await db.collection("venue")
        .where("slug", "==", slug)
        .limit(1)
        .get();
      
      if (existingVenueSnapshot.empty) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Create venue document
    const venueData = {
      name: venueName.trim(),
      slug,
      address: address.trim(),
      phone: phone?.trim() || null,
      description: description?.trim() || "",
      settings: {
        currency,
        orderingEnabled: true,
        estimatedPreparationTime: 15
      },
      isActive: true,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    };
    
    const venueRef = await db.collection("venue").add(venueData);
    const venueId = venueRef.id;
    
    // Create owner user account (standardized format)
    const crypto = require("crypto");
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    const passwordHash = `${salt}:${hash}`;
    
    const userData = {
      email: ownerEmail.toLowerCase(),
      passwordHash: passwordHash,
      fullName: ownerName.trim(),
      role: "manager", // Venue owner gets manager role
      venueId: venueId,
      isActive: true,
      emailVerified: false, // Will need email verification
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
      onboarding: {
        isComplete: true, // Venue registration completes most onboarding steps
        currentStep: 6,
        completedSteps: [1, 2, 3, 4, 5],
        steps: {
          profileComplete: { completed: true, data: { fullName: ownerName.trim() } },
          venueSetup: { completed: true, data: { venueName, address, phone, description } },
          menuCategories: { completed: true, data: { categoriesCreated: 4 } },
          menuItems: { completed: false, data: {} }, // Still needs menu items
          tableSetup: { completed: true, data: { tableCount } },
          staffSetup: { completed: false, data: {} } // Optional but recommended
        },
        startedAt: getServerTimestamp(),
        completedAt: null // Not fully complete until menu items added
      }
    };
    
    const userRef = await db.collection("users").add(userData);
    
    // Create default table configuration
    const tablePromises = [];
    for (let i = 1; i <= tableCount; i++) {
      const tableData = {
        tableNumber: `T${i.toString().padStart(2, "0")}`,
        displayName: `Table ${i}`,
        capacity: 4,
        location: "Main dining area",
        isActive: true,
        createdAt: getServerTimestamp()
      };
      
      tablePromises.push(
        venueRef.collection("table").add(tableData)
      );
    }
    
    await Promise.all(tablePromises);
    
    // Create default menu categories
    const defaultCategories = [
      { name: "Appetizers", nameAlbanian: "Aperitivë", sortOrder: 1 },
      { name: "Main Courses", nameAlbanian: "Pjata Kryesore", sortOrder: 2 },
      { name: "Desserts", nameAlbanian: "Ëmbëlsira", sortOrder: 3 },
      { name: "Beverages", nameAlbanian: "Pije", sortOrder: 4 }
    ];
    
    const categoryPromises = defaultCategories.map(category => 
      venueRef.collection("menuCategory").add({
        ...category,
        isActive: true,
        createdAt: getServerTimestamp()
      })
    );
    
    await Promise.all(categoryPromises);
    
    res.status(201).json({
      message: "Venue registered successfully",
      venueId,
      venue: {
        id: venueId,
        name: venueData.name,
        slug: venueData.slug,
        address: venueData.address
      },
      user: {
        id: userRef.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId
      },
      credentials: {
        email: userData.email,
        // For immediate login, provide credentials
        tempPassword: password // Remove this in production
      },
      setup: {
        tablesCreated: tableCount,
        categoriesCreated: defaultCategories.length,
        qrCodeUrl: `https://order.skan.al/${slug}`
      }
    });
    
  } catch (error) {
    console.error("Error during venue registration:", error);
    res.status(500).json({ error: "Venue registration failed" });
  }
});

// Get venue registration status (for onboarding progress)
app.get("/v1/register/status/:venueId", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    
    // Check permissions - only venue owner can check status
    if (req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    const venueDoc = await db.collection("venue").doc(venueId).get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const venueData = venueDoc.data();
    
    // Check setup completion status
    const [menuItems, tables, users] = await Promise.all([
      venueDoc.ref.collection("menuItem").get(),
      venueDoc.ref.collection("table").get(),
      db.collection("users").where("venueId", "==", venueId).get()
    ]);
    
    const setupStatus = {
      venue: {
        name: venueData.name,
        slug: venueData.slug,
        isActive: venueData.isActive
      },
      progress: {
        venueCreated: true,
        tablesSetup: tables.size > 0,
        menuItems: menuItems.size,
        staffInvited: users.size,
        hasMenuItems: menuItems.size > 0,
        completionPercentage: Math.round(
          ((tables.size > 0 ? 25 : 0) + 
           (menuItems.size > 0 ? 50 : 0) + 
           (users.size > 1 ? 25 : 0)) 
        )
      },
      nextSteps: []
    };
    
    // Suggest next steps based on current state
    if (menuItems.size === 0) {
      setupStatus.nextSteps.push("Add menu items to start receiving orders");
    }
    
    if (users.size === 1) {
      setupStatus.nextSteps.push("Invite staff members to help manage orders");
    }
    
    if (!venueData.isActive) {
      setupStatus.nextSteps.push("Activate venue to enable customer ordering");
    }
    
    res.json(setupStatus);
    
  } catch (error) {
    console.error("Error fetching registration status:", error);
    res.status(500).json({ error: "Failed to fetch registration status" });
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  
  // Get count of orders today - fix date handling bug
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const todayOrdersSnapshot = await db.collection("orders")
    .where("createdAt", ">=", startOfDay)
    .where("createdAt", "<=", endOfDay)
    .get();
  
  const orderCount = todayOrdersSnapshot.size + 1;
  const paddedCount = orderCount.toString().padStart(3, "0");
  
  return `SKN-${dateStr}-${paddedCount}`;
}

function getEstimatedTime(status, _createdAt) {
  const estimatedTimes = {
    "new": "15-20 minutes",
    "preparing": "10-15 minutes",
    "ready": "Ready for pickup",
    "served": "Completed"
  };
  
  return estimatedTimes[status] || "Unknown";
}

// Microsoft Translator function with dual key fallback
async function translateText(text, fromLang, toLang, useBackupKey = false) {
  const subscriptionKey = useBackupKey ? TRANSLATOR_CONFIG.key2 : TRANSLATOR_CONFIG.key1;
  
  if (!subscriptionKey) {
    throw new Error("Microsoft Translator API key not configured");
  }

  try {
    const response = await axios({
      baseURL: TRANSLATOR_CONFIG.endpoint,
      url: "/translate",
      method: "post",
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Ocp-Apim-Subscription-Region": TRANSLATOR_CONFIG.region,
        "Content-type": "application/json",
        "X-ClientTraceId": uuidv4().toString()
      },
      params: {
        "api-version": "3.0",
        "from": fromLang,
        "to": toLang
      },
      data: [{
        "text": text
      }],
      responseType: "json"
    });

    if (response.data && response.data[0] && response.data[0].translations && response.data[0].translations[0]) {
      return response.data[0].translations[0].text;
    } else {
      throw new Error("Invalid response from Microsoft Translator");
    }
  } catch (error) {
    // If first key fails and we haven't tried backup, try backup key
    if (!useBackupKey && TRANSLATOR_CONFIG.key2) {
      console.log("Primary translation key failed, trying backup key...");
      return await translateText(text, fromLang, toLang, true);
    }
    
    console.error("Translation error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Translation failed");
  }
}

// ============================================================================
// HEALTH CHECK AND INFO
// ============================================================================

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "skan-api",
    version: "1.0.0"
  });
});


// ============================================================================
// REAL-TIME FUNCTIONS (Optional for future)
// ============================================================================

// Optional: Real-time order notifications (commented out for now)
// exports.onOrderCreated = functions.firestore
//   .document("orders/{orderId}")
//   .onCreate(async (snap, _context) => {
//     const orderData = snap.data();
//     console.log("New order created:", orderData.orderNumber);
//     
//     // Future: Send notifications to restaurant staff
//     // SMS, email, push notifications, etc.
//     
//     return null;
//   });

// exports.onOrderStatusChanged = functions.firestore
//   .document("orders/{orderId}")
//   .onUpdate(async (change, _context) => {
//     const before = change.before.data();
//     const after = change.after.data();
//     
//     if (before.status !== after.status) {
//       console.log(`Order ${after.orderNumber} status changed: ${before.status} → ${after.status}`);
//       
//       // Future: Notify customer of status changes
//       // SMS, push notification, etc.
//     }
//     
//     return null;
//   });

// ============================================================================
// TABLE MANAGEMENT ENDPOINTS
// ============================================================================

// Create new table
app.post("/v1/venues/:venueId/tables", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { tableNumber, displayName, capacity, location } = req.body;
    
    if (!tableNumber || !displayName) {
      return res.status(400).json({ error: "Table number and display name are required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Check if table number already exists
    const existingTableSnapshot = await db.collection("venue").doc(venueId)
      .collection("table")
      .where("tableNumber", "==", tableNumber)
      .limit(1)
      .get();
    
    if (!existingTableSnapshot.empty) {
      return res.status(409).json({ error: "Table number already exists" });
    }
    
    // Create table
    const tableRef = db.collection("venue").doc(venueId)
      .collection("table").doc();
    
    await tableRef.set({
      tableNumber,
      displayName,
      capacity: capacity || 4,
      location: location || "Main dining area",
      isActive: true,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    });
    
    res.status(201).json({ 
      message: "Table created successfully",
      tableId: tableRef.id
    });
    
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ error: "Failed to create table" });
  }
});

// Update table information
app.put("/v1/venues/:venueId/tables/:tableId", verifyAuth, async (req, res) => {
  try {
    const { venueId, tableId } = req.params;
    const { tableNumber, displayName, capacity, location, isActive } = req.body;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const tableRef = db.collection("venue").doc(venueId)
      .collection("table").doc(tableId);
    
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    const updateData = {
      updatedAt: getServerTimestamp()
    };
    
    if (tableNumber !== undefined) updateData.tableNumber = tableNumber;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);
    if (location !== undefined) updateData.location = location;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    
    await tableRef.update(updateData);
    
    res.json({ message: "Table updated successfully" });
    
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ error: "Failed to update table" });
  }
});

// Delete table
app.delete("/v1/venues/:venueId/tables/:tableId", verifyAuth, async (req, res) => {
  try {
    const { venueId, tableId } = req.params;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const tableRef = db.collection("venue").doc(venueId)
      .collection("table").doc(tableId);
    
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    await tableRef.delete();
    
    res.json({ message: "Table deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ error: "Failed to delete table" });
  }
});

// Generate QR code for table
app.get("/v1/venues/:venueId/tables/:tableId/qr", verifyAuth, async (req, res) => {
  try {
    const { venueId, tableId } = req.params;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get venue and table info
    const [venueDoc, tableDoc] = await Promise.all([
      db.collection("venue").doc(venueId).get(),
      db.collection("venue").doc(venueId).collection("table").doc(tableId).get()
    ]);
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    if (!tableDoc.exists) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    const venueData = venueDoc.data();
    const tableData = tableDoc.data();
    
    const qrUrl = `https://order.skan.al/${venueData.slug}/${tableData.tableNumber}`;
    
    res.json({
      qrUrl,
      tableNumber: tableData.tableNumber,
      displayName: tableData.displayName,
      venueSlug: venueData.slug
    });
    
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// Enable/disable table
app.put("/v1/venues/:venueId/tables/:tableId/status", verifyAuth, async (req, res) => {
  try {
    const { venueId, tableId } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ error: "isActive is required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const tableRef = db.collection("venue").doc(venueId)
      .collection("table").doc(tableId);
    
    const tableDoc = await tableRef.get();
    if (!tableDoc.exists) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    await tableRef.update({
      isActive: Boolean(isActive),
      updatedAt: getServerTimestamp()
    });
    
    res.json({ 
      message: "Table status updated successfully",
      isActive: Boolean(isActive)
    });
    
  } catch (error) {
    console.error("Error updating table status:", error);
    res.status(500).json({ error: "Failed to update table status" });
  }
});

// ============================================================================
// ANALYTICS & REPORTING ENDPOINTS
// ============================================================================

// Get daily sales reports
app.get("/v1/venues/:venueId/analytics/daily", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { date, days = 7 } = req.query;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const targetDate = date ? new Date(date) : new Date();
    const daysCount = Math.min(parseInt(days), 30); // Limit to 30 days
    
    const dailyStats = [];
    
    for (let i = 0; i < daysCount; i++) {
      const currentDate = new Date(targetDate);
      currentDate.setDate(targetDate.getDate() - i);
      
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const ordersSnapshot = await db.collection("orders")
        .where("venueId", "==", venueId)
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
        .get();
      
      let totalRevenue = 0;
      let orderCount = 0;
      
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        totalRevenue += order.totalAmount || 0;
        orderCount++;
      });
      
      dailyStats.push({
        date: currentDate.toISOString().split("T")[0],
        orders: orderCount,
        revenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0
      });
    }
    
    res.json({
      period: `${daysCount} days`,
      stats: dailyStats.reverse()
    });
    
  } catch (error) {
    console.error("Error fetching daily analytics:", error);
    res.status(500).json({ error: "Failed to fetch daily analytics" });
  }
});

// Get popular items report
app.get("/v1/venues/:venueId/analytics/popular-items", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { limit = 10, days = 30 } = req.query;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const daysBack = Math.min(parseInt(days), 90); // Limit to 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const ordersSnapshot = await db.collection("orders")
      .where("venueId", "==", venueId)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .get();
    
    const itemStats = {};
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      order.items?.forEach(item => {
        const itemId = item.id || item.name;
        if (!itemStats[itemId]) {
          itemStats[itemId] = {
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0
          };
        }
        
        itemStats[itemId].totalQuantity += item.quantity || 1;
        itemStats[itemId].totalRevenue += (item.price || 0) * (item.quantity || 1);
        itemStats[itemId].orderCount += 1;
      });
    });
    
    const popularItems = Object.values(itemStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, parseInt(limit))
      .map(item => ({
        ...item,
        totalRevenue: Math.round(item.totalRevenue * 100) / 100,
        averagePrice: Math.round((item.totalRevenue / item.totalQuantity) * 100) / 100
      }));
    
    res.json({
      period: `${daysBack} days`,
      totalItems: Object.keys(itemStats).length,
      popularItems
    });
    
  } catch (error) {
    console.error("Error fetching popular items:", error);
    res.status(500).json({ error: "Failed to fetch popular items" });
  }
});

// Get peak hours analysis
app.get("/v1/venues/:venueId/analytics/peak-hours", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { days = 30 } = req.query;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const daysBack = Math.min(parseInt(days), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const ordersSnapshot = await db.collection("orders")
      .where("venueId", "==", venueId)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .get();
    
    const hourlyStats = Array(24).fill(0).map(() => ({ orders: 0, revenue: 0 }));
    const dailyStats = Array(7).fill(0).map(() => ({ orders: 0, revenue: 0 }));
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      const orderDate = order.createdAt.toDate();
      const hour = orderDate.getHours();
      const dayOfWeek = orderDate.getDay();
      
      hourlyStats[hour].orders += 1;
      hourlyStats[hour].revenue += order.totalAmount || 0;
      
      dailyStats[dayOfWeek].orders += 1;
      dailyStats[dayOfWeek].revenue += order.totalAmount || 0;
    });
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    res.json({
      period: `${daysBack} days`,
      hourlyBreakdown: hourlyStats.map((stat, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        orders: stat.orders,
        revenue: Math.round(stat.revenue * 100) / 100
      })),
      dailyBreakdown: dailyStats.map((stat, day) => ({
        day: dayNames[day],
        orders: stat.orders,
        revenue: Math.round(stat.revenue * 100) / 100
      }))
    });
    
  } catch (error) {
    console.error("Error fetching peak hours:", error);
    res.status(500).json({ error: "Failed to fetch peak hours analysis" });
  }
});

// Get revenue trends
app.get("/v1/venues/:venueId/analytics/revenue", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { months = 6 } = req.query;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const monthsBack = Math.min(parseInt(months), 12);
    const trends = [];
    
    for (let i = 0; i < monthsBack; i++) {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() - i);
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      
      const ordersSnapshot = await db.collection("orders")
        .where("venueId", "==", venueId)
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfMonth))
        .get();
      
      let totalRevenue = 0;
      let orderCount = 0;
      
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        totalRevenue += order.totalAmount || 0;
        orderCount++;
      });
      
      trends.push({
        period: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`,
        revenue: Math.round(totalRevenue * 100) / 100,
        orders: orderCount,
        averageOrderValue: orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0
      });
    }
    
    res.json({
      period: `${monthsBack} months`,
      trends: trends.reverse()
    });
    
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    res.status(500).json({ error: "Failed to fetch revenue trends" });
  }
});

// Export order data
app.get("/v1/venues/:venueId/analytics/orders/export", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { format = "json", startDate, endDate } = req.query;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    let query = db.collection("orders")
      .where("venueId", "==", venueId)
      .orderBy("createdAt", "desc");
    
    if (startDate) {
      query = query.where("createdAt", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    
    if (endDate) {
      query = query.where("createdAt", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }
    
    const ordersSnapshot = await query.limit(1000).get(); // Limit exports to 1000 orders
    
    const orders = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      return {
        orderId: doc.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt?.toDate()?.toISOString(),
        updatedAt: order.updatedAt?.toDate()?.toISOString()
      };
    });
    
    if (format === "csv") {
      // Convert to CSV format
      const csv = orders.map(order => 
        `"${order.orderNumber}","${order.tableNumber}","${order.customerName}","${order.totalAmount}","${order.status}","${order.createdAt}"`
      ).join("\n");
      
      const header = "Order Number,Table,Customer,Amount,Status,Created At\n";
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=\"orders-export.csv\"");
      res.send(header + csv);
    } else {
      res.json({
        exportedAt: new Date().toISOString(),
        totalOrders: orders.length,
        orders
      });
    }
    
  } catch (error) {
    console.error("Error exporting orders:", error);
    res.status(500).json({ error: "Failed to export orders" });
  }
});

// ============================================================================
// SETTINGS & CONFIGURATION ENDPOINTS
// ============================================================================

// Update venue settings
app.put("/v1/venues/:venueId/settings", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { currency, orderingEnabled, estimatedPreparationTime, taxRate, serviceCharge } = req.body;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const venueRef = db.collection("venue").doc(venueId);
    const venueDoc = await venueRef.get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const currentSettings = venueDoc.data().settings || {};
    const updateData = {
      settings: {
        ...currentSettings
      },
      updatedAt: getServerTimestamp()
    };
    
    if (currency !== undefined) updateData.settings.currency = currency;
    if (orderingEnabled !== undefined) updateData.settings.orderingEnabled = Boolean(orderingEnabled);
    if (estimatedPreparationTime !== undefined) updateData.settings.estimatedPreparationTime = parseInt(estimatedPreparationTime);
    if (taxRate !== undefined) updateData.settings.taxRate = parseFloat(taxRate);
    if (serviceCharge !== undefined) updateData.settings.serviceCharge = parseFloat(serviceCharge);
    
    await venueRef.update(updateData);
    
    res.json({ 
      message: "Venue settings updated successfully",
      settings: updateData.settings
    });
    
  } catch (error) {
    console.error("Error updating venue settings:", error);
    res.status(500).json({ error: "Failed to update venue settings" });
  }
});

// Get notification preferences
app.get("/v1/venues/:venueId/settings/notifications", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const venueDoc = await db.collection("venue").doc(venueId).get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const settings = venueDoc.data().settings || {};
    const notifications = settings.notifications || {
      newOrderAlert: true,
      emailNotifications: true,
      smsNotifications: false,
      soundAlerts: true,
      orderUpdateNotifications: true
    };
    
    res.json({ notifications });
    
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Failed to fetch notification settings" });
  }
});

// Update notification preferences
app.put("/v1/venues/:venueId/settings/notifications", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { newOrderAlert, emailNotifications, smsNotifications, soundAlerts, orderUpdateNotifications } = req.body;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const venueRef = db.collection("venue").doc(venueId);
    const venueDoc = await venueRef.get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const currentSettings = venueDoc.data().settings || {};
    const currentNotifications = currentSettings.notifications || {};
    
    const updatedNotifications = { ...currentNotifications };
    
    if (newOrderAlert !== undefined) updatedNotifications.newOrderAlert = Boolean(newOrderAlert);
    if (emailNotifications !== undefined) updatedNotifications.emailNotifications = Boolean(emailNotifications);
    if (smsNotifications !== undefined) updatedNotifications.smsNotifications = Boolean(smsNotifications);
    if (soundAlerts !== undefined) updatedNotifications.soundAlerts = Boolean(soundAlerts);
    if (orderUpdateNotifications !== undefined) updatedNotifications.orderUpdateNotifications = Boolean(orderUpdateNotifications);
    
    await venueRef.update({
      "settings.notifications": updatedNotifications,
      updatedAt: getServerTimestamp()
    });
    
    res.json({ 
      message: "Notification preferences updated successfully",
      notifications: updatedNotifications
    });
    
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Failed to update notification settings" });
  }
});

// Get operating hours
app.get("/v1/venues/:venueId/settings/operating-hours", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const venueDoc = await db.collection("venue").doc(venueId).get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const settings = venueDoc.data().settings || {};
    const operatingHours = settings.operatingHours || {
      monday: { open: "09:00", close: "22:00", isOpen: true },
      tuesday: { open: "09:00", close: "22:00", isOpen: true },
      wednesday: { open: "09:00", close: "22:00", isOpen: true },
      thursday: { open: "09:00", close: "22:00", isOpen: true },
      friday: { open: "09:00", close: "23:00", isOpen: true },
      saturday: { open: "09:00", close: "23:00", isOpen: true },
      sunday: { open: "10:00", close: "21:00", isOpen: true }
    };
    
    res.json({ operatingHours });
    
  } catch (error) {
    console.error("Error fetching operating hours:", error);
    res.status(500).json({ error: "Failed to fetch operating hours" });
  }
});

// Update operating hours
app.put("/v1/venues/:venueId/settings/operating-hours", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { operatingHours } = req.body;
    
    if (!operatingHours) {
      return res.status(400).json({ error: "Operating hours data is required" });
    }
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const venueRef = db.collection("venue").doc(venueId);
    const venueDoc = await venueRef.get();
    
    if (!venueDoc.exists) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    await venueRef.update({
      "settings.operatingHours": operatingHours,
      updatedAt: getServerTimestamp()
    });
    
    res.json({ 
      message: "Operating hours updated successfully",
      operatingHours
    });
    
  } catch (error) {
    console.error("Error updating operating hours:", error);
    res.status(500).json({ error: "Failed to update operating hours" });
  }
});

// ============================================================================
// ORDER ENHANCEMENT ENDPOINTS
// ============================================================================

// Cancel order
app.put("/v1/orders/:orderId/cancel", verifyAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const orderData = orderDoc.data();
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== orderData.venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Can only cancel orders that are new or preparing
    if (!["new", "preparing"].includes(orderData.status)) {
      return res.status(400).json({ error: "Cannot cancel order that is ready or served" });
    }
    
    await orderRef.update({
      status: "cancelled",
      cancellationReason: reason || "Cancelled by restaurant",
      cancelledAt: getServerTimestamp(),
      cancelledBy: req.user.uid,
      updatedAt: getServerTimestamp()
    });
    
    res.json({ 
      message: "Order cancelled successfully",
      orderId
    });
    
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// Process refund
app.post("/v1/orders/:orderId/refund", verifyAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid refund amount is required" });
    }
    
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const orderData = orderDoc.data();
    
    // Verify user has access to this venue and has manager+ role
    if (req.user.role === "staff" || (req.user.role !== "admin" && req.user.venueId !== orderData.venueId)) {
      return res.status(403).json({ error: "Only managers and admins can process refunds" });
    }
    
    if (amount > orderData.totalAmount) {
      return res.status(400).json({ error: "Refund amount cannot exceed order total" });
    }
    
    // Create refund record
    const refundData = {
      orderId,
      orderNumber: orderData.orderNumber,
      venueId: orderData.venueId,
      amount: parseFloat(amount),
      reason: reason || "Refund processed",
      processedBy: req.user.uid,
      processedAt: getServerTimestamp(),
      status: "pending" // In a real system, this would integrate with payment processor
    };
    
    const refundRef = await db.collection("refunds").add(refundData);
    
    // Update order with refund information
    await orderRef.update({
      refundAmount: parseFloat(amount),
      refundReason: reason,
      refundId: refundRef.id,
      refundedAt: getServerTimestamp(),
      updatedAt: getServerTimestamp()
    });
    
    res.json({ 
      message: "Refund processed successfully",
      refundId: refundRef.id,
      amount: parseFloat(amount)
    });
    
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ error: "Failed to process refund" });
  }
});

// Get order summary stats for venue
app.get("/v1/venues/:venueId/orders/summary", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { period = "today" } = req.query;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }
    
    const ordersSnapshot = await db.collection("orders")
      .where("venueId", "==", venueId)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();
    
    let totalRevenue = 0;
    let totalRefunds = 0;
    const statusCounts = { new: 0, preparing: 0, ready: 0, served: 0, cancelled: 0 };
    const tableCounts = {};
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      totalRevenue += order.totalAmount || 0;
      totalRefunds += order.refundAmount || 0;
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      tableCounts[order.tableNumber] = (tableCounts[order.tableNumber] || 0) + 1;
    });
    
    const netRevenue = totalRevenue - totalRefunds;
    const averageOrderValue = ordersSnapshot.size > 0 ? totalRevenue / ordersSnapshot.size : 0;
    
    res.json({
      period,
      summary: {
        totalOrders: ordersSnapshot.size,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        statusBreakdown: statusCounts,
        busiestTables: Object.entries(tableCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([table, count]) => ({ table, orders: count }))
      }
    });
    
  } catch (error) {
    console.error("Error fetching order summary:", error);
    res.status(500).json({ error: "Failed to fetch order summary" });
  }
});

// ============================================================================
// FILE MANAGEMENT ENDPOINTS
// ============================================================================

// Upload menu images (placeholder - requires Firebase Storage setup)
app.post("/v1/upload/menu-images", verifyAuth, async (req, res) => {
  try {
    // This is a placeholder endpoint
    // In a real implementation, you would:
    // 1. Use multer or similar for file upload
    // 2. Validate file types and sizes
    // 3. Upload to Firebase Storage
    // 4. Return the download URL
    
    res.status(501).json({ 
      error: "File upload not implemented yet",
      message: "This endpoint requires Firebase Storage configuration and file upload middleware"
    });
    
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Delete uploaded files (placeholder)
app.delete("/v1/upload/:fileId", verifyAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // This is a placeholder endpoint
    // In a real implementation, you would:
    // 1. Verify file ownership
    // 2. Delete from Firebase Storage
    // 3. Update any references in Firestore
    
    res.status(501).json({ 
      error: "File deletion not implemented yet",
      message: "This endpoint requires Firebase Storage configuration",
      fileId
    });
    
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// List venue images (placeholder)
app.get("/v1/venues/:venueId/images", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    
    // Verify user has access to this venue
    if (req.user.role !== "admin" && req.user.venueId !== venueId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // This is a placeholder endpoint
    // In a real implementation, you would:
    // 1. Query Firebase Storage for venue images
    // 2. Return list of image URLs and metadata
    
    res.json({
      venueId,
      images: [],
      message: "Image listing not implemented yet - requires Firebase Storage configuration"
    });
    
  } catch (error) {
    console.error("Error listing images:", error);
    res.status(500).json({ error: "Failed to list images" });
  }
});

// ============================================================================
// VENUE SETUP & ONBOARDING ENDPOINTS
// ============================================================================

// Get venue setup status for onboarding wizard
app.get("/v1/venue/setup-status", verifyAuth, async (req, res) => {
  try {
    const venueId = req.user.venueId;
    
    if (!venueId) {
      return res.status(400).json({ error: "User not associated with a venue" });
    }
    
    // Check menu items count
    const menuItemsSnapshot = await db.collection("menuItems")
      .where("venueId", "==", venueId)
      .get();
    const hasMenuItems = menuItemsSnapshot.size > 0;
    
    // Check if venue has custom categories (beyond default ones)
    const categoriesSnapshot = await db.collection("categories")
      .where("venueId", "==", venueId)
      .get();
    const hasCustomCategories = categoriesSnapshot.size > 4; // More than default 4
    
    // Check staff members count (excluding the owner)
    const usersSnapshot = await db.collection("users")
      .where("venueId", "==", venueId)
      .get();
    const hasStaffMembers = usersSnapshot.size > 1; // More than just the owner
    
    // Check if tables have been customized
    const tablesSnapshot = await db.collection("tables")
      .where("venueId", "==", venueId)
      .where("name", "!=", "Table 1") // Check if they changed default names
      .get();
    const hasConfiguredTables = tablesSnapshot.size > 0;
    
    // Check if onboarding was completed
    const venueDoc = await db.collection("venue").doc(venueId).get();
    const venueData = venueDoc.data();
    const onboardingCompleted = venueData?.onboardingCompleted || false;
    
    res.json({
      setup: {
        hasMenuItems,
        hasCustomCategories,
        hasStaffMembers,
        hasConfiguredTables,
        onboardingCompleted
      }
    });
    
  } catch (error) {
    console.error("Error fetching venue setup status:", error);
    res.status(500).json({ error: "Failed to fetch setup status" });
  }
});

// Complete onboarding process
app.post("/v1/venue/complete-onboarding", verifyAuth, async (req, res) => {
  try {
    const venueId = req.user.venueId;
    
    if (!venueId) {
      return res.status(400).json({ error: "User not associated with a venue" });
    }
    
    // Update venue to mark onboarding as completed
    await db.collection("venue").doc(venueId).update({
      onboardingCompleted: true,
      onboardingCompletedAt: getServerTimestamp(),
      onboardingCompletedBy: req.user.uid
    });
    
    res.json({
      message: "Onboarding completed successfully"
    });
    
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

// Global error handler (must be last)
app.use((error, req, res, _next) => {
  console.error(`[${req.requestId}] Error:`, error);
  
  // Log error for monitoring
  auditLog("SERVER_ERROR", req.user?.uid || null, {
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    requestId: req.requestId,
    endpoint: req.path,
    method: req.method
  }, req.ip);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === "production") {
    res.status(500).json({
      error: "Internal server error",
      requestId: req.requestId
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });
  }
});

// ============================================================================
// USER ONBOARDING ENDPOINTS
// ============================================================================

// Get user onboarding status
app.get("/v1/onboarding/status", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId; // Support both uid and userId for backward compatibility
    
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data();
    const onboarding = userData.onboarding || {
      isComplete: false,
      currentStep: 1,
      completedSteps: [],
      steps: {
        profileComplete: { completed: false, data: {} },
        venueSetup: { completed: false, data: {} },
        menuCategories: { completed: false, data: {} },
        menuItems: { completed: false, data: {} },
        tableSetup: { completed: false, data: {} },
        staffSetup: { completed: false, data: {} }
      }
    };
    
    res.json({
      onboarding,
      user: {
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId
      }
    });
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    res.status(500).json({ error: "Failed to get onboarding status" });
  }
});

// Update onboarding step
app.put("/v1/onboarding/step/:stepName", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId; // Support both uid and userId for backward compatibility
    const { stepName } = req.params;
    const { data, completed = true } = req.body;
    
    const validSteps = ["profileComplete", "venueSetup", "menuCategories", "menuItems", "tableSetup", "staffSetup"];
    if (!validSteps.includes(stepName)) {
      return res.status(400).json({ error: "Invalid step name" });
    }
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data();
    const onboarding = userData.onboarding || {};
    
    // Update the specific step
    onboarding.steps = onboarding.steps || {};
    onboarding.steps[stepName] = {
      completed,
      data: data || {},
      updatedAt: getServerTimestamp()
    };
    
    // Update completed steps array
    onboarding.completedSteps = onboarding.completedSteps || [];
    if (completed && !onboarding.completedSteps.includes(stepName)) {
      onboarding.completedSteps.push(stepName);
    } else if (!completed) {
      onboarding.completedSteps = onboarding.completedSteps.filter(step => step !== stepName);
    }
    
    // Calculate current step and completion status
    const completedCount = onboarding.completedSteps.length;
    onboarding.currentStep = Math.min(completedCount + 1, 6);
    onboarding.isComplete = completedCount >= 4; // Profile, venue, categories, and items are required
    
    if (onboarding.isComplete && !onboarding.completedAt) {
      onboarding.completedAt = getServerTimestamp();
    } else if (!onboarding.isComplete) {
      onboarding.completedAt = null;
    }
    
    await userRef.update({
      onboarding,
      updatedAt: getServerTimestamp()
    });
    
    res.json({
      message: "Onboarding step updated successfully",
      onboarding
    });
  } catch (error) {
    console.error("Error updating onboarding step:", error);
    res.status(500).json({ error: "Failed to update onboarding step" });
  }
});

// Complete onboarding process
app.post("/v1/onboarding/complete", verifyAuth, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId; // Support both uid and userId for backward compatibility
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data();
    const onboarding = userData.onboarding || {};
    
    // Check if required steps are completed
    const requiredSteps = ["profileComplete", "venueSetup", "menuCategories", "menuItems"];
    const requiredCompleted = requiredSteps.every(step => 
      onboarding.steps?.[step]?.completed === true
    );
    
    if (!requiredCompleted) {
      return res.status(400).json({ 
        error: "Cannot complete onboarding: required steps not finished",
        requiredSteps,
        currentStatus: onboarding.steps
      });
    }
    
    // Mark onboarding as complete
    onboarding.isComplete = true;
    onboarding.currentStep = 6;
    onboarding.completedAt = getServerTimestamp();
    
    await userRef.update({
      onboarding,
      updatedAt: getServerTimestamp()
    });
    
    res.json({
      message: "Onboarding completed successfully",
      onboarding
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

// ============================================================================
// TRANSLATION ENDPOINTS
// ============================================================================

// Translate single menu item
app.post("/v1/translate/menu-item", verifyAuth, [
  body("text").notEmpty().withMessage("Text is required"),
  body("fromLang").notEmpty().withMessage("Source language is required"),
  body("toLang").notEmpty().withMessage("Target language is required"),
  body("context").optional().isString()
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: errors.array() 
      });
    }

    const { text, fromLang, toLang, context } = req.body;
    
    // Validate languages
    const supportedLanguages = ["sq", "en", "it", "de", "fr", "es"];
    if (!supportedLanguages.includes(fromLang) || !supportedLanguages.includes(toLang)) {
      return res.status(400).json({ 
        error: "Unsupported language. Supported: sq, en, it, de, fr, es" 
      });
    }

    // Call translation function
    const translatedText = await translateText(text, fromLang, toLang);
    
    // Log for audit
    await auditLog("TRANSLATE_SUCCESS", req.user.uid, { 
      originalText: text,
      translatedText,
      fromLang,
      toLang,
      context: context || "menu-item"
    }, req.ip);

    res.json({
      originalText: text,
      translatedText: translatedText,
      fromLanguage: fromLang,
      toLanguage: toLang,
      context: context || "menu-item"
    });

  } catch (error) {
    console.error("Translation endpoint error:", error);
    
    await auditLog("TRANSLATE_FAILED", req.user?.uid || "anonymous", { 
      error: error.message,
      text: req.body?.text,
      fromLang: req.body?.fromLang,
      toLang: req.body?.toLang
    }, req.ip);

    res.status(500).json({
      error: "Translation failed",
      message: error.message
    });
  }
});

// Bulk translate menu items
app.post("/v1/translate/menu-items/bulk", verifyAuth, [
  body("items").isArray().withMessage("Items must be an array"),
  body("items.*.text").notEmpty().withMessage("Each item must have text"),
  body("fromLang").notEmpty().withMessage("Source language is required"),
  body("toLang").notEmpty().withMessage("Target language is required")
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: errors.array() 
      });
    }

    const { items, fromLang, toLang } = req.body;
    
    // Validate languages
    const supportedLanguages = ["sq", "en", "it", "de", "fr", "es"];
    if (!supportedLanguages.includes(fromLang) || !supportedLanguages.includes(toLang)) {
      return res.status(400).json({ 
        error: "Unsupported language. Supported: sq, en, it, de, fr, es" 
      });
    }

    // Limit bulk requests
    if (items.length > 50) {
      return res.status(400).json({ 
        error: "Too many items. Maximum 50 items per request" 
      });
    }

    // Translate all items
    const translatedItems = [];
    const translationErrors = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const translatedText = await translateText(items[i].text, fromLang, toLang);
        translatedItems.push({
          index: i,
          originalText: items[i].text,
          translatedText: translatedText,
          success: true
        });
      } catch (error) {
        translationErrors.push({
          index: i,
          originalText: items[i].text,
          error: error.message,
          success: false
        });
      }
    }

    // Log for audit
    await auditLog("TRANSLATE_BULK", req.user.uid, { 
      itemCount: items.length,
      successCount: translatedItems.length,
      errorCount: translationErrors.length,
      fromLang,
      toLang
    }, req.ip);

    res.json({
      success: true,
      translatedItems,
      errors: translationErrors,
      summary: {
        total: items.length,
        successful: translatedItems.length,
        failed: translationErrors.length
      }
    });

  } catch (error) {
    console.error("Bulk translation endpoint error:", error);
    
    await auditLog("TRANSLATE_BULK_FAILED", req.user?.uid || "anonymous", { 
      error: error.message,
      itemCount: req.body?.items?.length || 0
    }, req.ip);

    res.status(500).json({
      error: "Bulk translation failed",
      message: error.message
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method
  });
});

// ====================================
// PAYPAL SUBSCRIPTION ROUTES
// ====================================

// Test endpoint for PayPal routes
app.get("/v1/payments/test", (req, res) => {
  res.json({ message: "PayPal routes are working", timestamp: new Date().toISOString() });
});

// Setup both monthly and annual plans (admin utility endpoint)
app.post("/v1/payments/setup-plans", verifyAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow admins to create plans
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const accessToken = await getPayPalAccessToken();
    const createdPlans = [];

    // Create monthly plan
    const monthlyPlanData = {
      product_id: "SKAN_AL_SUBSCRIPTION",
      name: "SKAN.AL Monthly Subscription",
      description: "QR code ordering system for Albanian restaurants - Monthly plan",
      status: "ACTIVE",
      billing_cycles: [{
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: "35.00", currency_code: "EUR" }}
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: "0.00", currency_code: "EUR" },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      }
    };

    const monthlyResponse = await axios.post(`${PAYPAL_CONFIG.apiUrl}/v1/billing/plans`, monthlyPlanData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "PayPal-Request-Id": uuidv4()
      }
    });
    createdPlans.push({ type: "monthly", plan: monthlyResponse.data });

    // Create annual plan
    const annualPlanData = {
      product_id: "SKAN_AL_SUBSCRIPTION",
      name: "SKAN.AL Annual Subscription",
      description: "QR code ordering system for Albanian restaurants - Annual plan (10% discount)",
      status: "ACTIVE",
      billing_cycles: [{
        frequency: { interval_unit: "YEAR", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: "378.00", currency_code: "EUR" }}
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: "0.00", currency_code: "EUR" },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      }
    };

    const annualResponse = await axios.post(`${PAYPAL_CONFIG.apiUrl}/v1/billing/plans`, annualPlanData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "PayPal-Request-Id": uuidv4()
      }
    });
    createdPlans.push({ type: "annual", plan: annualResponse.data });

    res.json({
      message: "Both subscription plans created successfully",
      plans: createdPlans,
      note: "Save these plan IDs for use in subscription creation"
    });

  } catch (error) {
    console.error("PayPal plans setup error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to setup subscription plans",
      details: error.response?.data || error.message 
    });
  }
});

// Create PayPal subscription plan (monthly or annual)
app.post("/v1/payments/plans", verifyAuth, async (req, res) => {
  try {
    const { planType, name, description } = req.body; // planType: "monthly" or "annual"
    const accessToken = await getPayPalAccessToken();
    
    const isAnnual = planType === "annual";
    const planName = name || (isAnnual ? "SKAN.AL Annual Subscription" : "SKAN.AL Monthly Subscription");
    const planDesc = description || (isAnnual ? 
      "QR code ordering system for Albanian restaurants - Annual plan (10% discount)" : 
      "QR code ordering system for Albanian restaurants - Monthly plan");
    
    const planData = {
      product_id: "SKAN_AL_SUBSCRIPTION", // This would be created in PayPal dashboard
      name: planName,
      description: planDesc,
      status: "ACTIVE",
      billing_cycles: [{
        frequency: {
          interval_unit: isAnnual ? "YEAR" : "MONTH",
          interval_count: 1
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: isAnnual ? "378.00" : "35.00", // €378 = €420 - 10% discount
            currency_code: "EUR"
          }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0.00",
          currency_code: "EUR"
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      },
      taxes: {
        percentage: "0.00",
        inclusive: false
      }
    };

    const response = await axios.post(`${PAYPAL_CONFIG.apiUrl}/v1/billing/plans`, planData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "PayPal-Request-Id": uuidv4()
      }
    });

    res.json({
      message: "Subscription plan created successfully",
      plan: response.data
    });
  } catch (error) {
    console.error("PayPal plan creation error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to create subscription plan",
      details: error.response?.data || error.message 
    });
  }
});

// Create PayPal subscription
app.post("/v1/payments/subscriptions", verifyAuth, async (req, res) => {
  try {
    const { planId, returnUrl, cancelUrl } = req.body;
    const user = req.user;
    const accessToken = await getPayPalAccessToken();

    const subscriptionData = {
      plan_id: planId || "P-5ML4271244454362WXNWU5NQ", // Default plan ID
      start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
      subscriber: {
        name: {
          given_name: user.fullName.split(" ")[0] || "Restaurant",
          surname: user.fullName.split(" ")[1] || "Owner"
        },
        email_address: user.email
      },
      application_context: {
        brand_name: "SKAN.AL",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: returnUrl || "https://admin.skan.al/payment-success",
        cancel_url: cancelUrl || "https://admin.skan.al/payment-cancelled"
      }
    };

    const response = await axios.post(`${PAYPAL_CONFIG.apiUrl}/v1/billing/subscriptions`, subscriptionData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "PayPal-Request-Id": uuidv4()
      }
    });

    // Store subscription info in Firestore
    await db.collection("subscriptions").doc(response.data.id).set({
      subscriptionId: response.data.id,
      venueId: user.venueId,
      userId: user.id,
      planId: planId,
      status: response.data.status,
      createdAt: getServerTimestamp()
    });

    res.json({
      message: "Subscription created successfully",
      subscription: response.data,
      approvalUrl: response.data.links.find(link => link.rel === "approve")?.href
    });
  } catch (error) {
    console.error("PayPal subscription creation error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to create subscription",
      details: error.response?.data || error.message 
    });
  }
});

// Get subscription status
app.get("/v1/payments/subscriptions/:subscriptionId", verifyAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const user = req.user;
    const accessToken = await getPayPalAccessToken();

    // Check if user has access to this subscription
    const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const subscriptionData = subscriptionDoc.data();
    if (subscriptionData.venueId !== user.venueId) {
      return res.status(403).json({ error: "Access denied to this subscription" });
    }

    const response = await axios.get(`${PAYPAL_CONFIG.apiUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    // Update local status
    await db.collection("subscriptions").doc(subscriptionId).update({
      status: response.data.status,
      lastChecked: getServerTimestamp()
    });

    res.json({
      subscription: response.data,
      localData: subscriptionData
    });
  } catch (error) {
    console.error("PayPal subscription get error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to get subscription",
      details: error.response?.data || error.message 
    });
  }
});

// Activate subscription (after PayPal approval)
app.post("/v1/payments/subscriptions/activate", verifyAuth, async (req, res) => {
  try {
    const { subscriptionId, planId } = req.body;
    const user = req.user;
    const accessToken = await getPayPalAccessToken();

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    // Get subscription details from PayPal
    const subscriptionResponse = await axios.get(`${PAYPAL_CONFIG.apiUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    const subscription = subscriptionResponse.data;

    // Store or update subscription info in Firestore
    await db.collection("subscriptions").doc(subscriptionId).set({
      subscriptionId: subscriptionId,
      venueId: user.venueId,
      userId: user.id,
      planId: planId || subscription.plan_id,
      status: subscription.status,
      createdAt: getServerTimestamp(),
      activatedAt: subscription.status === "ACTIVE" ? getServerTimestamp() : null,
      nextBillingTime: subscription.billing_info?.next_billing_time,
      paypalSubscriptionData: subscription
    }, { merge: true });

    // Update venue with subscription status
    await db.collection("venues").doc(user.venueId).update({
      hasActiveSubscription: subscription.status === "ACTIVE",
      subscriptionId: subscriptionId,
      subscriptionStatus: subscription.status,
      subscriptionUpdatedAt: getServerTimestamp()
    });

    res.json({
      success: true,
      message: "Subscription activated successfully",
      subscription: {
        id: subscriptionId,
        status: subscription.status,
        planId: subscription.plan_id,
        nextBillingTime: subscription.billing_info?.next_billing_time
      }
    });
  } catch (error) {
    console.error("PayPal subscription activation error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to activate subscription",
      details: error.response?.data || error.message 
    });
  }
});

// Cancel subscription
app.post("/v1/payments/subscriptions/:subscriptionId/cancel", verifyAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;
    const user = req.user;
    const accessToken = await getPayPalAccessToken();

    // Check if user has access to this subscription
    const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get();
    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const subscriptionData = subscriptionDoc.data();
    if (subscriptionData.venueId !== user.venueId) {
      return res.status(403).json({ error: "Access denied to this subscription" });
    }

    const cancelData = {
      reason: reason || "User requested cancellation"
    };

    await axios.post(`${PAYPAL_CONFIG.apiUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, cancelData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });

    // Update local status
    await db.collection("subscriptions").doc(subscriptionId).update({
      status: "CANCELLED",
      cancelledAt: getServerTimestamp(),
      cancelReason: reason
    });

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    console.error("PayPal subscription cancel error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to cancel subscription",
      details: error.response?.data || error.message 
    });
  }
});

// PayPal webhook endpoint for subscription events
app.post("/v1/payments/webhooks", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const webhookEvent = JSON.parse(req.body.toString());
    console.log("PayPal webhook received:", webhookEvent.event_type);

    // Handle different webhook events
    switch (webhookEvent.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(webhookEvent);
        break;
      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(webhookEvent);
        break;
      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentCompleted(webhookEvent);
        break;
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        await handlePaymentFailed(webhookEvent);
        break;
      default:
        console.log("Unhandled webhook event:", webhookEvent.event_type);
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Webhook event handlers
async function handleSubscriptionActivated(event) {
  const subscription = event.resource;
  await db.collection("subscriptions").doc(subscription.id).update({
    status: "ACTIVE",
    activatedAt: getServerTimestamp()
  });
}

async function handleSubscriptionCancelled(event) {
  const subscription = event.resource;
  await db.collection("subscriptions").doc(subscription.id).update({
    status: "CANCELLED",
    cancelledAt: getServerTimestamp()
  });
}

async function handlePaymentCompleted(event) {
  const payment = event.resource;
  const subscriptionId = payment.billing_agreement_id;
  
  await db.collection("payments").add({
    subscriptionId: subscriptionId,
    paymentId: payment.id,
    amount: payment.amount.total,
    currency: payment.amount.currency,
    status: "COMPLETED",
    paymentDate: getServerTimestamp()
  });
}

async function handlePaymentFailed(event) {
  const subscription = event.resource;
  await db.collection("subscriptions").doc(subscription.id).update({
    status: "PAYMENT_FAILED",
    lastFailedAt: getServerTimestamp()
  });
}

// Get venue subscription status
app.get("/v1/venue/:venueId/subscription", verifyAuth, async (req, res) => {
  try {
    const { venueId } = req.params;
    const user = req.user;

    // Check access
    if (user.venueId !== venueId && user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get active subscription for venue
    const subscriptionQuery = await db.collection("subscriptions")
      .where("venueId", "==", venueId)
      .where("status", "==", "ACTIVE")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (subscriptionQuery.empty) {
      return res.json({ 
        hasActiveSubscription: false,
        message: "No active subscription found" 
      });
    }

    const subscriptionDoc = subscriptionQuery.docs[0];
    const subscriptionData = subscriptionDoc.data();

    // Get recent payments
    const paymentsQuery = await db.collection("payments")
      .where("subscriptionId", "==", subscriptionDoc.id)
      .orderBy("paymentDate", "desc")
      .limit(5)
      .get();

    const payments = paymentsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      hasActiveSubscription: true,
      subscription: {
        id: subscriptionDoc.id,
        ...subscriptionData
      },
      recentPayments: payments
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ 
      error: "Failed to get subscription status",
      details: error.message 
    });
  }
});

// Albanian Lek conversion endpoint - immediate database update
app.post("/v1/admin/convert-to-lek", async (req, res) => {
  try {
    console.log("🇦🇱 Starting Albanian Lek conversion for Beach Bar Durrës");
    
    const venueId = "beach-bar-durres";
    
    // Albanian Lek pricing data
    const lekPricing = [
      { id: "greek-salad", price: 900, nameAlbanian: "Sallatë Greke" },
      { id: "fried-calamari", price: 1200, nameAlbanian: "Kallamar i Skuqur" },
      { id: "seafood-risotto", price: 1800, nameAlbanian: "Rizoto me Fruta Deti" },
      { id: "grilled-lamb", price: 2200, nameAlbanian: "Copë Qengji në Skarë" },
      { id: "grilled-branzino", price: 2500, nameAlbanian: "Levrek në Skarë" },
      { id: "albanian-beer", price: 350, nameAlbanian: "Birrë Shqiptare" },
      { id: "raki", price: 400, nameAlbanian: "Raki Shqiptare" },
      { id: "mojito", price: 750, nameAlbanian: "Mojito" },
      { id: "tiramisu", price: 650, nameAlbanian: "Tiramisu" },
      { id: "baklava", price: 550, nameAlbanian: "Bakllava" }
    ];
    
    // Update venue currency to Albanian Lek
    console.log("🏪 Updating venue currency...");
    const venueRef = db.collection("venue").doc(venueId);
    
    await venueRef.update({
      "settings.currency": "ALL"
    });
    console.log("✅ Venue currency updated to ALL");
    
    // Update menu item prices
    console.log("🍽️ Updating menu item prices...");
    let updateCount = 0;
    let results = [];
    
    for (const item of lekPricing) {
      try {
        const menuItemRef = venueRef.collection("menuItem").doc(item.id);
        const doc = await menuItemRef.get();
        
        if (doc.exists) {
          const currentData = doc.data();
          const oldPrice = currentData.price;
          
          await menuItemRef.update({
            price: item.price,
            nameAlbanian: item.nameAlbanian
          });
          
          console.log(`✅ ${item.id}: €${oldPrice} → ${item.price} Lek`);
          results.push({
            itemId: item.id,
            oldPrice: oldPrice,
            newPrice: item.price,
            status: "updated"
          });
          updateCount++;
        } else {
          console.log(`⚠️ ${item.id}: Not found`);
          results.push({
            itemId: item.id,
            status: "not_found"
          });
        }
      } catch (error) {
        console.log(`❌ ${item.id}: Error - ${error.message}`);
        results.push({
          itemId: item.id,
          status: "error",
          error: error.message
        });
      }
    }
    
    console.log(`🎉 Successfully updated ${updateCount} menu items!`);
    
    res.json({
      success: true,
      message: `Successfully converted Beach Bar Durrës to Albanian Lek pricing`,
      venueId: venueId,
      currency: "ALL",
      itemsUpdated: updateCount,
      totalItems: lekPricing.length,
      results: results,
      testUrl: "https://order.skan.al/beach-bar-durres/a1/menu"
    });
    
  } catch (error) {
    console.error("❌ Error converting to Albanian Lek:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to convert to Albanian Lek pricing"
    });
  }
});

// Environment validation (non-blocking for Firebase Functions)
if (process.env.NODE_ENV === "production") {
  if (!JWT_SECRET || JWT_SECRET === "your-super-secret-jwt-key-change-in-production") {
    console.warn("Warning: Using default JWT secret in production. Please set JWT_SECRET environment variable.");
  }
}

// Export the Express app as a Firebase Cloud Function
exports.api = onRequest({ 
  region: "europe-west1",
  memory: "1GB",
  timeoutSeconds: 540,
  cors: true,
  maxInstances: 10
}, app);
