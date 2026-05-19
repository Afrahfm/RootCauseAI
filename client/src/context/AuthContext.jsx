import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.baseURL = 'http://localhost:5000';
  axios.defaults.withCredentials = true;

  const checkAuth = async () => {
    try {
      const res = await axios.get('/api/auth/verify');
      if (res.data && res.data.user) {
        const mappedUser = {
          ...res.data.user,
          fullName: res.data.user.fullName || res.data.user.full_name
        };
        localStorage.setItem('rootcauseai_user', JSON.stringify(mappedUser));
        localStorage.setItem('rootcauseai_logged_in', 'true');
        setUser(mappedUser);
      } else {
        localStorage.removeItem('rootcauseai_user');
        localStorage.removeItem('demo_user');
        localStorage.removeItem('rootcauseai_logged_in');
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('rootcauseai_user');
      localStorage.removeItem('demo_user');
      localStorage.removeItem('rootcauseai_logged_in');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    // 1. Handle Backup Demo Credentials
    if (email === 'demo' && password === 'demo123') {
      return await loginDemo();
    }

    // 2. Always attempt real backend login first to verify credentials against live MySQL
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const userData = {
        id: res.data.user.id,
        email: res.data.user.email,
        fullName: res.data.user.fullName || res.data.user.full_name,
        companyName: '',
        createdAt: res.data.user.created_at || new Date().toISOString(),
        provider: 'email'
      };
      loginCustomUser(userData);
      return userData;
    } catch (error) {
      console.error('Backend login failed', error);
      
      // If it is an authentic credential failure (400, 401, 404, etc.) from the server, propagate it!
      if (error.response && error.response.status !== 502 && error.response.status !== 504 && error.response.status !== 500) {
        throw error;
      }

      // ONLY fallback if the server is completely down or returns a server crash error (500/502/504)
      const localUsers = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
      const matchedUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (matchedUser && matchedUser.password === password) {
        loginCustomUser(matchedUser);
        return matchedUser;
      }
      throw error;
    }
  };

  const loginDemo = async () => {
    try {
      const res = await axios.post('/api/auth/login-demo');
      const userData = {
        id: res.data.user.id,
        email: res.data.user.email,
        fullName: res.data.user.fullName || res.data.user.full_name || 'Demo User',
        companyName: 'Acme Corp',
        createdAt: new Date().toISOString(),
        provider: 'email'
      };
      
      localStorage.setItem('demo_user', JSON.stringify(userData));
      localStorage.setItem('rootcauseai_user', JSON.stringify(userData));
      localStorage.setItem('rootcauseai_logged_in', 'true');
      setUser(userData);
      return userData;
    } catch (error) {
      // Offline fallback
      const fallbackUser = {
        id: '999',
        email: 'demo@rootcause.ai',
        fullName: 'Demo User',
        companyName: 'Acme Corp',
        createdAt: new Date().toISOString(),
        provider: 'email'
      };
      localStorage.setItem('demo_user', JSON.stringify(fallbackUser));
      localStorage.setItem('rootcauseai_user', JSON.stringify(fallbackUser));
      localStorage.setItem('rootcauseai_logged_in', 'true');
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const loginCustomUser = (userData) => {
    localStorage.setItem('rootcauseai_user', JSON.stringify(userData));
    localStorage.setItem('demo_user', JSON.stringify(userData));
    localStorage.setItem('rootcauseai_logged_in', 'true');
    setUser(userData);
  };

  const signup = async (fullName, email, password, companyName = '') => {
    // 1. Always attempt real backend signup first
    try {
      await axios.post('/api/auth/signup', { fullName, email, password });
      
      // Establish backend session cookie and get real database user ID from MySQL
      const loginRes = await axios.post('/api/auth/login', { email, password });
      if (loginRes.data && loginRes.data.user) {
        const userData = {
          id: loginRes.data.user.id,
          email: loginRes.data.user.email,
          fullName: loginRes.data.user.fullName || loginRes.data.user.full_name || fullName,
          companyName,
          createdAt: loginRes.data.user.created_at || new Date().toISOString(),
          isSocialLogin: false,
          provider: 'email'
        };

        // Cache locally for offline backup
        const localUsers = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
        if (!localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          localUsers.push({ ...userData, password });
          localStorage.setItem('rootcauseai_users', JSON.stringify(localUsers));
        }

        loginCustomUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Backend signup/login failed', error);
      
      // If it is an authentic validation or user exists error (400, 409 etc.) from the server, propagate it!
      if (error.response && error.response.status !== 502 && error.response.status !== 504 && error.response.status !== 500) {
        throw error;
      }

      // ONLY fallback to offline mock mode if the backend is physically offline or returned a server crash
      const newUser = {
        id: Date.now().toString(),
        fullName,
        email,
        password,
        companyName,
        createdAt: new Date().toISOString(),
        isSocialLogin: false,
        provider: 'email'
      };

      const localUsers = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
      if (localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User already exists');
      }
      localUsers.push(newUser);
      localStorage.setItem('rootcauseai_users', JSON.stringify(localUsers));

      loginCustomUser(newUser);
      return newUser;
    }
  };

  const loginSocial = async (provider) => {
    // Simulate social profile data
    let socialUser = {};
    if (provider === 'google') {
      socialUser = {
        id: 'google-' + Date.now(),
        fullName: 'Alex Rivera',
        email: 'alex.rivera@google.com',
        companyName: 'Google LLC',
        createdAt: new Date().toISOString(),
        isSocialLogin: true,
        provider: 'google'
      };
    } else if (provider === 'microsoft') {
      socialUser = {
        id: 'ms-' + Date.now(),
        fullName: 'Sarah Jenkins',
        email: 's.jenkins@microsoft.com',
        companyName: 'Microsoft Corporation',
        createdAt: new Date().toISOString(),
        isSocialLogin: true,
        provider: 'microsoft'
      };
    } else if (provider === 'apple') {
      socialUser = {
        id: 'apple-' + Date.now(),
        fullName: 'Taylor Vance',
        email: 't.vance@apple.com',
        companyName: 'Apple Inc.',
        createdAt: new Date().toISOString(),
        isSocialLogin: true,
        provider: 'apple'
      };
    }

    // Save to local storage registered list so they are recognized in future
    const localUsers = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
    if (!localUsers.some(u => u.email.toLowerCase() === socialUser.email.toLowerCase())) {
      localUsers.push(socialUser);
      localStorage.setItem('rootcauseai_users', JSON.stringify(localUsers));
    }

    // Establish session with backend mock DB fallback using login-demo route
    try {
      await axios.post('/api/auth/login-demo');
    } catch (err) {
      console.warn('Backend login-demo failed, using offline local session', err);
    }

    loginCustomUser(socialUser);
    return socialUser;
  };

  const loginWithGoogleData = async (userData) => {
    // 1. Create a professional user object from Google data
    const newUser = {
      id: userData.sub || 'google-' + Date.now(),
      fullName: userData.name || userData.given_name || 'Google User',
      email: userData.email,
      picture: userData.picture,
      companyName: '',
      createdAt: new Date().toISOString(),
      isSocialLogin: true,
      provider: 'google'
    };

    // 2. Save to local storage registered list so they are recognized in future
    const localUsers = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
    const existingIndex = localUsers.findIndex(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existingIndex >= 0) {
      // Update existing user with latest google info
      localUsers[existingIndex] = { ...localUsers[existingIndex], ...newUser };
    } else {
      localUsers.push(newUser);
    }
    localStorage.setItem('rootcauseai_users', JSON.stringify(localUsers));

    // 3. Establish session with backend mock DB fallback using login-demo route
    try {
      await axios.post('/api/auth/login-demo');
    } catch (err) {
      console.warn('Backend login-demo failed, using offline local session', err);
    }

    loginCustomUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Backend logout failed', error);
    }
    localStorage.removeItem('demo_user');
    localStorage.removeItem('rootcauseai_user');
    localStorage.removeItem('rootcauseai_logged_in');
    localStorage.removeItem('rootcauseai_user_profile');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    localStorage.setItem('rootcauseai_user', JSON.stringify(updatedUser));
    localStorage.setItem('demo_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginDemo, signup, loginSocial, loginWithGoogleData, logout, checkAuth, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

