/**
 * Student API Service
 */
import http from './http';

const studentService = {
  // Complaints

  // Get my complaints
  async getComplaints() {
    const response = await http.get('/student/complaint');
    return response;
  },

  // Submit complaint
  async submitComplaint(title, category, description, anonymous = false) {
    const response = await http.post('/student/complaint', {
      title,
      category,
      description,
      anonymous,
    });
    return response;
  },
};

export default studentService;
