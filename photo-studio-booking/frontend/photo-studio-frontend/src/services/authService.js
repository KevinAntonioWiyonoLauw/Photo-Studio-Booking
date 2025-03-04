// src/services/authService.js
import authApi from './authApi';

export const loginUser = async (credentials) => {
  try {
    const response = await authApi.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Login error details:', error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    // Log what we're sending to help debug
    console.log('Sending registration data:', userData);
    
    // Try mapping fields in case API expects different format
    const formattedData = {
      ...userData,
      // Some backends expect username instead of name
      username: userData.name,
    };
    
    const response = await authApi.post('/auth/register', formattedData);
    return response.data;
  } catch (error) {
    // Detailed error logging
    console.error('Registration error status:', error.response?.status);
    console.error('Registration error details:', error.response?.data || error.message);
    
    // Optional: Development mock for testing frontend without backend
    if (process.env.NODE_ENV === 'development' && window.localStorage.getItem('useMockAuth') === 'true') {
      console.warn('Using mock registration data - FOR DEVELOPMENT ONLY');
      return {
        user: {
          id: Math.floor(Math.random() * 1000),
          name: userData.name,
          email: userData.email,
          role: 'user'
        },
        token: 'mock-jwt-token.' + btoa(JSON.stringify({id: 999, role: 'user'})) + '.signature'
      };
    }
    
    throw error;
  }
};