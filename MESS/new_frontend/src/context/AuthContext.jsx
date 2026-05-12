import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/index';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
          // Fetch current user info
          const userData = await authService.getMe();
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        // Clear invalid token
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(email, password);
      
      if (response.user) {
        setUser(response.user);
        return response.user;
      }
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email, password, name, role) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.register(email, password, name, role);
      
      if (response.user) {
        setUser(response.user);
        return response.user;
      }
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    try {
      authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Change password
  const changePassword = async (oldPassword, newPassword) => {
    try {
      setError(null);
      await authService.changePassword(oldPassword, newPassword);
      return true;
    } catch (err) {
      const message = err.message || 'Failed to change password. Please try again.';
      setError(message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    changePassword,
    isAuthenticated: !!user,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
