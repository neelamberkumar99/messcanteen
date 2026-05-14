/**
 * Admin API Service
 */
import http from './http';

const adminService = {
  // Students Management

  // Get all students
  async getStudents() {
    const response = await http.get('/admin/students');
    return response;
  },

  // Add student
  async addStudent(name, email, password, rollNumber, hostelId) {
    const response = await http.post('/admin/students', {
      name,
      email,
      password,
      rollNumber,
      hostelId,
    });
    return response;
  },

  // Update student
  async updateStudent(studentId, updates) {
    const response = await http.put(`/admin/students/${studentId}`, updates);
    return response;
  },

  // Deactivate student
  async deactivateStudent(studentId) {
    const response = await http.put(`/admin/students/${studentId}/deactivate`, {});
    return response;
  },

  // Contractors Management

  // Get all contractors
  async getContractors() {
    const response = await http.get('/admin/contractors');
    return response;
  },

  // Add contractor
  async addContractor(name, email, password, hostelId) {
    const response = await http.post('/admin/contractors', {
      name,
      email,
      password,
      hostelId,
    });
    return response;
  },

  // Update contractor
  async updateContractor(contractorId, updates) {
    const response = await http.put(`/admin/contractors/${contractorId}`, updates);
    return response;
  },

  // Staff Management

  // Get all staff
  async getStaff() {
    const response = await http.get('/admin/staff');
    return response;
  },

  // Add staff member
  async addStaff(name, email, password, hostelId) {
    const response = await http.post('/admin/staff', {
      name,
      email,
      password,
      hostelId,
    });
    return response;
  },

  // Update staff
  async updateStaff(staffId, updates) {
    const response = await http.put(`/admin/staff/${staffId}`, updates);
    return response;
  },

  // Complaints & Feedback

  // Get complaints
  async getComplaints() {
    const response = await http.get('/admin/complaints');
    return response;
  },

  // Resolve complaint
  async resolveComplaint(complaintId, resolution) {
    const response = await http.put(`/admin/complaints/${complaintId}`, {
      resolution,
      status: 'resolved',
    });
    return response;
  },

  // Contractor Requests

  // Get contractor requests
  async getContractorRequests() {
    const response = await http.get('/admin/contractor-requests');
    return response;
  },

  // Resolve contractor request
  async resolveContractorRequest(requestId, action, notes = '') {
    const response = await http.put(`/admin/contractor-requests/${requestId}/resolve`, {
      action,
      notes,
    });
    return response;
  },

  // Statistics & Reports

  // Get admin statistics
  async getStats() {
    const response = await http.get('/admin/stats');
    return response;
  },

  // Get reports
  async getReports() {
    const response = await http.get('/admin/reports');
    return response;
  },

  // Get diet metrics
  async getDietMetrics() {
    const response = await http.get('/admin/diet-metrics');
    return response;
  },

  // Get hostel by ID
  async getHostelById(hostelId) {
    const response = await http.get(`/admin/hostel/${hostelId}`);
    return response;
  },

  // Notifications

  // Get notification log
  async getNotificationLog() {
    const response = await http.get('/admin/notifications');
    return response;
  },

  // Send bulk notification
  async sendBulkNotification(title, message, recipients) {
    const response = await http.post('/admin/notifications/bulk', {
      title,
      message,
      recipients,
    });
    return response;
  },

  // Send payment reminder
  async triggerPaymentReminder() {
    const response = await http.post('/admin/notifications/payment-reminder', {});
    return response;
  },

  // Send due alert
  async triggerDueAlert() {
    const response = await http.post('/admin/notifications/due-alert', {});
    return response;
  },

  // Settings

  // Set payment due days
  async setPaymentDueDays(paymentDueDays) {
    const response = await http.put('/admin/settings/payment-due-days', {
      paymentDueDays,
    });
    return response;
  },

  // Set payment method
  async setPaymentMethod(settings) {
    const response = await http.put('/admin/settings/payment-method', settings);
    return response;
  },

  // Set diet rules
  async setDietRules(rules) {
    const response = await http.put('/admin/settings/diet-rules', rules);
    return response;
  },

  // Fine Rules
  async getFineRules() {
    const response = await http.get('/admin/fines/rules');
    return response;
  },

  async setFineRules(fineData) {
    const response = await http.post('/admin/fines/rules', fineData);
    return response;
  },
};

export default adminService;
