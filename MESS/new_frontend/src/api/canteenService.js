/**
 * Canteen/Items API Service
 */
import http from './http';

const canteenService = {
  // Student APIs

  // Get available canteen items (public)
  async getAvailableItems() {
    const response = await http.get('/canteen/available');
    return response;
  },

  // Vendor/Contractor APIs

  // Get all items for contractor
  async getAllItems() {
    const response = await http.get('/canteen/all');
    return response;
  },

  // Add new canteen item
  async addItem(name, price, category, imageUrl, isAvailable = true) {
    const response = await http.post('/canteen/items', {
      name,
      price,
      category,
      imageUrl,
      isAvailable,
    });
    return response;
  },

  // Edit canteen item
  async editItem(id, updates) {
    const response = await http.put(`/canteen/items/${id}`, updates);
    return response;
  },

  // Delete canteen item
  async deleteItem(id) {
    const response = await http.delete(`/canteen/items/${id}`);
    return response;
  },

  // Set item availability
  async setAvailability(itemId, isAvailable) {
    const response = await http.put('/canteen/availability', {
      itemId,
      isAvailable,
    });
    return response;
  },

  // Get complaints for vendor
  async getComplaints() {
    const response = await http.get('/canteen/complaints');
    return response;
  },

  // Resolve complaint
  async resolveComplaint(complaintId, resolution) {
    const response = await http.put(`/canteen/complaints/${complaintId}/resolve`, {
      resolution,
    });
    return response;
  },

  // Search students
  async searchStudents(query) {
    const response = await http.get(`/canteen/students?search=${query}`);
    return response;
  },

  // Get contractor requests
  async getContractorRequests() {
    const response = await http.get('/canteen/requests');
    return response;
  },

  // Create contractor request
  async createContractorRequest(subject, message) {
    const response = await http.post('/canteen/requests', {
      subject,
      message,
    });
    return response;
  },
};

export default canteenService;
