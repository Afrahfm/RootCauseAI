import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Check, ShieldCheck, KeyRound, Sparkles, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinId, setLinkedinId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true); // Default to accepted for seamless step-2 registration
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'linkedin' | null
  
  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(60);
  
  const { user, loginSocial, verifyCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Read callback variables from query params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authError = params.get('auth_error') || params.get('error');
    if (authError) {
      setError(decodeURIComponent(authError));
      // Clean query parameters from URL for clean interface
      navigate('/signup', { replace: true });
      return;
    }

    const otpSentParam = params.get('otp_sent');
    if (otpSentParam === 'true') {
      setOtpSent(true);
      const qEmail = params.get('email');
      const qFullName = params.get('full_name');
      const qLinkedInId = params.get('linkedin_id');
      const qCompanyName = params.get('company_name');
      if (qEmail) setEmail(decodeURIComponent(qEmail));
      if (qFullName) setFullName(decodeURIComponent(qFullName));
      if (qLinkedInId) setLinkedinId(decodeURIComponent(qLinkedInId));
      if (qCompanyName) setCompanyName(decodeURIComponent(qCompanyName));
      setTimerSeconds(60);
      setInfoMessage('Workplace verified! Secure 6-digit OTP code printed in your server console log.');
    }
  }, [location, navigate]);

  // Countdown timer for OTP Resend
  useEffect(() => {
    let interval = null;
    if (otpSent && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (!otpSent) {
      setTimerSeconds(60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, timerSeconds]);

  // Password rules validation states
  const passwordHasMinLength = password.length >= 8;
  const passwordHasUppercase = /[A-Z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordIsStrong = passwordHasMinLength && passwordHasUppercase && passwordHasNumber;

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    setInfoMessage('');

    if (!otpCode || otpCode.length !== 6) {
      return setOtpError('Please enter a valid 6-digit OTP code.');
    }

    if (!passwordIsStrong) {
      return setOtpError('Password must meet all security guidelines.');
    }
    
    if (password !== confirmPassword) {
      return setOtpError('Passwords do not match.');
    }

    setOtpLoading(true);

    try {
      // Call verifyCode context handler with pre-populated details from URL state
      await verifyCode(fullName, email, password, companyName, linkedinId, otpCode);
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
      const res = await axios.post('/api/auth/resend-code', {
        email,
        linkedinId,
        fullName
      });
      setTimerSeconds(60); // Restart countdown timer
      setInfoMessage(res.data.message || 'A new verification code has been dispatched.');
    } catch (err) {
      setOtpError(err.response?.data?.error || err.message || 'Failed to resend verification code.');
    }
  };

  const handleLinkedInVerify = () => {
    setError('');
    setSocialLoading('linkedin');
    loginSocial('linkedin').catch(err => {
      setError('LinkedIn redirection failed.');
      setSocialLoading(null);
    });
  };

  return (
    <div className="max-w-[480px] w-full mx-auto mt-6 sm:mt-10 mb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Brand logo at the top */}
      <div className="flex items-center justify-center gap-2.5 mb-6 group">
        <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <span className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 bg-clip-text text-transparent tracking-tight">
          RootCause<span className="text-indigo-600 dark:text-indigo-400">AI</span>
        </span>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl border border-slate-200/50 dark:border-white/5 relative overflow-hidden flex flex-col gap-6">
        {/* Decorative subtle header line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100/60 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/20">
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
            <LoadingSpinner message={`Connecting to LinkedIn secure workplace verification gate...`} />
          </div>
        ) : otpSent ? (
          /* ================= STEP 2: OTP VERIFICATION & PASSWORD CREATION ================= */
          <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Verify & Create</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto text-sm leading-relaxed">
                Workplace verified for <span className="text-indigo-600 dark:text-indigo-400 font-black">{fullName}</span> at <span className="text-indigo-600 dark:text-indigo-400 font-black">{companyName}</span>. Enter OTP sent to corporate email:
                <span className="block text-indigo-600 dark:text-indigo-400 font-black mt-1 break-all">{email}</span>
              </p>
              <div className="mt-3 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/20">
                <Sparkles className="w-3.5 h-3.5" /> Checked & Approved Badge
              </div>
            </div>

            {otpError && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 dark:border-red-900/30 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {otpError}
              </div>
            )}

            {infoMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-emerald-100 dark:border-emerald-900/30">
                <Check className="w-5 h-5 shrink-0" />
                {infoMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-6">
              <div className="form-group mb-5">
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
                <p className="text-xs text-slate-400 mt-2.5 text-center font-medium">
                  Check your terminal server console log for the generated 6-digit verification code banner!
                </p>
              </div>

              <div className="form-group mb-5">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">
                  Create Password
                </label>
                <div className="relative group">
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
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
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

              <div className="form-group mb-5">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {otpLoading ? (
                <div className="py-2">
                  <LoadingSpinner message="Validating OTP and creating your secure profile..." />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Countdown Timer & Resend code link row */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      {timerSeconds > 0 ? (
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          Resend Code in <span className="font-black text-indigo-500 dark:text-indigo-400">{timerSeconds}s</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                          <span>Resend Code</span>
                        </button>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpError('');
                        setInfoMessage('');
                        setOtpCode('');
                        setPassword('');
                        setConfirmPassword('');
                        // Clean query parameters from URL for clean interface
                        navigate('/signup', { replace: true });
                      }}
                      className="text-xs font-black text-slate-500 dark:text-slate-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Step 1</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || !passwordIsStrong || password !== confirmPassword}
                    className="button mt-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-indigo-500/20 transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Verify & Signup</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* ================= STEP 1: LINKEDIN VERIFICATION ACTION ================= */
          <div className="animate-in fade-in duration-500 flex flex-col gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/5">
                <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Workplace Verification</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Verify your startup or enterprise badge to get started.</p>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 dark:border-red-900/30 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-100 dark:border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4.5 h-4.5" />
                Fraud-Proof Enrollment
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                RootCauseAI is a high-trust environment. Direct registration forms are completely disabled. All employees must verify their verified workplace badge on LinkedIn to receive an email OTP.
              </p>
            </div>

            {/* Premium LinkedIn Mandatory Button */}
            <div className="mt-2">
              <button
                type="button"
                onClick={handleLinkedInVerify}
                className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-[#0A66C2] hover:bg-[#004182] active:bg-[#002f5f] text-white rounded-2xl font-black text-base shadow-lg hover:shadow-[#0A66C2]/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer border border-transparent duration-300"
              >
                <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>Verify Workplace with LinkedIn</span>
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 font-bold">
          Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
