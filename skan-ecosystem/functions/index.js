const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  try {
    const hashBuffer = Buffer.from(hash, "hex");
    if (hashBuffer.length === 0) {
      return false;
    }

    const derivedKey = crypto.scryptSync(password, salt, hashBuffer.length);
    return crypto.timingSafeEqual(hashBuffer, derivedKey);
  } catch (error) {
    console.error("Error verifying password hash", error);
    return false;
  }
}

// Helper function to generate order numbers
function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(Math.random() * 999) + 1;
  return `SKN-${dateStr}-${randomSuffix.toString().padStart(3, "0")}`;
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET /api/venue/:slug/menu - Fetch menu by venue slug
app.get("/venue/:slug/menu", async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find venue by slug
    const venueQuery = await db.collection("venue")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    
    if (venueQuery.empty) {
      return res.status(404).json({ error: "Venue not found" });
    }
    
    const venueDoc = venueQuery.docs[0];
    const venueData = venueDoc.data();
    const venueId = venueDoc.id;
    
    // Fetch menu categories
    const categoriesSnapshot = await db.collection("venue")
      .doc(venueId)
      .collection("menuCategory")
      .orderBy("order", "asc")
      .get();
    
    const menu = [];
    
    // Fetch menu items for each category
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      
      const itemsSnapshot = await db.collection("venue")
        .doc(venueId)
        .collection("menuItem")
        .where("categoryId", "==", categoryDoc.id)
        .where("isActive", "==", true)
        .orderBy("order", "asc")
        .get();
      
      const items = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (items.length > 0) {
        menu.push({
          id: categoryDoc.id,
          name: categoryData.name,
          nameEn: categoryData.nameEn,
          items: items
        });
      }
    }
    
    res.json({
      venue: {
        id: venueId,
        name: venueData.name,
        slug: venueData.slug,
        address: venueData.address,
        phone: venueData.phone
      },
      menu: menu
    });
    
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/orders - Create new order
app.post("/orders", async (req, res) => {
  try {
    const { venueId, tableNumber, customerName, items } = req.body;
    
    // Validate required fields
    if (!venueId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof venueId !== "string" || !venueId.trim()) {
      return res.status(400).json({ error: "Invalid venue ID" });
    }

    const normalizedTableNumber = String(tableNumber).trim();
    if (!normalizedTableNumber) {
      return res.status(400).json({ error: "Table number is required" });
    }

    const menuItemsCollection = db.collection("venue")
      .doc(venueId)
      .collection("menuItem");

    const validatedItems = [];

    for (const item of items) {
      if (!item || typeof item.id !== "string" || !item.id.trim()) {
        return res.status(400).json({ error: "Invalid menu item in order" });
      }

      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: "Invalid quantity for menu item" });
      }

      const menuItemDoc = await menuItemsCollection.doc(item.id).get();
      if (!menuItemDoc.exists) {
        return res.status(400).json({ error: "Menu item not found" });
      }

      const menuItemData = menuItemDoc.data();
      if (menuItemData.isActive === false) {
        return res.status(400).json({ error: "Menu item is not available" });
      }

      const price = Number(menuItemData.price);
      if (!Number.isFinite(price)) {
        return res.status(400).json({ error: "Menu item price is invalid" });
      }

      validatedItems.push({
        id: menuItemDoc.id,
        name: menuItemData.name,
        nameEn: menuItemData.nameEn,
        price,
        quantity
      });
    }

    const totalAmount = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const roundedTotalAmount = Math.round(totalAmount * 100) / 100;

    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Create order document
    const orderData = {
      venueId: venueId,
      tableNumber: normalizedTableNumber,
      orderNumber: orderNumber,
      customerName: (customerName && typeof customerName === "string" ? customerName.trim() : "") || "Anonymous",
      items: validatedItems,
      totalAmount: roundedTotalAmount,
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save to Firestore
    const orderRef = await db.collection("orders").add(orderData);
    
    res.status(201).json({
      orderId: orderRef.id,
      orderNumber: orderNumber,
      totalAmount: orderData.totalAmount,
      message: "Order created successfully"
    });
    
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/venue/:venueId/orders - Get orders for restaurant
app.get("/venue/:venueId/orders", async (req, res) => {
  try {
    const { venueId } = req.params;
    const { status } = req.query;
    
    let query = db.collection("orders")
      .where("venueId", "==", venueId)
      .orderBy("createdAt", "desc");
    
    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }
    
    const ordersSnapshot = await query.get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
    }));
    
    res.json(orders);
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/orders/:orderId/status - Update order status
app.put("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    
    const validStatuses = ["new", "preparing", "ready", "served"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    await orderRef.update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      message: "Order status updated successfully",
      orderId: orderId,
      status: status
    });
    
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login - Restaurant staff login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    // Demo user for testing - check first
    if (email === "manager_email1@gmail.com" && password === "demo123") {
      return res.json({
        message: "Login successful",
        user: {
          id: "demo-user-1",
          email: "manager_email1@gmail.com",
          fullName: "Beach Bar Manager",
          role: "manager",
          venueId: "beach-bar-durres"
        },
        venue: {
          id: "beach-bar-durres",
          name: "Beach Bar Durrës",
          slug: "beach-bar-durres"
        }
      });
    }
    
    // Find user by email
    const userQuery = await db.collection("users")
      .where("email", "==", email)
      .where("isActive", "==", true)
      .limit(1)
      .get();
    
    if (userQuery.empty) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    let passwordAccepted = false;

    if (userData.passwordHash) {
      passwordAccepted = verifyPassword(password, userData.passwordHash);
    } else if (password === process.env.LEGACY_DEMO_PASSWORD || password === "demo123") {
      // Temporary fallback for existing demo accounts without hashed passwords
      passwordAccepted = true;
    }

    if (!passwordAccepted) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Get venue information
    let venueData = null;
    if (userData.venueId) {
      const venueDoc = await db.collection("venue").doc(userData.venueId).get();
      if (venueDoc.exists) {
        venueData = venueDoc.data();
      }
    }
    
    res.json({
      message: "Login successful",
      user: {
        id: userDoc.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId
      },
      venue: venueData ? {
        id: userData.venueId,
        name: venueData.name,
        slug: venueData.slug
      } : null
    });
    
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Beach Bar Lek Pricing Update Endpoint
app.post("/v1/admin/update-beach-bar-lek-pricing", async (req, res) => {
  try {
    console.log("🇦🇱 Starting Beach Bar Durrës EUR to Lek conversion...");
    
    const venueId = "beach-bar-durres";
    const venueRef = db.collection("venues").doc(venueId);
    
    // Albanian Lek menu item updates
    const beachBarLekItems = [
      { id: "greek-salad", price: 900, nameAlbanian: "Sallatë Greke" },
      { id: "fried-calamari", price: 1200, nameAlbanian: "Kallamar i Skuqur" },
      { id: "seafood-risotto", price: 1800, nameAlbanian: "Rizoto me Fruta Deti" },
      { id: "grilled-lamb-chops", price: 2200, nameAlbanian: "Copë Qengji në Skarë" },
      { id: "grilled-sea-bass", price: 2500, nameAlbanian: "Levrek në Skarë" },
      { id: "albanian-beer", price: 350, nameAlbanian: "Birrë Shqiptare" },
      { id: "albanian-raki", price: 400, nameAlbanian: "Raki Shqiptare" },
      { id: "mojito", price: 750, nameAlbanian: "Mojito" },
      { id: "tiramisu", price: 650, nameAlbanian: "Tiramisu" },
      { id: "baklava", price: 550, nameAlbanian: "Bakllava" }
    ];
    
    // Step 1: Update venue currency to Albanian Lek
    await venueRef.update({
      "settings.currency": "ALL"
    });
    
    // Step 2: Update all menu item prices
    const batch = db.batch();
    let updateCount = 0;
    
    for (const item of beachBarLekItems) {
      const menuItemRef = venueRef.collection("menuItem").doc(item.id);
      const doc = await menuItemRef.get();
      
      if (doc.exists) {
        const currentData = doc.data();
        console.log(`Updating ${item.id}: €${(currentData.price/100).toFixed(2)} → ${item.price} Lek`);
        
        batch.update(menuItemRef, {
          price: item.price,
          nameAlbanian: item.nameAlbanian
        });
        updateCount++;
      }
    }
    
    await batch.commit();
    
    console.log(`✅ Beach Bar Durrës updated: ${updateCount} items converted to Albanian Lek`);
    
    res.json({
      success: true,
      message: "Beach Bar Durrës pricing converted to Albanian Lek",
      venueId: venueId,
      currency: "ALL",
      itemsUpdated: updateCount,
      details: beachBarLekItems.map(item => ({
        id: item.id,
        price: `${item.price} Lek`,
        nameAlbanian: item.nameAlbanian
      }))
    });
    
  } catch (error) {
    console.error("❌ Error updating Beach Bar pricing:", error);
    res.status(500).json({ 
      error: "Failed to update Beach Bar pricing",
      message: error.message 
    });
  }
});

// Mount the API routes
exports.api = functions.region("europe-west1").https.onRequest(app);
