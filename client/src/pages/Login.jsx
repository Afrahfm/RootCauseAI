import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'microsoft' | 'apple' | null
  
  const { login, loginSocial, loginWithGoogleData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Standard 0.5s credential matching delay for realism
    setTimeout(async () => {
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Invalid credentials. Try our backup: demo / demo123');
        setLoading(false);
      }
    }, 500);
  };

  const handleSocialLogin = (provider) => {
    setError('');
    setSocialLoading(provider);

    // Simulated 1.5s OAuth loading animation
    setTimeout(async () => {
      try {
        await loginSocial(provider);
        navigate('/dashboard');
      } catch (err) {
        setError(`Failed to sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`);
        setSocialLoading(null);
      }
    }, 1500);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSocialLoading('google');
      try {
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        await loginWithGoogleData(userInfo.data);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to fetch Google profile.');
        setSocialLoading(null);
      }
    },
    onError: () => {
      setError('Google Sign-In was unsuccessful or cancelled.');
      setSocialLoading(null);
    }
  });

  return (
    <div className="max-w-xl mx-auto mt-8 sm:mt-14 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Brand logo at the top */}
      <div className="flex items-center justify-center gap-2.5 mb-6 group">
        <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <span className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 bg-clip-text text-transparent tracking-tight">
          RootCause<span className="text-indigo-600 dark:text-indigo-400">AI</span>
        </span>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-white/5 relative overflow-hidden">
        {/* Decorative subtle header line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        {/* Navigation Tabs using URLs */}
        <div className="flex bg-slate-100/60 dark:bg-white/5 p-1 rounded-2xl mb-8 border border-slate-200/20">
          <div
            className="flex-1 text-center py-3 text-sm font-black rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-md border border-slate-200/10"
          >
            Sign In
          </div>
          <Link
            to="/signup"
            className="flex-1 text-center py-3 text-sm font-black rounded-xl transition-all duration-300 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Sign Up
          </Link>
        </div>

        {socialLoading ? (
          <div className="py-12">
            <LoadingSpinner message={`Connecting to ${socialLoading.charAt(0).toUpperCase() + socialLoading.slice(1)} secure login...`} />
          </div>
        ) : loading ? (
          <div className="py-12">
            <LoadingSpinner message="Authenticating credentials..." />
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Sign in to uncover more hidden problems.</p>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold border border-red-100 dark:border-red-900/30 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Social Logins */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => googleLogin()}
                className="flex items-center justify-center py-3.5 px-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 rounded-2xl font-black text-sm text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('microsoft')}
                className="flex items-center justify-center py-3.5 px-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 rounded-2xl font-black text-sm text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h10v10H0z"/>
                  <path fill="#81bc06" d="M11 0h10v10H11z"/>
                  <path fill="#05a6f0" d="M0 11h10v10H0z"/>
                  <path fill="#ffba08" d="M11 11h10v10H11z"/>
                </svg>
                Microsoft
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                className="flex items-center justify-center py-3.5 px-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 rounded-2xl font-black text-sm text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <svg className="w-4.5 h-4.5 mr-2" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 47.5-24.4 76.5 26.9 2.4 51.2-16 68.3-38.9z"/>
                </svg>
                Apple
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-3 items-center mb-6">
              <div className="flex-grow border-t border-slate-200 dark:border-white/5"></div>
              <span className="flex-shrink mx-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">or continue with email</span>
              <div className="flex-grow border-t border-slate-200 dark:border-white/5"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Email or User ID</label>
                <div className="relative group">
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                    placeholder="Enter your email or 'demo'"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Password</label>
                  <Link to="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                    placeholder="Enter your password or 'demo123'"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Professional Demo Backup notice block */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-start gap-3">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Demo Backup Credentials</h4>
                  <p className="text-xs font-medium text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">Need immediate access? Enter <code className="bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded font-black">demo</code> and <code className="bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded font-black">demo123</code> to instantly enter the platform.</p>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-indigo-500/20 transition-all mt-2 transform active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </button>
            </form>
          </>
        )}

        <p className="text-center mt-8 text-sm text-slate-600 dark:text-slate-400 font-bold">
          Don't have an account? <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Sign up for free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
