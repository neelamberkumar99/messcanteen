/**
 * Authentication API Service
 */
import http from './http';

const authService = {
  // Register new user
  async register(email, password, name, role, hostelId, rollNumber, roomNumber) {
    const response = await http.post('/auth/register', {
      email,
      password,
      name,
      role,
      hostelId,
      rollNumber,
      roomNumber
    });
    if (response.token) {
      http.setToken(response.token);
    }
    return response;
  },

  // Login user
  async login(email, password) {
    const response = await http.post('/auth/login', { email, password });
    if (response.token) {
      http.setToken(response.token);
    }
    return response;
  },

  // Get current user profile
  async getMe() {
    const response = await http.get('/auth/me');
    return response.user;
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    const response = await http.put('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response;
  },

  // Logout
  logout() {
    http.clearToken();
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!http.getToken();
  },
};

export default authService;
