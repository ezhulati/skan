const TestData = require('../../utils/test-data');

class CustomerAppPage {
  constructor(page) {
    this.page = page;
    this.testData = TestData;
  }

  // Navigation methods
  async navigateToQR(venueSlug = 'beach-bar-durres', tableNumber = 'a1') {
    const url = this.testData.urls.customerQr(venueSlug, tableNumber);
    console.log(`Navigating to QR URL: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);
  }

  async navigateToMenu(venueSlug = 'beach-bar-durres', tableNumber = 'a1') {
    const url = this.testData.urls.customerMenu(venueSlug, tableNumber);
    console.log(`Navigating to menu: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);
  }

  // Language methods
  async switchToAlbanian() {
    const languageToggle = await this.page.$(this.testData.selectors.customer.languageToggle);
    if (languageToggle) {
      await languageToggle.click();
      await this.page.waitForTimeout(1000);
      console.log('Switched to Albanian language');
    } else {
      console.log('Language toggle not found - using default language');
    }
  }

  async switchToEnglish() {
    const languageToggle = await this.page.$(this.testData.selectors.customer.languageToggle);
    if (languageToggle) {
      const currentText = await this.page.evaluate(el => el.textContent, languageToggle);
      if (currentText.includes('EN') || currentText.includes('English')) {
        await languageToggle.click();
        await this.page.waitForTimeout(1000);
        console.log('Switched to English language');
      }
    }
  }

  // Menu browsing methods
  async getVenueInfo() {
    try {
      const venueNameElement = await this.page.$('h1, .venue-name, [data-testid="venue-name"]');
      const venueName = venueNameElement ? await this.page.evaluate(el => el.textContent, venueNameElement) : null;
      
      console.log(`Venue name found: ${venueName}`);
      return {
        name: venueName,
        isLoaded: !!venueName
      };
    } catch (error) {
      console.error('Error getting venue info:', error);
      return { name: null, isLoaded: false };
    }
  }

  async getMenuCategories() {
    try {
      await this.page.waitForSelector(this.testData.selectors.customer.menuCategory, { timeout: 10000 });
      const categories = await this.page.$$(this.testData.selectors.customer.menuCategory);
      
      const categoryData = [];
      for (let category of categories) {
        const name = await this.page.evaluate(el => {
          const nameEl = el.querySelector('h2, h3, .category-name, [data-testid="category-name"]');
          return nameEl ? nameEl.textContent.trim() : 'Unknown Category';
        }, category);
        categoryData.push({ name });
      }
      
      console.log(`Found ${categoryData.length} menu categories:`, categoryData.map(c => c.name));
      return categoryData;
    } catch (error) {
      console.error('Error getting menu categories:', error);
      return [];
    }
  }

  async getMenuItems() {
    try {
      await this.page.waitForSelector(this.testData.selectors.customer.menuItem, { timeout: 10000 });
      const items = await this.page.$$(this.testData.selectors.customer.menuItem);
      
      const itemData = [];
      for (let item of items) {
        const data = await this.page.evaluate(el => {
          const nameEl = el.querySelector('.item-name, [data-testid="item-name"], h4, h5');
          const priceEl = el.querySelector('.item-price, [data-testid="item-price"], .price');
          const descEl = el.querySelector('.item-description, [data-testid="item-description"], .description');
          
          return {
            name: nameEl ? nameEl.textContent.trim() : 'Unknown Item',
            price: priceEl ? priceEl.textContent.trim() : '0',
            description: descEl ? descEl.textContent.trim() : ''
          };
        }, item);
        itemData.push(data);
      }
      
      console.log(`Found ${itemData.length} menu items`);
      return itemData;
    } catch (error) {
      console.error('Error getting menu items:', error);
      return [];
    }
  }

  // Cart methods
  async addItemToCart(itemName = 'Albanian Beer') {
    try {
      // Look for the item by name and click its add button
      const items = await this.page.$$(this.testData.selectors.customer.menuItem);
      
      for (let item of items) {
        const name = await this.page.evaluate(el => {
          const nameEl = el.querySelector('.item-name, [data-testid="item-name"], h4, h5');
          return nameEl ? nameEl.textContent.trim() : '';
        }, item);
        
        if (name.toLowerCase().includes(itemName.toLowerCase())) {
          const addButton = await item.$(this.testData.selectors.customer.addToCartButton + ', .add-to-cart, button');
          if (addButton) {
            await addButton.click();
            await this.page.waitForTimeout(1000);
            console.log(`Added ${itemName} to cart`);
            return true;
          }
        }
      }
      
      console.log(`Item ${itemName} not found or add button not available`);
      return false;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    }
  }

