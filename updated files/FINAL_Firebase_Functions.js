const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ============================================================================
// VENUE & MENU ENDPOINTS
// ============================================================================

// Get venue menu by slug
app.get('/v1/venue/:slug/menu', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find venue by slug
    const venuesSnapshot = await db.collection('venue')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (venuesSnapshot.empty) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    const venueDoc = venuesSnapshot.docs[0];
    const venueData = venueDoc.data();
    
    // Get menu categories
    const categoriesSnapshot = await venueDoc.ref
      .collection('menuCategory')
      .get();
    
    // Get all menu items
    const menuItemsSnapshot = await venueDoc.ref
      .collection('menuItem')
      .where('isAvailable', '==', true)
      .orderBy('sortOrder', 'asc')
      .get();
    
    // Organize menu items by category
    const categories = {};
    categoriesSnapshot.docs.forEach(doc => {
      const categoryData = doc.data();
      categories[doc.id] = {
        id: doc.id,
        name: categoryData.name || 'Other',
        nameAlbanian: categoryData.nameAlbanian || categoryData.name,
        items: []
      };
    });
    
    // Add items to categories
    menuItemsSnapshot.docs.forEach(doc => {
      const itemData = doc.data();
      const categoryId = itemData.category || 'other';
      
      if (!categories[categoryId]) {
        categories[categoryId] = {
          id: categoryId,
          name: 'Other',
          nameAlbanian: 'Të tjera',
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
        preparationTime: itemData.preparationTime || 0
      });
    });
    
    // Convert categories object to array and filter out empty categories
    const menuCategories = Object.values(categories)
      .filter(category => category.items.length > 0);
    
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
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Get venue tables for QR generation
app.get('/v1/venue/:slug/tables', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const venuesSnapshot = await db.collection('venue')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (venuesSnapshot.empty) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    const venueDoc = venuesSnapshot.docs[0];
    const tablesSnapshot = await venueDoc.ref
      .collection('table')
      .where('isActive', '==', true)
      .orderBy('tableNumber', 'asc')
      .get();
    
    const tables = tablesSnapshot.docs.map(doc => ({
      id: doc.id,
      tableNumber: doc.data().tableNumber,
      displayName: doc.data().displayName,
      qrUrl: `https://order.skan.al/${slug}/${doc.data().tableNumber}`
    }));
    
    res.json({ tables });
    
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// ============================================================================
// ORDER ENDPOINTS  
// ============================================================================

// Create new order
app.post('/v1/orders', async (req, res) => {
  try {
    const { venueId, tableNumber, customerName, items, specialInstructions } = req.body;
    
    // Validate required fields
    if (!venueId || !tableNumber || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
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
      customerName: customerName || 'Anonymous Customer',
      orderNumber,
      items,
      totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
      specialInstructions: specialInstructions || '',
      status: 'new',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const orderRef = await db.collection('orders').add(orderData);
    
    res.status(201).json({
      orderId: orderRef.id,
      orderNumber,
      status: 'new',
      totalAmount,
      message: 'Order created successfully'
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders for a venue (restaurant dashboard)
app.get('/v1/venue/:venueId/orders', async (req, res) => {
  try {
    const { venueId } = req.params;
    const { status, limit = 50 } = req.query;
    
    let query = db.collection('orders')
      .where('venueId', '==', venueId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const ordersSnapshot = await query.get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString()
    }));
    
    res.json({ orders });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status
app.put('/v1/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['new', 'preparing', 'ready', 'served'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add timestamp for specific status changes
    if (status === 'preparing') {
      updateData.preparedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'ready') {
      updateData.readyAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'served') {
      updateData.servedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await db.collection('orders').doc(orderId).update(updateData);
    
    res.json({ 
      message: 'Order status updated', 
      status,
      orderId 
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get single order details
app.get('/v1/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
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
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get order by order number (for customer tracking)
app.get('/v1/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const ordersSnapshot = await db.collection('orders')
      .where('orderNumber', '==', orderNumber)
      .limit(1)
      .get();
    
    if (ordersSnapshot.empty) {
      return res.status(404).json({ error: 'Order not found' });
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
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// Restaurant staff login
app.post('/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user in users collection
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Get venue information
    let venueData = null;
    if (userData.venueId) {
      const venueDoc = await db.collection('venue').doc(userData.venueId).get();
      if (venueDoc.exists) {
        venueData = {
          id: venueDoc.id,
          name: venueDoc.data().name,
          slug: venueDoc.data().slug
        };
      }
    }
    
    // Create custom token
    const customToken = await admin.auth().createCustomToken(userDoc.id, {
      venueId: userData.venueId,
      role: userData.role
    });
    
    res.json({
      token: customToken,
      user: {
        id: userDoc.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        venueId: userData.venueId
      },
      venue: venueData
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get count of orders today
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));
  
  const todayOrdersSnapshot = await db.collection('orders')
    .where('createdAt', '>=', startOfDay)
    .where('createdAt', '<=', endOfDay)
    .get();
  
  const orderCount = todayOrdersSnapshot.size + 1;
  const paddedCount = orderCount.toString().padStart(3, '0');
  
  return `SKN-${dateStr}-${paddedCount}`;
}

function getEstimatedTime(status, createdAt) {
  const estimatedTimes = {
    'new': '15-20 minutes',
    'preparing': '10-15 minutes',
    'ready': 'Ready for pickup',
    'served': 'Completed'
  };
  
  return estimatedTimes[status] || 'Unknown';
}

// Middleware to verify authentication for protected routes
const verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
    
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================================================
// HEALTH CHECK AND INFO
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'skan-api',
    version: '1.0.0'
  });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({ 
    message: 'Skan.al API - QR Code Ordering System',
    version: '1.0.0',
    documentation: 'https://api.skan.al/docs',
    endpoints: {
      venues: {
        'GET /v1/venue/:slug/menu': 'Get venue menu by slug',
        'GET /v1/venue/:slug/tables': 'Get venue tables for QR generation'
      },
      orders: {
        'POST /v1/orders': 'Create new order',
        'GET /v1/venue/:venueId/orders': 'Get orders for restaurant dashboard',
        'PUT /v1/orders/:orderId/status': 'Update order status',
        'GET /v1/orders/:orderId': 'Get order details',
        'GET /v1/track/:orderNumber': 'Track order by number'
      },
      auth: {
        'POST /v1/auth/login': 'Restaurant staff login'
      },
      system: {
        'GET /health': 'Health check',
        'GET /': 'API information'
      }
    },
    exampleUsage: {
      getMenu: 'GET /v1/venue/beach-bar-durres/menu',
      createOrder: 'POST /v1/orders',
      trackOrder: 'GET /v1/track/SKN-20250915-001'
    }
  });
});

// ============================================================================
// REAL-TIME FUNCTIONS (Optional for future)
// ============================================================================

// Optional: Real-time order notifications
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    console.log('New order created:', orderData.orderNumber);
    
    // Future: Send notifications to restaurant staff
    // SMS, email, push notifications, etc.
    
    return null;
  });

exports.onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status) {
      console.log(`Order ${after.orderNumber} status changed: ${before.status} → ${after.status}`);
      
      // Future: Notify customer of status changes
      // SMS, push notification, etc.
    }
    
    return null;
  });

// Export the Express app as a Firebase Cloud Function
exports.api = functions.region('europe-west1').https.onRequest(app);