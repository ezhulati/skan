const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Demo data
const venues = {
  'beach-bar-durres': {
    id: 'venue1',
    name: 'Beach Bar Durrës',
    slug: 'beach-bar-durres',
    address: 'Durrës Beach, Albania',
    phone: '+355 XX XXX XXX'
  }
};

const menuCategories = [
  {
    id: 'drinks',
    name: 'Drinks',
    nameEn: 'Drinks',
    items: [
      { id: 'beer1', name: 'Albanian Beer', nameEn: 'Albanian Beer', price: 3.50, isActive: true, categoryId: 'drinks' },
      { id: 'aperol1', name: 'Aperol Spritz', nameEn: 'Aperol Spritz', price: 8.50, isActive: true, categoryId: 'drinks' },
      { id: 'wine1', name: 'House Wine', nameEn: 'House Wine', price: 6.00, isActive: true, categoryId: 'drinks' }
    ]
  },
  {
    id: 'food',
    name: 'Food',
    nameEn: 'Food', 
    items: [
      { id: 'salad1', name: 'Greek Salad', nameEn: 'Greek Salad', price: 12.00, isActive: true, categoryId: 'food' },
      { id: 'fish1', name: 'Grilled Fish', nameEn: 'Grilled Fish', price: 18.00, isActive: true, categoryId: 'food' },
      { id: 'pasta1', name: 'Seafood Pasta', nameEn: 'Seafood Pasta', price: 15.00, isActive: true, categoryId: 'food' }
    ]
  }
];

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  try {
    const storedBuffer = Buffer.from(hash, 'hex');
    if (storedBuffer.length === 0) {
      return false;
    }
    const derived = crypto.scryptSync(password, salt, storedBuffer.length);
    return crypto.timingSafeEqual(storedBuffer, derived);
  } catch (error) {
    console.error('Error verifying demo password hash', error);
    return false;
  }
}

const users = [
  {
    id: 'user1',
    email: 'manager_email@gmail.com',
    fullName: 'Restaurant Manager',
    role: 'manager',
    venueId: 'venue1',
    isActive: true,
    passwordHash: createPasswordHash('demo123')
  }
];

let orders = [];
let orderCounter = 1;

const menuItemsById = menuCategories.reduce((acc, category) => {
  category.items.forEach(item => {
    acc[item.id] = item;
  });
  return acc;
}, {});

// Helper function to generate order numbers
function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = orderCounter++;
  return `SKN-${dateStr}-${randomSuffix.toString().padStart(3, '0')}`;
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/venue/:slug/menu', (req, res) => {
  const { slug } = req.params;
  const venue = venues[slug];
  
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }
  
  res.json({
    venue: venue,
    menu: menuCategories
  });
});

app.post('/orders', (req, res) => {
  const { venueId, tableNumber, customerName, items } = req.body;
  
  if (!venueId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const normalizedTableNumber = String(tableNumber).trim();
  if (!normalizedTableNumber) {
    return res.status(400).json({ error: 'Table number is required' });
  }

  const validatedItems = [];

  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) {
      return res.status(400).json({ error: 'Invalid menu item in order' });
    }

    const menuItem = menuItemsById[item.id];
    if (!menuItem || menuItem.isActive === false) {
      return res.status(400).json({ error: 'Menu item not found' });
    }

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Invalid quantity for menu item' });
    }

    validatedItems.push({
      id: menuItem.id,
      name: menuItem.name,
      nameEn: menuItem.nameEn,
      price: menuItem.price,
      quantity
    });
  }

  const totalAmount = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const orderNumber = generateOrderNumber();
  
  const order = {
    id: `order_${Date.now()}`,
    venueId: venueId,
    tableNumber: normalizedTableNumber,
    orderNumber: orderNumber,
    customerName: (customerName && typeof customerName === 'string' ? customerName.trim() : '') || 'Anonymous',
    items: validatedItems,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  orders.push(order);
  
  res.status(201).json({
    orderId: order.id,
    orderNumber: orderNumber,
    totalAmount: order.totalAmount,
    message: 'Order created successfully'
  });
});

