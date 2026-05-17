import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ShieldCheck, Users, Database, Smartphone, Search, RefreshCw, Trash2, Calendar, Shield } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPanel = () => {
  const { user } = useAuth();
  const [dbUsers, setDbUsers] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Strict Authorization Gate
  const isAdmin = user?.email === 'afrahfathimahms9333@gmail.com';

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    
    // Fetch backend DB users
    try {
      const res = await axios.get('/api/user/all');
      setDbUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch backend users:', err);
      setError('Could not connect to backend database users. Falling back to local storage.');
    }

    // Fetch frontend localStorage users
    try {
      const local = JSON.parse(localStorage.getItem('rootcauseai_users') || '[]');
      setLocalUsers(local);
    } catch (err) {
      console.error('Failed to read localStorage users:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClearLocalStorageUsers = () => {
    if (window.confirm('Are you sure you want to clear all custom client-side registered users? This will not affect the backend database.')) {
      localStorage.removeItem('rootcauseai_users');
      setLocalUsers([]);
      setSuccessMessage('LocalStorage user cache cleared successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center px-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-red-200 dark:border-red-900/30 p-10 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
          <div className="w-20 h-20 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform duration-300">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Access Restricted</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-md mx-auto mb-8">
            This administrative dashboard is securely restricted to Authorized Personnel only. Your account is not configured with access privileges.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Enforced by RootCauseAI Security Gate
          </div>
        </div>
      </div>
    );
  }

  // Combine and de-duplicate or just list side by side
  // Let's create a unified list with clear badges!
  const unifiedUsers = [];
  
  // Add database users
  dbUsers.forEach(u => {
    unifiedUsers.push({
      id: u.id,
      email: u.email,
      fullName: u.full_name || u.fullName || 'Database User',
      createdAt: u.created_at || u.createdAt,
      source: 'Database',
      provider: 'email',
      companyName: ''
    });
  });

  // Add localStorage users, preventing exact duplicates
  localUsers.forEach(u => {
    if (!unifiedUsers.some(exist => exist.email.toLowerCase() === u.email.toLowerCase())) {
      unifiedUsers.push({
        id: u.id,
        email: u.email,
        fullName: u.fullName || 'Client User',
        createdAt: u.createdAt,
        source: 'LocalStorage',
        provider: u.provider || 'email',
        companyName: u.companyName || ''
      });
    }
  });

  const filteredUsers = unifiedUsers.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest mb-1.5">
            <Shield className="w-4 h-4" /> System Administrator
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">RootCauseAI Administration</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Verify system registrations, local mocks, and persistent user sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={handleClearLocalStorageUsers}
            disabled={localUsers.length === 0}
            className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border border-red-100 dark:border-red-900/30 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear Local Cache
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-3 font-bold animate-in slide-in-from-top-4 duration-300">
          <ShieldCheck className="w-6 h-6" /> {successMessage}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { 
            title: 'Total Registrations', 
            val: loading ? '...' : unifiedUsers.length, 
            icon: <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
            bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'
          },
          { 
            title: 'Database Users', 
            val: loading ? '...' : dbUsers.length, 
            icon: <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
            bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
          },
          { 
            title: 'LocalStorage Users', 
            val: loading ? '...' : localUsers.length, 
            icon: <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
            bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20'
          }
        ].map((card, i) => (
          <div key={i} className={`p-6 rounded-[2rem] border shadow-sm flex items-center justify-between bg-white dark:bg-slate-900 ${card.bg}`}>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">{card.title}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{card.val}</h3>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-8">
        <div className="relative group max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold"
            placeholder="Search registrations by name, email, or source..."
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24">
            <LoadingSpinner message="Loading user index registry..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center px-4">
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No matching registrations found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try refining your search terms or register a new user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</th>
                  <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</th>
                  <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source</th>
                  <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Provider</th>
                  <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors font-bold text-sm text-slate-800 dark:text-slate-200">
                    <td className="px-6 py-4.5 font-mono text-xs text-slate-400">{item.id}</td>
                    <td className="px-6 py-4.5 text-slate-900 dark:text-white font-extrabold">{item.fullName}</td>
                    <td className="px-6 py-4.5 font-medium">{item.email}</td>
                    <td className="px-6 py-4.5">
                      <span className={`px-3 py-1 rounded-md text-xs border font-black uppercase tracking-wider ${
                        item.source === 'Database'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-500/20'
                      }`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 font-mono text-xs capitalize text-slate-500 dark:text-slate-400">{item.provider}</td>
                    <td className="px-6 py-4.5 text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
