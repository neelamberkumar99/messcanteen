/**
 * Notifications API Service
 */
import http from './http';

const notificationService = {
  // Get my notifications
  async getNotifications() {
    const response = await http.get('/notifications');
    return response;
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    const response = await http.put(`/notifications/${notificationId}/read`, {});
    return response;
  },

  // Mark all as read
  async markAllAsRead() {
    const response = await http.put('/notifications/read-all', {});
    return response;
  },

  // Get unread count
  async getUnreadCount() {
    const response = await http.get('/notifications/unread-count');
    return response;
  },
};

export default notificationService;