  async getCartTotal() {
    try {
      const cartTotalElement = await this.page.$(this.testData.selectors.customer.cartTotal + ', .cart-total, .total');
      if (cartTotalElement) {
        const total = await this.page.evaluate(el => el.textContent, cartTotalElement);
        console.log(`Cart total: ${total}`);
        return total;
      }
      return '0';
    } catch (error) {
      console.error('Error getting cart total:', error);
      return '0';
    }
  }

  async viewCart() {
    try {
      const cartIcon = await this.page.$(this.testData.selectors.customer.cartIcon + ', .cart-icon, [href*="cart"]');
      if (cartIcon) {
        await cartIcon.click();
        await this.page.waitForTimeout(2000);
        console.log('Navigated to cart view');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error viewing cart:', error);
      return false;
    }
  }

  // Order methods
  async fillCustomerInfo(customerName = 'Test Customer') {
    try {
      const nameInput = await this.page.$(this.testData.selectors.customer.customerNameInput + ', [name="customerName"], [placeholder*="name"]');
      if (nameInput) {
        await nameInput.click();
        await nameInput.clear();
        await nameInput.type(customerName);
        console.log(`Filled customer name: ${customerName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error filling customer info:', error);
      return false;
    }
  }

  async addSpecialInstructions(instructions = 'Test order - no special requirements') {
    try {
      const instructionsInput = await this.page.$(this.testData.selectors.customer.specialInstructionsInput + ', [name="instructions"], textarea');
      if (instructionsInput) {
        await instructionsInput.click();
        await instructionsInput.type(instructions);
        console.log(`Added special instructions: ${instructions}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding special instructions:', error);
      return false;
    }
  }

  async submitOrder() {
    try {
      const submitButton = await this.page.$(this.testData.selectors.customer.submitOrderButton + ', .submit-order, [type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await this.page.waitForTimeout(3000);
        console.log('Order submitted');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error submitting order:', error);
      return false;
    }
  }

  async getOrderNumber() {
    try {
      await this.page.waitForSelector(this.testData.selectors.customer.orderNumber + ', .order-number, [data-testid="order-id"]', { timeout: 10000 });
      const orderNumberElement = await this.page.$(this.testData.selectors.customer.orderNumber + ', .order-number, [data-testid="order-id"]');
      
      if (orderNumberElement) {
        const orderNumber = await this.page.evaluate(el => el.textContent, orderNumberElement);
        console.log(`Order number: ${orderNumber}`);
        return orderNumber.trim();
      }
      return null;
    } catch (error) {
      console.error('Error getting order number:', error);
      return null;
    }
  }

  async getOrderStatus() {
    try {
      const statusElement = await this.page.$(this.testData.selectors.customer.orderStatus + ', .order-status, .status');
      if (statusElement) {
        const status = await this.page.evaluate(el => el.textContent, statusElement);
        console.log(`Order status: ${status}`);
        return status.trim();
      }
      return null;
    } catch (error) {
      console.error('Error getting order status:', error);
      return null;
    }
  }

  // Validation methods
  async validatePageLoaded(expectedTitle) {
    const title = await this.page.title();
    const url = await this.page.url();
    console.log(`Page loaded - Title: ${title}, URL: ${url}`);
    
    if (expectedTitle) {
      return title.toLowerCase().includes(expectedTitle.toLowerCase());
    }
    return true;
  }

  async validateMenuStructure() {
    const categories = await this.getMenuCategories();
    const items = await this.getMenuItems();
    
    return {
      hasCategories: categories.length > 0,
      hasItems: items.length > 0,
      categoryCount: categories.length,
      itemCount: items.length
    };
  }

  async takeScreenshot(name) {
    return await testUtils.takeScreenshot(this.page, `customer-${name}`);
  }
}

module.exports = CustomerAppPage;