app.get('/venue/:venueId/orders', (req, res) => {
  const { venueId } = req.params;
  const { status } = req.query;
  
  let filteredOrders = orders.filter(order => order.venueId === venueId);
  
  if (status && status !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }
  
  // Sort by creation time, newest first
  filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(filteredOrders);
});

app.put('/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  const validStatuses = ['new', 'preparing', 'ready', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date().toISOString();
  
  res.json({
    message: 'Order status updated successfully',
    orderId: orderId,
    status: status
  });
});

// Menu Management Endpoints
app.get('/venue/:venueId/menu-management', (req, res) => {
  const { venueId } = req.params;
  
  res.json({
    venue: venues[Object.keys(venues)[0]], // For demo, return first venue
    categories: menuCategories
  });
});

app.post('/venue/:venueId/categories', (req, res) => {
  const { name, nameEn } = req.body;
  
  if (!name || !nameEn) {
    return res.status(400).json({ error: 'Name and nameEn are required' });
  }
  
  const newCategory = {
    id: `category_${Date.now()}`,
    name,
    nameEn,
    items: []
  };
  
  menuCategories.push(newCategory);
  
  res.json({
    message: 'Category created successfully',
    category: newCategory
  });
});

app.put('/venue/:venueId/categories/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const { name, nameEn } = req.body;
  
  const categoryIndex = menuCategories.findIndex(cat => cat.id === categoryId);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  if (name) menuCategories[categoryIndex].name = name;
  if (nameEn) menuCategories[categoryIndex].nameEn = nameEn;
  
  res.json({
    message: 'Category updated successfully',
    category: menuCategories[categoryIndex]
  });
});

app.delete('/venue/:venueId/categories/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  
  const categoryIndex = menuCategories.findIndex(cat => cat.id === categoryId);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  menuCategories.splice(categoryIndex, 1);
  
  res.json({
    message: 'Category deleted successfully'
  });
});

app.post('/venue/:venueId/categories/:categoryId/items', (req, res) => {
  const { categoryId } = req.params;
  const { name, nameEn, price, isActive = true } = req.body;
  
  if (!name || !nameEn || price === undefined) {
    return res.status(400).json({ error: 'Name, nameEn, and price are required' });
  }
  
  const category = menuCategories.find(cat => cat.id === categoryId);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  const newItem = {
    id: `item_${Date.now()}`,
    name,
    nameEn,
    price: parseFloat(price),
    isActive,
    categoryId
  };
  
  category.items.push(newItem);
  
  res.json({
    message: 'Menu item created successfully',
    item: newItem
  });
});

app.put('/venue/:venueId/categories/:categoryId/items/:itemId', (req, res) => {
  const { categoryId, itemId } = req.params;
  const { name, nameEn, price, isActive } = req.body;
  
  const category = menuCategories.find(cat => cat.id === categoryId);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  const itemIndex = category.items.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  
  if (name) category.items[itemIndex].name = name;
  if (nameEn) category.items[itemIndex].nameEn = nameEn;
  if (price !== undefined) category.items[itemIndex].price = parseFloat(price);
  if (isActive !== undefined) category.items[itemIndex].isActive = isActive;
  
  res.json({
    message: 'Menu item updated successfully',
    item: category.items[itemIndex]
  });
});

app.delete('/venue/:venueId/categories/:categoryId/items/:itemId', (req, res) => {
  const { categoryId, itemId } = req.params;
  
  const category = menuCategories.find(cat => cat.id === categoryId);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  const itemIndex = category.items.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  
  category.items.splice(itemIndex, 1);
  
  res.json({
    message: 'Menu item deleted successfully'
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Simple demo authentication
  const user = users.find(u => u.email === email && u.isActive);
  
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const venue = Object.values(venues).find(v => v.id === user.venueId);
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      venueId: user.venueId
    },
    venue: venue || null
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🍺 Demo venue: http://localhost:${PORT}/venue/beach-bar-durres/menu`);
  console.log(`🔑 Demo login: manager_email@gmail.com / demo123`);
});
