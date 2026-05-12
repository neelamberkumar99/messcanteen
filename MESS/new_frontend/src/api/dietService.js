/**
 * Diet/Meal Plans API Service
 */
import http from './http';

const dietService = {
  // Student APIs

  // Get diet status (breakfast/lunch/dinner on/off)
  async getDietStatus() {
    const response = await http.get('/diet/status');
    return response;
  },

  // Toggle diet off for current day
  async toggleDietOff() {
    const response = await http.post('/diet/toggle-off', {});
    return response;
  },
  
  // Toggle diet on for current day
  async toggleDietOn() {
    const response = await http.post('/diet/toggle-on', {});
    return response;
  },

  // Toggle specific meal (e.g. Lunch) for current day
  async toggleMeal(mealName, date) {
    const response = await http.post('/diet/toggle-meal', { mealName, date });
    return response;
  },

  // Get diet history for student (with month/year filters)
  async getDietHistory(month, year) {
    const response = await http.get(`/diet/history?month=${month}&year=${year}`);
    return response;
  },

  // Get student's diet plan (weekly menu)
  async getDietPlan() {
    const response = await http.get('/diet/plan');
    return response;
  },

  // Vendor/Contractor APIs

  // Get diet plan for editing (vendor)
  async getVendorDietPlan() {
    const response = await http.get('/canteen/diet-plan');
    return response;
  },

  // Update diet plan (vendor)
  async updateVendorDietPlan(title, schedule) {
    const response = await http.put('/canteen/diet-plan', {
      title,
      schedule,
    });
    return response;
  },

  // Admin APIs

  // Update diet rules for hostel
  async updateDietRules(hostelId, dietCutoffTime, dietPricePerDay) {
    const response = await http.put('/diet/rules', {
      hostelId,
      dietCutoffTime,
      dietPricePerDay,
    });
    return response;
  },
};

export default dietService;
