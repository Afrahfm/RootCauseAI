import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Check, X, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyCode } = useAuth();

  // Get info from URL query params
  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';
  const company = searchParams.get('company') || '';
  const linkedinId = searchParams.get('linkedinId') || '';

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for code resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Password strength checks
  const checks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password && password === confirmPassword
  };

  const getStrengthPercent = () => {
    let score = 0;
    if (checks.length) score += 33;
    if (checks.number) score += 33;
    if (checks.special) score += 34;
    return score;
  };

  const strengthPercent = getStrengthPercent();

  const getStrengthLabel = () => {
    if (!password) return { text: 'Enter password', color: 'text-slate-400 dark:text-slate-500' };
    if (strengthPercent < 60) return { text: 'Weak password', color: 'text-rose-500 font-bold' };
    if (strengthPercent < 100) return { text: 'Moderate password', color: 'text-amber-500 font-bold' };
    return { text: 'Strong password', color: 'text-emerald-500 font-bold' };
  };

  const strengthLabel = getStrengthLabel();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    if (!checks.length || !checks.number || !checks.special) {
      setError('Password does not meet the complexity requirements.');
      return;
    }

    if (!checks.match) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Call AuthContext verifyCode which will register the user in backend and login
      await verifyCode(name, email, password, company, '', code);
      setSuccess('Workplace verified successfully! Logging you in...');
      setTimeout(() => {
        navigate('/dashboard?auth_success=true');
      }, 1500);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setError('');
    setResending(true);
    try {
      const res = await axios.post('/api/auth/resend-code', {
        email,
        linkedinId,
        fullName: name
      });
      if (res.data.success) {
        setSuccess('A new verification code has been generated. Check your console terminal!');
        setCountdown(60);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Back Link */}
        <div>
          <Link 
            to="/linkedin-mock" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace Verification
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Verify Employment</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
            Enter the 6-digit code sent to <span className="font-bold text-slate-900 dark:text-white">{email}</span> and configure your account password.
          </p>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="flex flex-col">
          
          {/* OTP Code */}
          <div className="mb-5">
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3.5 text-center text-2xl font-mono font-black tracking-[0.5em] border-2 border-slate-100 dark:border-white/5 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
              disabled={loading}
              required
            />
          </div>

          {/* Create Password */}
          <div className="mb-5">
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">
              Create Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-bold"
                disabled={loading}
                required
              />
            </div>

            {/* Password strength indicators */}
            {password && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Strength:</span>
                  <span className={strengthLabel.color}>{strengthLabel.text}</span>
                </div>
                
                {/* Bar */}
                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      strengthPercent < 60 ? 'bg-rose-500' : strengthPercent < 100 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${strengthPercent}%` }}
                  ></div>
                </div>

                {/* Criteria checklist */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {checks.length ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className={checks.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>8+ Characters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {checks.number ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className={checks.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>At least 1 number</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {checks.special ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className={checks.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>1 special character</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {checks.match ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className={checks.match ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>Passwords match</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-5">
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-600 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-bold"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Resend Link and Timer */}
          <div className="flex items-center justify-between text-xs font-bold mb-4">
            <span className="text-slate-400">Didn't receive a code?</span>
            {countdown > 0 ? (
              <span className="text-slate-500">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                disabled={resending}
              >
                {resending && <Loader2 className="w-3 h-3 animate-spin" />}
                Resend Code
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-95"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" /> Verify & Complete Enrollment
              </>
            )}
          </button>
        </form>

        {/* Info notice */}
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl">
          <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed font-semibold flex gap-1.5">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
            Hackathon Demo Guide: Because this is a security demonstration, codes are instantly generated and logged in your active backend terminal console. Copy the 6-digit code printed in the terminal to verify!
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerifyOtp;
