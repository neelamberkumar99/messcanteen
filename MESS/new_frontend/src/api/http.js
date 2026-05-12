/**
 * HTTP Client with JWT Token Management
 * - Auto-adds Authorization header
 * - Handles token refresh
 * - Centralizes error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class HttpClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Store token
  setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    }
  }

  // Clear token
  clearToken() {
    localStorage.removeItem('authToken');
  }

  // Build headers with auth token
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Handle response
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      // Handle 401 - Unauthorized (token expired or invalid)
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      throw {
        status: response.status,
        message: data.message || 'An error occurred',
        data,
      };
    }

    return data;
  }

  // GET Request
  async get(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(options.headers),
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // POST Request
  async post(endpoint, body = {}, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(options.headers),
        body: JSON.stringify(body),
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // PUT Request
  async put(endpoint, body = {}, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(options.headers),
        body: JSON.stringify(body),
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // DELETE Request
  async delete(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(options.headers),
        ...options,
      });

      return await this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Error handler
  handleError(error) {
    console.error('HTTP Error:', error);
  }
}

// Create and export singleton instance
export default new HttpClient();
