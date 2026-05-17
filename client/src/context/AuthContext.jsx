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
    // 1. First check localStorage for a logged in user (keeps hackathon demo robust)
    const storedUser = localStorage.getItem('rootcauseai_user') || localStorage.getItem('demo_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      return;
    }

    // 2. Fallback/Verification check with backend if no local storage user
    try {
      const res = await axios.get('/api/auth/verify');
      setUser(res.data.user);
    } catch (error) {
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

    // 2. Check localStorage custom registered users first (for 100% demo uptime)
    const localUsers = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
    const matchedUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (matchedUser && matchedUser.password === password) {
      // Establish backend session in parallel if backend is up
      try {
        await axios.post('/api/auth/login', { email, password });
      } catch (err) {
        console.warn('Backend login session failed, proceeding with local mock session', err);
      }
      
      loginCustomUser(matchedUser);
      return matchedUser;
    }

    // 3. Fallback to full backend authentications if not matching locally
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const userData = {
        id: res.data.user.id,
        email: res.data.user.email,
        fullName: res.data.user.fullName || res.data.user.full_name,
        companyName: '',
        createdAt: new Date().toISOString(),
        provider: 'email'
      };
      loginCustomUser(userData);
      return userData;
    } catch (error) {
      console.error('Backend login failed', error);
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
    // 1. Create a professional user object
    const newUser = {
      id: Date.now().toString(),
      fullName,
      email,
      password, // Stored as-is for demo matching
      companyName,
      createdAt: new Date().toISOString(),
      isSocialLogin: false,
      provider: 'email'
    };

    // 2. Save locally
    const localUsers = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
    // Check if user already exists locally
    if (localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User already exists');
    }
    localUsers.push(newUser);
    localStorage.setItem('rootcauseai_users', JSON.stringify(localUsers));

    // 3. Save to backend database in parallel
    try {
      await axios.post('/api/auth/signup', { fullName, email, password });
      // Establish backend session cookie
      await axios.post('/api/auth/login', { email, password });
    } catch (error) {
      console.warn('Backend signup/login failed, fallback to local storage mode', error);
    }

    // 4. Auto-login on success
    loginCustomUser(newUser);
    return newUser;
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginDemo, signup, loginSocial, loginWithGoogleData, logout, checkAuth, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

