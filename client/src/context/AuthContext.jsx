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
        sessionStorage.setItem('rootcauseai_user', JSON.stringify(mappedUser));
        sessionStorage.setItem('rootcauseai_logged_in', 'true');
        setUser(mappedUser);
      } else {
        sessionStorage.removeItem('rootcauseai_user');
        sessionStorage.removeItem('demo_user');
        sessionStorage.removeItem('rootcauseai_logged_in');
        setUser(null);
      }
    } catch (error) {
      sessionStorage.removeItem('rootcauseai_user');
      sessionStorage.removeItem('demo_user');
      sessionStorage.removeItem('rootcauseai_logged_in');
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
        userType: res.data.user.userType || res.data.user.user_type || 'startup',
        companyName: res.data.user.companyName || res.data.user.company_name || '',
        employeeId: res.data.user.employeeId || res.data.user.employee_id || '',
        isVerified: res.data.user.isVerified || res.data.user.is_verified || false,
        createdAt: res.data.user.created_at || new Date().toISOString(),
        provider: 'email'
      };
      loginCustomUser(userData);
      return userData;
    } catch (error) {
      console.error('Backend login failed', error);
      
      // If it is an authentic credential failure (400, 401, 404, etc.) from the server, propagate it!
      if (error.response && error.response.status !== 502 && error.response.status !== 504 && error.response.status !== 500) {
        throw new Error(error.response.data?.error || error.response.data?.message || error.message);
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
      
      sessionStorage.setItem('demo_user', JSON.stringify(userData));
      sessionStorage.setItem('rootcauseai_user', JSON.stringify(userData));
      sessionStorage.setItem('rootcauseai_logged_in', 'true');
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
      sessionStorage.setItem('demo_user', JSON.stringify(fallbackUser));
      sessionStorage.setItem('rootcauseai_user', JSON.stringify(fallbackUser));
      sessionStorage.setItem('rootcauseai_logged_in', 'true');
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const loginCustomUser = (userData) => {
    sessionStorage.setItem('rootcauseai_user', JSON.stringify(userData));
    sessionStorage.setItem('demo_user', JSON.stringify(userData));
    sessionStorage.setItem('rootcauseai_logged_in', 'true');
    setUser(userData);
  };

  const signup = async (fullName, email, password, companyName = '', employeeId = '') => {
    // 1. Always attempt real backend signup first
    try {
      await axios.post('/api/auth/signup', { fullName, email, password, companyName, employeeId });
      
      // Establish backend session cookie and get real database user ID from MySQL
      const loginRes = await axios.post('/api/auth/login', { email, password });
      if (loginRes.data && loginRes.data.user) {
        const userData = {
          id: loginRes.data.user.id,
          email: loginRes.data.user.email,
          fullName: loginRes.data.user.fullName || loginRes.data.user.full_name || fullName,
          userType: loginRes.data.user.userType || loginRes.data.user.user_type || 'startup',
          companyName: loginRes.data.user.companyName || loginRes.data.user.company_name || companyName,
          employeeId: loginRes.data.user.employeeId || loginRes.data.user.employee_id || employeeId,
          isVerified: loginRes.data.user.isVerified || loginRes.data.user.is_verified || false,
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
        throw new Error(error.response.data?.error || error.response.data?.message || error.message);
      }

      // ONLY fallback to offline mock mode if the backend is physically offline or returned a server crash
      
      // A. Personal email domain validation
      const domainMatch = email.match(/@(.+)$/);
      if (!domainMatch) {
        throw new Error('Invalid email address format');
      }
      const domain = domainMatch[1].toLowerCase().trim();

      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
      if (personalDomains.includes(domain)) {
        throw new Error('Personal email domains are not allowed');
      }

      // B. Pre-approved company lookup
      const mockApprovedCompanies = [
        {
          company_name: 'TechStartup Inc',
          company_domain: 'techstartup.com',
          company_type: 'startup',
          employee_id_pattern: 'TS[0-9]{6}',
          requires_employee_id: true
        },
        {
          company_name: 'Innovate Solutions',
          company_domain: 'innovate.io',
          company_type: 'startup',
          employee_id_pattern: 'IN[0-9]{5}[A-Z]{2}',
          requires_employee_id: true
        },
        {
          company_name: 'Creative Labs',
          company_domain: 'creative.io',
          company_type: 'startup',
          employee_id_pattern: 'CL[0-9]{7}',
          requires_employee_id: true
        },
        {
          company_name: 'Future Systems',
          company_domain: 'futuresys.com',
          company_type: 'startup',
          employee_id_pattern: 'FS[0-9]{4}[A-Z]{3}',
          requires_employee_id: true
        },
        {
          company_name: 'Tata Consultancy Services',
          company_domain: 'tcs.com',
          company_type: 'enterprise',
          employee_id_pattern: '^[0-9]{6,8}$',
          requires_employee_id: true
        },
        {
          company_name: 'Cognizant',
          company_domain: 'cognizant.com',
          company_type: 'enterprise',
          employee_id_pattern: '^[0-9]{7,9}$',
          requires_employee_id: true
        },
        {
          company_name: 'Zoho',
          company_domain: 'zoho.com',
          company_type: 'enterprise',
          employee_id_pattern: '^ZOHO[0-9]{6}$',
          requires_employee_id: true
        },
        {
          company_name: 'Hexaware Technologies',
          company_domain: 'hexaware.com',
          company_type: 'enterprise',
          employee_id_pattern: '^HX[0-9]{6}$',
          requires_employee_id: true
        }
      ];

      const matchingCompany = mockApprovedCompanies.find(c => c.company_domain === domain);
      if (!matchingCompany) {
        throw new Error('Company domain is not pre-approved');
      }

      // C. Employee ID verification
      if (matchingCompany.requires_employee_id) {
        if (!employeeId) {
          throw new Error('Employee ID is required for this company');
        }
        let pattern = matchingCompany.employee_id_pattern;
        if (!pattern.startsWith('^')) pattern = '^' + pattern;
        if (!pattern.endsWith('$')) pattern = pattern + '$';
        const regex = new RegExp(pattern);
        if (!regex.test(employeeId)) {
          throw new Error('Invalid Employee ID format');
        }
      }

      const newUser = {
        id: Date.now().toString(),
        fullName,
        email,
        password,
        userType: matchingCompany.company_type,
        companyName: matchingCompany.company_name,
        employeeId: employeeId || null,
        isVerified: true,
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

  const sendVerificationCode = async (email) => {
    try {
      const res = await axios.post('/api/auth/send-code', { email });
      return res.data;
    } catch (error) {
      console.error('Failed to send verification code', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to dispatch verification code.');
    }
  };

  const verifyCode = async (fullName, email, password, companyName, employeeId, code) => {
    try {
      const res = await axios.post('/api/auth/verify-code', {
        fullName,
        email,
        password,
        companyName,
        employeeId,
        code
      });
      const userData = {
        id: res.data.user.id,
        email: res.data.user.email,
        fullName: res.data.user.fullName || res.data.user.full_name,
        userType: res.data.user.userType || res.data.user.user_type || 'startup',
        companyName: res.data.user.companyName || res.data.user.company_name || companyName,
        employeeId: res.data.user.employeeId || res.data.user.employee_id || employeeId,
        isVerified: res.data.user.isVerified || res.data.user.is_verified || false,
        createdAt: res.data.user.created_at || new Date().toISOString(),
        provider: 'email'
      };
      loginCustomUser(userData);
      return userData;
    } catch (error) {
      console.error('Code verification failed', error);
      throw new Error(error.response?.data?.error || error.message || 'Code verification failed.');
    }
  };

  const loginSocial = async (provider) => {
    if (provider === 'linkedin') {
      window.location.href = 'http://localhost:5000/api/auth/linkedin';
      return;
    }
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
    sessionStorage.removeItem('demo_user');
    sessionStorage.removeItem('rootcauseai_user');
    sessionStorage.removeItem('rootcauseai_logged_in');
    sessionStorage.removeItem('rootcauseai_user_profile');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    sessionStorage.setItem('rootcauseai_user', JSON.stringify(updatedUser));
    sessionStorage.setItem('demo_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginDemo, signup, loginSocial, loginWithGoogleData, logout, checkAuth, updateUser, loading, sendVerificationCode, verifyCode }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

