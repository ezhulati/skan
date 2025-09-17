const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

// Middleware to verify authentication for protected routes
// eslint-disable-next-line no-unused-vars
const verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
    
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// ============================================================================
// VENUE & MENU ENDPOINTS
// ============================================================================

// Get venue menu by slug
app.get("/v1/venue/:slug/menu", async (req, res) => {
  try {
    const { slug } = req.params;
    
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
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
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
      items,
      totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
      specialInstructions: specialInstructions || "",
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
    
    // Return demo orders for demo venue
    if (venueId === "demo-venue-1") {
      const now = new Date();
      const demoOrders = [
        {
          id: "demo-order-1",
          venueId: "demo-venue-1",
          tableNumber: "5",
          orderNumber: "ORD-001",
          customerName: "John Smith",
          items: [
            { name: "Margherita Pizza", price: 14.99, quantity: 1 },
            { name: "Caesar Salad", price: 8.99, quantity: 1 },
            { name: "Coca Cola", price: 2.99, quantity: 2 }
          ],
          totalAmount: 29.96,
          status: "new",
          createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
        },
        {
          id: "demo-order-2",
          venueId: "demo-venue-1",
          tableNumber: "3",
          orderNumber: "ORD-002",
          customerName: "Sarah Johnson",
          items: [
            { name: "Chicken Burger", price: 12.99, quantity: 1 },
            { name: "French Fries", price: 4.99, quantity: 1 }
          ],
          totalAmount: 17.98,
          status: "preparing",
          createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString()
        },
        {
          id: "demo-order-3",
          venueId: "demo-venue-1",
          tableNumber: "7",
          orderNumber: "ORD-003",
          customerName: "Mike Davis",
          items: [
            { name: "Fish & Chips", price: 15.99, quantity: 1 },
            { name: "Beer", price: 4.99, quantity: 2 }
          ],
          totalAmount: 25.97,
          status: "ready",
          createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
        }
      ];
      
      // Filter by status if specified
      let filteredOrders = demoOrders;
      if (status && status !== "all") {
        if (status === "active") {
          filteredOrders = demoOrders.filter(order => ["new", "preparing", "ready"].includes(order.status));
        } else {
          filteredOrders = demoOrders.filter(order => order.status === status);
        }
      }
      
      return res.json(filteredOrders);
    }
    
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
    
    res.json(orders);
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add timestamp for specific status changes
    if (status === "preparing") {
      updateData.preparedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === "ready") {
      updateData.readyAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === "served") {
      updateData.servedAt = admin.firestore.FieldValue.serverTimestamp();
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
      createdAt: admin.firestore.FieldValue.serverTimestamp()
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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    
    // Check if user already exists
    const existingUserSnapshot = await db.collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    
    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ error: "User with this email already exists" });
    }
    
    // Generate password hash
    const crypto = require("crypto");
    const salt = crypto.randomBytes(32);
    const hashedPassword = crypto.scryptSync(password, salt, 64);
    
    // Create user document
    const userData = {
      email: email.toLowerCase(),
      passwordHash: hashedPassword.toString("hex"),
      salt: salt.toString("hex"),
      fullName,
      role: ["admin", "manager", "staff"].includes(role) ? role : "staff",
      venueId: venueId || null,
      isActive: true,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const userRef = await db.collection("users").add(userData);
    
    // Create custom token for immediate login
    const customToken = await admin.auth().createCustomToken(userRef.id, {
      venueId: userData.venueId,
      role: userData.role
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
    
    // Generate new password hash
    const crypto = require("crypto");
    const salt = crypto.randomBytes(32);
    const hashedPassword = crypto.scryptSync(newPassword, salt, 64);
    
    // Update user with new password and clear reset token
    await userDoc.ref.update({
      passwordHash: hashedPassword.toString("hex"),
      salt: salt.toString("hex"),
      resetToken: admin.firestore.FieldValue.delete(),
      resetTokenExpiry: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ message: "Password reset successfully" });
    
  } catch (error) {
    console.error("Error confirming password reset:", error);
    res.status(500).json({ error: "Password reset confirmation failed" });
  }
});

// Restaurant staff login
app.post("/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    // Demo user for testing - check first
    if (email === "manager_email1@gmail.com" && password === "demo123") {
      return res.json({
        message: "Login successful",
        user: {
          id: "demo-user-1",
          email: "manager_email1@gmail.com",
          fullName: "Demo Manager",
          role: "manager",
          venueId: "demo-venue-1"
        },
        venue: {
          id: "demo-venue-1",
          name: "Demo Restaurant",
          slug: "demo-restaurant"
        }
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
    
    // Validate password
    if (userData.passwordHash && userData.salt) {
      const crypto = require("crypto");
      const salt = Buffer.from(userData.salt, "hex");
      const hashedPassword = crypto.scryptSync(password, salt, 64);
      
      if (hashedPassword.toString("hex") !== userData.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
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
    
    // Return user data without custom token (for now)
    res.json({
      message: "Login successful",
      user: {
        id: userDoc.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId
      },
      venue: venueData,
      // Temporary token placeholder
      token: `temp_${userDoc.id}_${Date.now()}`
    });
    
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
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
    
    query = query.orderBy("createdAt", "desc").limit(parseInt(limit));
    
    const usersSnapshot = await query.get();
    
    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId,
        isActive: userData.isActive,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt?.toDate()?.toISOString(),
        updatedAt: userData.updatedAt?.toDate()?.toISOString()
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
    
    // Generate invitation token
    const crypto = require("crypto");
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 3600000); // 7 days from now
    
    // Create invitation document
    const inviteData = {
      email: email.toLowerCase(),
      fullName,
      role: ["admin", "manager", "staff"].includes(role) ? role : "staff",
      venueId: req.user.venueId,
      invitedBy: req.user.uid,
      inviteToken,
      inviteTokenExpiry: admin.firestore.Timestamp.fromDate(inviteTokenExpiry),
      isUsed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const inviteRef = await db.collection("invitations").add(inviteData);
    
    // TODO: Send invitation email
    console.log(`Invitation created for ${email}. Token: ${inviteToken}`);
    
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
    
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    
    // Find invitation by token
    const invitationsSnapshot = await db.collection("invitations")
      .where("inviteToken", "==", token)
      .where("isUsed", "==", false)
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
    
    // Generate password hash
    const crypto = require("crypto");
    const salt = crypto.randomBytes(32);
    const hashedPassword = crypto.scryptSync(password, salt, 64);
    
    // Create user document
    const userData = {
      email: inviteData.email,
      passwordHash: hashedPassword.toString("hex"),
      salt: salt.toString("hex"),
      fullName: inviteData.fullName,
      role: inviteData.role,
      venueId: inviteData.venueId,
      isActive: true,
      emailVerified: true, // Pre-verified through invitation
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const userRef = await db.collection("users").add(userData);
    
    // Mark invitation as used
    await inviteDoc.ref.update({
      isUsed: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: userRef.id
    });
    
    // Create custom token for immediate login
    const customToken = await admin.auth().createCustomToken(userRef.id, {
      venueId: userData.venueId,
      role: userData.role
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long" 
      });
    }
    
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const venueRef = await db.collection("venue").add(venueData);
    const venueId = venueRef.id;
    
    // Create owner user account
    const crypto = require("crypto");
    const salt = crypto.randomBytes(32);
    const hashedPassword = crypto.scryptSync(password, salt, 64);
    
    const userData = {
      email: ownerEmail.toLowerCase(),
      passwordHash: hashedPassword.toString("hex"),
      salt: salt.toString("hex"),
      fullName: ownerName.trim(),
      role: "manager", // Venue owner gets manager role
      venueId: venueId,
      isActive: true,
      emailVerified: false, // Will need email verification
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        createdAt: admin.firestore.FieldValue.serverTimestamp()
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
        createdAt: admin.firestore.FieldValue.serverTimestamp()
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
  
  // Get count of orders today
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));
  
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

// Root endpoint with API documentation
app.get("/", (req, res) => {
  res.json({ 
    message: "Skan.al API - QR Code Ordering System",
    version: "1.0.0",
    documentation: "https://api.skan.al/docs",
    endpoints: {
      venues: {
        "GET /v1/venue/:slug/menu": "Get venue menu by slug",
        "GET /v1/venue/:slug/tables": "Get venue tables for QR generation"
      },
      orders: {
        "POST /v1/orders": "Create new order",
        "GET /v1/venue/:venueId/orders": "Get orders for restaurant dashboard",
        "PUT /v1/orders/:orderId/status": "Update order status",
        "GET /v1/orders/:orderId": "Get order details",
        "GET /v1/track/:orderNumber": "Track order by number"
      },
      auth: {
        "POST /v1/auth/login": "Restaurant staff login"
      },
      system: {
        "GET /health": "Health check",
        "GET /": "API information"
      }
    },
    exampleUsage: {
      getMenu: "GET /v1/venue/beach-bar-durres/menu",
      createOrder: "POST /v1/orders",
      trackOrder: "GET /v1/track/SKN-20250915-001"
    }
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
      onboardingCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
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

// Export the Express app as a Firebase Cloud Function
exports.api = onRequest({
  region: "europe-west1"
}, app);