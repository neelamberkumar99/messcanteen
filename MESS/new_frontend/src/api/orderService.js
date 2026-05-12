/**
 * Orders API Service
 */
import http from './http';

const orderService = {
  // Student APIs

  // Place new order
  async placeOrder(items, notes = '') {
    const response = await http.post('/orders', {
      items,
      notes,
    });
    return response;
  },

  // Get my orders
  async getMyOrders() {
    const response = await http.get('/orders/my');
    return response;
  },

  // Vendor/Contractor APIs

  // Get pending orders
  async getPendingOrders() {
    const response = await http.get('/orders/pending');
    return response;
  },

  // Get approved orders
  async getApprovedOrders() {
    const response = await http.get('/orders/approved');
    return response;
  },

  // Approve order
  async approveOrder(orderId) {
    const response = await http.put(`/orders/${orderId}/approve`, {});
    return response;
  },

  // Reject order
  async rejectOrder(orderId, reason = '') {
    const response = await http.put(`/orders/${orderId}/reject`, {
      reason,
    });
    return response;
  },

  // Create order for student (vendor can create on behalf of student)
  async createOrderForStudent(studentId, items) {
    const response = await http.post('/orders/contractor-create', {
      studentId,
      items,
    });
    return response;
  },

  // Get order summary
  async getOrderSummary() {
    const response = await http.get('/orders/summary');
    return response;
  },

  // Admin APIs

  // Get all orders
  async getAllOrders() {
    const response = await http.get('/orders/all');
    return response;
  },
};

export default orderService;
