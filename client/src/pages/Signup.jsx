import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Building2, Check, ShieldCheck, KeyRound, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'linkedin' | 'microsoft' | 'apple' | null
  
  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  
  const { user, signup, loginSocial, loginWithGoogleData, sendVerificationCode, verifyCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Password rules validation states
  const passwordHasMinLength = password.length >= 8;
  const passwordHasUppercase = /[A-Z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordIsStrong = passwordHasMinLength && passwordHasUppercase && passwordHasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      return setError('You must accept the Terms of Service and Privacy Policy.');
    }

    if (!passwordIsStrong) {
      return setError('Password does not meet the strength requirements.');
    }
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const res = await sendVerificationCode(email);
      setOtpSent(true);
      setInfoMessage(res.message || 'Verification code dispatched to your company email.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setInfoMessage('');
    setOtpLoading(true);

    try {
      await verifyCode(fullName, email, password, companyName, employeeId, otpCode);
      navigate('/dashboard');
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setInfoMessage('');
    try {
      const res = await sendVerificationCode(email);
      setInfoMessage(res.message || 'A new verification code has been dispatched.');
    } catch (err) {
      setOtpError(err.message || 'Failed to resend verification code.');
    }
  };

  const handleSocialLogin = (provider) => {
    setError('');
    setSocialLoading(provider);

    if (provider === 'linkedin') {
      loginSocial('linkedin').catch(err => {
        setError('LinkedIn redirection failed.');
        setSocialLoading(null);
      });
      return;
    }

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
    <div className="max-w-xl mx-auto mt-6 sm:mt-10 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
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
          <Link
            to="/login"
            className="flex-1 text-center py-3 text-sm font-black rounded-xl transition-all duration-300 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Sign In
          </Link>
          <div
            className="flex-1 text-center py-3 text-sm font-black rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-md border border-slate-200/10"
          >
            Sign Up
          </div>
        </div>

        {socialLoading ? (
          <div className="py-12">
            <LoadingSpinner message={`Connecting to ${socialLoading.charAt(0).toUpperCase() + socialLoading.slice(1)} secure login...`} />
          </div>
        ) : loading ? (
          <div className="py-12">
            <LoadingSpinner message="Sending verification code to your email..." />
          </div>
        ) : otpSent ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Verify Email</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto">
                We sent a 6-digit security code to:
                <span className="block text-indigo-600 dark:text-indigo-400 font-black mt-1 break-all">{email}</span>
              </p>
              <div className="mt-3.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/20">
                <Sparkles className="w-3.5 h-3.5" /> Checked & Approved Domain
              </div>
            </div>

            {otpError && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold border border-red-100 dark:border-red-900/30 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {otpError}
              </div>
            )}

            {infoMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold border border-emerald-100 dark:border-emerald-900/30">
                <Check className="w-5 h-5 shrink-0" />
                {infoMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">
                  6-Digit Verification Code
                </label>
                <div className="relative group">
                  <ShieldAlert className="w-5 h-5 text-slate-400 absolute left-4 top-4 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      setOtpCode(val);
                    }}
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-black text-center text-2xl tracking-[0.5em] placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    placeholder="000000"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center font-medium">
                  Check your terminal server console log for the generated 6-digit verification code banner!
                </p>
              </div>

              {otpLoading ? (
                <div className="py-2">
                  <LoadingSpinner message="Verifying security code & provisioning account..." />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={otpCode.length !== 6}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-indigo-500/20 transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Verify & Complete Sign Up</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="flex items-center justify-between mt-2 px-1">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpError('');
                        setInfoMessage('');
                        setOtpCode('');
                      }}
                      className="text-sm font-black text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Get Started</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Stop building the wrong thing. Find the right one.</p>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold border border-red-100 dark:border-red-900/30 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Primary LinkedIn Social Login */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => handleSocialLogin('linkedin')}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-95 cursor-pointer border border-transparent"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>Verify Workplace with LinkedIn</span>
              </button>
            </div>

            {/* Other Social Logins */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => googleLogin()}
                className="flex items-center justify-center py-3 px-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 rounded-2xl font-black text-xs text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
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
                className="flex items-center justify-center py-3 px-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 rounded-2xl font-black text-xs text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 23 23">
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
                className="flex items-center justify-center py-3 px-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 rounded-2xl font-black text-xs text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <svg className="w-4.5 h-4.5 mr-1.5 shrink-0" viewBox="0 0 384 512" fill="currentColor">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Company Name <span className="text-slate-400 font-medium">(optional)</span></label>
                  <div className="relative group">
                    <Building2 className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Employee ID <span className="text-slate-400 font-medium">(required for startup/enterprise verification)</span></label>
                <div className="relative group">
                  <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                    placeholder="e.g. TS123456 or ZOHO123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                    placeholder="jane.doe@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group mb-3">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password strength micro-indicators */}
                {password.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordHasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className={passwordHasMinLength ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>8+ Characters</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordHasUppercase ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className={passwordHasUppercase ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>1+ Uppercase Letter</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordHasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </span>
                      <span className={passwordHasNumber ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>1+ Number</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 mt-4 ml-1">
                <input 
                  type="checkbox" 
                  id="terms"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 text-indigo-600 border-2 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="terms" className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-snug select-none">
                  I agree to the <a href="#terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</a> and <a href="#privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</a>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading || !termsAccepted || !passwordIsStrong}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-indigo-500/20 transition-all mt-4 transform active:scale-[0.98] cursor-pointer"
              >
                Create Account
              </button>
            </form>
          </>
        )}

        <p className="text-center mt-8 text-sm text-slate-600 dark:text-slate-400 font-bold">
          Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
