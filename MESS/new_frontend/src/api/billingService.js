/**
 * Billing & Payments API Service
 */
import http from './http';

const billingService = {
  // Student APIs

  // Get current/live bill
  async getLiveBill() {
    const response = await http.get('/billing/live');
    return response;
  },

  // Get bill history
  async getBillHistory() {
    const response = await http.get('/billing/history');
    return response;
  },

  // Get daily breakdown for current month
  async getDailyBreakdown() {
    const response = await http.get('/billing/breakdown');
    return response;
  },

  // Get specific bill
  async getBillById(billId) {
    const response = await http.get(`/billing/${billId}`);
    return response;
  },

  // Admin APIs

  // Get all student bills
  async getAllStudentBills() {
    const response = await http.get('/billing/all-students');
    return response;
  },

  // Generate monthly bills
  async generateMonthlyBills() {
    const response = await http.post('/billing/generate', {});
    return response;
  },

  // Update fines
  async updateFines(billId, fineAmount) {
    const response = await http.post('/billing/update-fines', {
      billId,
      fineAmount,
    });
    return response;
  },

  // Get fine breakdown
  async getFineBreakdown(billId) {
    const response = await http.get(`/fines/breakdown/${billId}`);
    return response;
  },

  // Get fine rules
  async getFineRules() {
    const response = await http.get('/fines/rules');
    return response;
  },

  // Set fine rules (admin)
  async setFineRules(rules) {
    const response = await http.put('/fines/rules', { rules });
    return response;
  },
};

export default billingService;
