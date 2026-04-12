/**
 * AuthContext - Authentication state management
 * Handles user sessions, login/logout, and authentication state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('authToken');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Simulate API call - in production, call your auth API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      const { email, password } = credentials;
      
      // Demo account check
      if (email === 'demo@autism.com' && password === 'demo123') {
        const userData = {
          id: 1,
          email: email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'parent',
          createdAt: new Date().toISOString()
        };
        
        const token = 'mock-jwt-token-' + Date.now();
        
        // Store session
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      }
      
      // Check existing users (for demo purposes)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.email === email) {
          const token = 'mock-jwt-token-' + Date.now();
          localStorage.setItem('authToken', token);
          setUser(userData);
          setIsAuthenticated(true);
          return { success: true, user: userData };
        }
      }
      
      throw new Error('Invalid credentials');
      
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user account
      const newUser = {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      
      const token = 'mock-jwt-token-' + Date.now();
      
      // Store session
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('authToken', token);
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
      
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Clear session
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      setUser(null);
      setIsAuthenticated(false);
      
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, ...updates };
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
      
    } catch (error) {
      console.error('Profile update failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
