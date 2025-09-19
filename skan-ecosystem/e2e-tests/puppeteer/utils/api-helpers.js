const axios = require('axios');

class ApiHelpers {
  constructor() {
    this.baseURL = 'https://api-mkazmlu7ta-ew.a.run.app/v1';
    this.authToken = null;
  }

  // Login and get auth token
  async login(email = 'manager_email1@gmail.com', password = 'demo123') {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        this.authToken = response.data.token;
        console.log('API login successful');
        return {
          success: true,
          token: this.authToken,
          user: response.data.user,
          venue: response.data.venue
        };
      }

      return { success: false, error: 'No token received' };
    } catch (error) {
      console.error('API login failed:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  // Get venue menu
  async getVenueMenu(venueSlug = 'beach-bar-durres') {
    try {
      const response = await axios.get(`${this.baseURL}/venue/${venueSlug}/menu`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to get venue menu:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Create test order
  async createOrder(orderData) {
    try {
      const response = await axios.post(`${this.baseURL}/orders`, orderData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to create order:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Get venue orders (requires auth)
  async getVenueOrders(venueId, status = 'all') {
    if (!this.authToken) {
      throw new Error('Authentication required. Call login() first.');
    }

    try {
      const response = await axios.get(`${this.baseURL}/venue/${venueId}/orders`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        params: { status }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to get venue orders:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Update order status (requires auth)
  async updateOrderStatus(orderId, status) {
    if (!this.authToken) {
      throw new Error('Authentication required. Call login() first.');
    }

    try {
      const response = await axios.put(`${this.baseURL}/orders/${orderId}/status`, 
        { status },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to update order status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Track order by order number
  async trackOrder(orderNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/track/${orderNumber}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to track order:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL.replace('/v1', '')}/health`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Health check failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = ApiHelpers;