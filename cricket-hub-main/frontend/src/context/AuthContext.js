import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  const checkAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
          withCredentials: true
        });
        setUser(response.data);
        setToken(storedToken);
      } else {
        // Try cookie-based auth
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true
        });
        setUser(response.data);
      }
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, role = 'spectator') => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
        role
      });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const handleGoogleCallback = useCallback(async (response) => {
    try {
      const { credential } = response;

      console.log('Google callback received with credential');

      const authResponse = await axios.post(`${API_URL}/api/auth/google/callback`, {
        id_token: credential
      });

      console.log('Auth response:', authResponse.data);

      const { access_token, user: userData } = authResponse.data;

      // Store token first
      localStorage.setItem('auth_token', access_token);

      // Update state
      setToken(access_token);
      setUser(userData);

      console.log('User set, redirecting to dashboard');

      // Wait for state to update before redirecting
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      console.error('Error details:', error.response?.data);
      alert('Login failed: ' + (error.response?.data?.detail || error.message));
      // ensure we clear any partial state
      try {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        });
      } catch (err) {
        console.error('Logout error during failed OAuth cleanup:', err);
      }
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    handleGoogleCallback,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isPlayer: user?.role === 'player'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
