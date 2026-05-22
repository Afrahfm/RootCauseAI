import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import AnalysisCard from '../components/AnalysisCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Send, History, AlertCircle, Shield } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDemoMode, setIsDemoMode } = useDemo();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const isRestricted = user?.role === 'employee' && user?.approvalStage !== 'fully_approved';

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/analyses');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (input.trim().length < 10) {
      setError('Please provide more details about the problem (min 10 characters).');
      return;
    }
    
    setError('');
    setLoading(true);
    setCurrentAnalysis(null);

    try {
      // In Demo Mode, backend fallback might be triggered if API key is dummy
      const res = await axios.post('/api/analyze', { userInput: input });
      setCurrentAnalysis(res.data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {isRestricted && user?.approvalStage === 'pending' && (
        <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-pulse-slow">
          <div className="bg-amber-500 text-white p-3 rounded-xl shadow-md shadow-amber-500/20 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-800 dark:text-amber-400 tracking-tight">⏳ Stage 1/2: Pending HR Verification</h3>
            <p className="text-sm font-medium text-amber-700/80 dark:text-amber-300/80 mt-1 leading-relaxed">
              Your company HR manager must verify your signup first. Once your HR manager has approved your identity, your application will proceed to final administrator review.
            </p>
          </div>
        </div>
      )}
      {isRestricted && user?.approvalStage === 'hr_approved' && (
        <div className="mb-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md shadow-blue-500/20 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-blue-800 dark:text-blue-400 tracking-tight">🛡️ Stage 2/2: Approved by HR</h3>
            <p className="text-sm font-medium text-blue-700/80 dark:text-blue-300/80 mt-1 leading-relaxed">
              Awaiting final administrator verification and platform sign-off. Your HR verification has completed successfully.
            </p>
          </div>
        </div>
      )}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 flex-wrap">
            Welcome, {user.fullName || 'Detective'}
            {user.userType === 'startup' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-sm border border-amber-400/25">
                🚀 Startup Employee {user.companyName ? `(${user.companyName})` : ''}
              </span>
            )}
            {user.userType === 'enterprise' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-sm border border-blue-500/25">
                🏢 Enterprise Employee {user.companyName ? `(${user.companyName})` : ''}
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Ready to uncover some hidden problems?</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Demo Mode</span>
          <button 
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`w-12 h-6 rounded-full transition-colors relative shadow-inner ${isDemoMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${isDemoMode ? 'left-6' : 'left-0.5'}`}></div>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 md:p-8 relative overflow-hidden">
            {isRestricted && (
              <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-10 animate-fade-in">
                <div className={`p-4 rounded-full shadow-lg mb-4 animate-bounce-slow ${user?.approvalStage === 'hr_approved' ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-amber-500 text-white shadow-amber-500/30'}`}>
                  {user?.approvalStage === 'hr_approved' ? <Shield className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">Access Restricted</h3>
                <p className="text-sm font-bold text-slate-300 max-w-[380px] mt-2 leading-relaxed">
                  {user?.approvalStage === 'hr_approved' 
                    ? 'Awaiting final administrator sign-off (Stage 2 of 2 completed).'
                    : 'Your account is pending verification by your company HR department (Stage 1 of 2).'}
                </p>
                <div className={`mt-4 text-xs font-semibold border px-3.5 py-1.5 rounded-full uppercase tracking-wider ${user?.approvalStage === 'hr_approved' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'}`}>
                  Status: {user?.approvalStage === 'hr_approved' ? 'HR Approved, Awaiting Admin' : 'Pending HR Verification'}
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              </div>
              What does your client think they need?
            </h2>
            
            <form onSubmit={handleAnalyze}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isRestricted}
                className="w-full h-36 p-4 border-2 border-slate-200 dark:border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 placeholder:text-slate-400 text-lg leading-relaxed"
                placeholder="e.g., We need an AI chatbot for customer support because our support reps are overwhelmed..."
              ></textarea>
              
              {error && <p className="text-red-500 text-sm mt-3 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {error}</p>}
              
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || input.length < 10 || isRestricted}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
                >
                  {loading ? 'Analyzing...' : 'Find REAL Problem'}
                  {!loading && <Send className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>

          {loading && <LoadingSpinner message="The Problem Detective is investigating..." />}
          {!loading && currentAnalysis && <AnalysisCard analysis={currentAnalysis} />}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 h-[calc(100vh-10rem)] lg:sticky lg:top-24 overflow-y-auto hidden-scrollbar">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            Analysis History
          </h3>
          
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <p className="text-slate-500 text-sm font-medium">No analyses yet.</p>
                <p className="text-slate-400 text-xs mt-1">Start investigating to see history here.</p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentAnalysis(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    currentAnalysis?.id === item.id 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/20' 
                      : 'border-slate-200 dark:border-white/5 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:shadow-sm'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-3 leading-relaxed">"{item.user_input}"</p>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 rounded-md text-xs border border-emerald-200 dark:border-emerald-500/30">
                      Saved: {item.savings}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      {new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
