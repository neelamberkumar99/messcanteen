import http from './http';

const superAdminService = {
  // Admin Management
  async getAdmins(params) {
    const response = await http.get('/superadmin/admins', { params });
    return response;
  },

  async createAdmin(data) {
    const response = await http.post('/superadmin/admins', data);
    return response;
  },

  async deactivateAdmin(adminId) {
    const response = await http.put(`/superadmin/admins/${adminId}/deactivate`, {});
    return response;
  },

  // Audit Logs
  async getAuditLog(params) {
    const response = await http.get('/superadmin/audit-log', { params });
    return response;
  },

  // Announcements
  async publishAnnouncement(data) {
    const response = await http.post('/superadmin/announcements', data);
    return response;
  },

  // Stats
  async getSystemStats() {
    const response = await http.get('/superadmin/stats');
    return response;
  }
};

export default superAdminService;
