import { test, expect } from '@playwright/test';
import { AdminPortalPage } from '../../page-objects/AdminPortalPage';
import { TEST_DATA } from '../../test-data/constants';

test.describe('Admin Portal - Order Management', () => {
  let adminPage: AdminPortalPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPortalPage(page);
    await adminPage.login(); // Login before each test
  });

  test('should display orders list correctly', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    // Check if orders are displayed or empty state is shown
    const orderCards = adminPage.orderCards;
    const orderCount = await orderCards.count();
    
    if (orderCount > 0) {
      // Verify order cards have required information
      for (let i = 0; i < Math.min(orderCount, 3); i++) {
        const orderCard = orderCards.nth(i);
        
        // Each order should have order ID, customer name, status, and total
        const orderId = orderCard.locator('.order-id, [data-order-id]');
        const customerName = orderCard.locator('.customer-name, [data-customer]');
        const status = orderCard.locator('.order-status, [data-status]');
        const total = orderCard.locator('.order-total, [data-total]');
        
        await expect(orderId).toBeVisible();
        await expect(customerName).toBeVisible();
        await expect(status).toBeVisible();
        await expect(total).toBeVisible();
      }
    } else {
      // Verify empty state
      const emptyState = adminPage.page.locator('.empty-state, .no-orders');
      await expect(emptyState).toBeVisible();
    }
  });

  test('should filter orders by status', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    const initialOrderCount = await adminPage.orderCards.count();
    
    if (initialOrderCount > 0) {
      // Test filtering by pending
      await adminPage.filterOrdersByStatus('pending');
      
      // Verify filter is applied
      const filteredOrders = adminPage.orderCards;
      const filteredCount = await filteredOrders.count();
      
      // Should show only pending orders or none
      if (filteredCount > 0) {
        const firstOrder = filteredOrders.first();
        const status = firstOrder.locator('.order-status');
        const statusText = await status.textContent();
        expect(statusText?.toLowerCase()).toContain('pending');
      }
      
      // Test filter reset
      await adminPage.filterOrdersByStatus('all');
      const allOrdersCount = await adminPage.orderCards.count();
      expect(allOrdersCount).toBeGreaterThanOrEqual(filteredCount);
    }
  });

  test('should search orders correctly', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    const initialOrderCount = await adminPage.orderCards.count();
    
    if (initialOrderCount > 0) {
      // Get the first order's customer name for search
      const firstOrder = adminPage.orderCards.first();
      const customerElement = firstOrder.locator('.customer-name, [data-customer]');
      const customerName = await customerElement.textContent();
      
      if (customerName) {
        // Search for this customer
        await adminPage.searchOrders(customerName);
        
        // Verify search results
        const searchResults = adminPage.orderCards;
        const resultCount = await searchResults.count();
        
        // Should show at least the order we searched for
        expect(resultCount).toBeGreaterThan(0);
        
        // Verify search result contains the searched customer
        const firstResult = searchResults.first();
        const resultCustomer = firstResult.locator('.customer-name');
        await expect(resultCustomer).toContainText(customerName);
      }
    }
  });

  test('should view order details', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    const orderCount = await adminPage.orderCards.count();
    
    if (orderCount > 0) {
      // Click on first order
      await adminPage.viewOrderDetails(0);
      
      // Verify order details page
      await expect(adminPage.orderDetails).toBeVisible();
      
      // Verify order information is displayed
      const orderInfo = adminPage.orderInfo;
      const orderItems = adminPage.orderItems;
      const customerInfo = adminPage.customerInfo;
      
      await expect(orderInfo).toBeVisible();
      await expect(orderItems).toBeVisible();
      await expect(customerInfo).toBeVisible();
      
      // Check for order ID
      const orderIdElement = adminPage.page.locator('.order-id, [data-order-id]');
      await expect(orderIdElement).toBeVisible();
      
      const orderIdText = await orderIdElement.textContent();
      expect(orderIdText).toMatch(/\w+/);
    }
  });

  test('should update order status', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    const orderCount = await adminPage.orderCards.count();
    
    if (orderCount > 0) {
      // View order details
      await adminPage.viewOrderDetails(0);
      
      // Get current status
      const currentStatusElement = adminPage.page.locator('.order-status, [data-status]');
      const currentStatus = await currentStatusElement.textContent();
      
      // Update to a different status
      const newStatus = currentStatus?.toLowerCase().includes('pending') ? 'preparing' : 'ready';
      
      await adminPage.updateOrderStatus(newStatus);
      
      // Verify status was updated
      await expect(currentStatusElement).toContainText(newStatus);
    }
  });

  test('should refresh orders list', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    // Refresh orders
    await adminPage.refreshOrders();
    
    // Verify orders list is still loaded
    await adminPage.verifyOrdersListLoaded();
    
    // Should still show orders or empty state
    const orderCards = adminPage.orderCards;
    const emptyState = adminPage.page.locator('.empty-state, .no-orders');
    
    const hasOrders = await orderCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasOrders || hasEmptyState).toBeTruthy();
  });

  test('should handle real-time order updates', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    // Test real-time updates
    await adminPage.verifyRealTimeUpdates();
  });

  test('should verify order notifications', async () => {
    await adminPage.verifyDashboardLoaded();
    
    // Check for notification indicators
    await adminPage.verifyOrderNotifications();
  });

  test('should handle bulk order actions', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    // Test bulk actions if available
    await adminPage.verifyBulkActions();
  });

  test('should complete full admin workflow', async () => {
    // Test complete workflow: login -> view orders -> update status -> logout
    await adminPage.completeAdminWorkflow({
      orderIndex: 0,
      newStatus: 'preparing'
    });
  });

  test('should handle order pagination if present', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    // Check for pagination controls
    const paginationControls = adminPage.page.locator('.pagination, .page-controls');
    
    if (await paginationControls.isVisible()) {
      const nextButton = paginationControls.locator('.next, [data-action="next"]');
      const prevButton = paginationControls.locator('.prev, [data-action="prev"]');
      
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await adminPage.page.waitForTimeout(1000);
        
        // Should load next page of orders
        await adminPage.verifyOrdersListLoaded();
        
        // Go back to first page
        if (await prevButton.isEnabled()) {
          await prevButton.click();
          await adminPage.page.waitForTimeout(1000);
          await adminPage.verifyOrdersListLoaded();
        }
      }
    }
  });

  test('should display order timestamps correctly', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    const orderCount = await adminPage.orderCards.count();
    
    if (orderCount > 0) {
      // Check first order for timestamp
      const firstOrder = adminPage.orderCards.first();
      const timestamp = firstOrder.locator('.order-time, .timestamp, [data-time]');
      
      if (await timestamp.isVisible()) {
        const timeText = await timestamp.textContent();
        
        // Should have a valid time format
        expect(timeText).toMatch(/\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|ago|am|pm/i);
      }
    }
  });

  test('should handle order details with multiple items', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    const orderCount = await adminPage.orderCards.count();
    
    if (orderCount > 0) {
      await adminPage.viewOrderDetails(0);
      
      // Check order items
      const orderItems = adminPage.page.locator('.order-item, .item-row');
      const itemCount = await orderItems.count();
      
      if (itemCount > 0) {
        // Verify each item has name, quantity, and price
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = orderItems.nth(i);
          
          const itemName = item.locator('.item-name, .name');
          const quantity = item.locator('.quantity, .qty');
          const price = item.locator('.price, .item-price');
          
          await expect(itemName).toBeVisible();
          await expect(quantity).toBeVisible();
          await expect(price).toBeVisible();
          
          // Verify quantity is a number
          const qtyText = await quantity.textContent();
          expect(qtyText).toMatch(/\d+/);
          
          // Verify price has currency format
          const priceText = await price.textContent();
          expect(priceText).toMatch(/\$\d+\.\d{2}|\d+\.\d{2}/);
        }
      }
      
      // Verify order total
      const orderTotal = adminPage.page.locator('.order-total, .total-amount');
      if (await orderTotal.isVisible()) {
        const totalText = await orderTotal.textContent();
        expect(totalText).toMatch(/\$\d+\.\d{2}|\d+\.\d{2}/);
      }
    }
  });

  test('should maintain order status consistency', async () => {
    await adminPage.navigateToOrders();
    await adminPage.verifyOrdersListLoaded();
    
    const orderCount = await adminPage.orderCards.count();
    
    if (orderCount > 0) {
      // Get status from orders list
      const firstOrder = adminPage.orderCards.first();
      const listStatus = firstOrder.locator('.order-status');
      const listStatusText = await listStatus.textContent();
      
      // View order details
      await adminPage.viewOrderDetails(0);
      
      // Get status from details page
      const detailStatus = adminPage.page.locator('.order-status, [data-status]');
      const detailStatusText = await detailStatus.textContent();
      
      // Status should be consistent
      expect(listStatusText?.toLowerCase().trim()).toBe(detailStatusText?.toLowerCase().trim());
    }
  });
});