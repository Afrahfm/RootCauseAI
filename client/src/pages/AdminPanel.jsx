import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Database, 
  Smartphone, 
  Search, 
  RefreshCw, 
  Trash2, 
  Calendar, 
  Shield,
  Building2,
  Globe,
  Fingerprint,
  Plus,
  Terminal,
  Info,
  CheckCircle2,
  XCircle,
  Hash,
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPanel = () => {
  const { user } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'companies' | 'logs'
  
  // Data states
  const [dbUsers, setDbUsers] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Loading and feedback states
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // CRUD state for Pre-Approved Companies
  const [newCompany, setNewCompany] = useState({
    company_name: '',
    company_domain: '',
    company_type: 'startup',
    employee_id_pattern: '.*',
    requires_employee_id: true,
    max_employees: 100
  });

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

  const fetchCompanies = async () => {
    if (!isAdmin) return;
    setCompaniesLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/auth/admin/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error('Failed to fetch pre-approved companies:', err);
      setError('Failed to fetch pre-approved company domains from the server.');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!isAdmin) return;
    setLogsLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/auth/admin/verification-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch verification audit logs:', err);
      setError('Failed to fetch audit verification logs from the server.');
    } finally {
      setLogsLoading(false);
    }
  };

  // Synchronize dynamic loading based on active tabs
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') {
        fetchData();
      } else if (activeTab === 'companies') {
        fetchCompanies();
      } else if (activeTab === 'logs') {
        fetchLogs();
      }
    }
  }, [user, activeTab]);

  const handleRefresh = () => {
    if (activeTab === 'users') {
      fetchData();
    } else if (activeTab === 'companies') {
      fetchCompanies();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  };

  const handleClearLocalStorageUsers = () => {
    if (window.confirm('Are you sure you want to clear all custom client-side registered users? This will not affect the backend database.')) {
      localStorage.removeItem('rootcauseai_users');
      setLocalUsers([]);
      setSuccessMessage('LocalStorage user cache cleared successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!newCompany.company_name || !newCompany.company_domain) {
      return setError('Company Name and Domain are required.');
    }

    try {
      await axios.post('/api/auth/admin/companies', newCompany);
      setSuccessMessage(`Approved domain "${newCompany.company_domain}" registered successfully!`);
      setNewCompany({
        company_name: '',
        company_domain: '',
        company_type: 'startup',
        employee_id_pattern: '.*',
        requires_employee_id: true,
        max_employees: 100
      });
      fetchCompanies();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve company domain.');
    }
  };

  const handleDeleteCompany = async (id, domain) => {
    if (window.confirm(`Are you sure you want to remove pre-approval for the domain "${domain}"?`)) {
      setError('');
      setSuccessMessage('');
      try {
        await axios.delete(`/api/auth/admin/companies/${id}`);
        setSuccessMessage(`Successfully removed pre-approval for domain "${domain}".`);
        fetchCompanies();
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to remove approved company.');
      }
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

  // Combine DB and local users
  const unifiedUsers = [];
  dbUsers.forEach(u => {
    unifiedUsers.push({
      id: u.id,
      email: u.email,
      fullName: u.full_name || u.fullName || 'Database User',
      createdAt: u.created_at || u.createdAt,
      source: 'Database',
      provider: u.verification_method || 'email',
      userType: u.user_type || 'startup'
    });
  });

  localUsers.forEach(u => {
    if (!unifiedUsers.some(exist => exist.email.toLowerCase() === u.email.toLowerCase())) {
      unifiedUsers.push({
        id: u.id,
        email: u.email,
        fullName: u.fullName || 'Client User',
        createdAt: u.createdAt,
        source: 'LocalStorage',
        provider: u.provider || 'email',
        userType: u.userType || 'startup'
      });
    }
  });

  const filteredUsers = unifiedUsers.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest mb-1.5 animate-pulse">
            <Shield className="w-4 h-4" /> System Administrator
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">RootCauseAI Control Center</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Add startup domains, audit secure registration pipelines, and inspect active users.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200/20 dark:border-white/10 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || companiesLoading || logsLoading) ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {activeTab === 'users' && (
            <button 
              onClick={handleClearLocalStorageUsers}
              disabled={localUsers.length === 0}
              className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border border-red-100 dark:border-red-900/30 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear Local Cache
            </button>
          )}
        </div>
      </div>

      {/* Success Notification toast */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-3 font-bold animate-in slide-in-from-top-4 duration-300">
          <ShieldCheck className="w-6 h-6 shrink-0" /> {successMessage}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Control Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-4 px-6 border-b-2 font-black text-sm transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4.5 h-4.5" /> Registered Users
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 py-4 px-6 border-b-2 font-black text-sm transition-all cursor-pointer ${
            activeTab === 'companies'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4.5 h-4.5" /> Pre-Approved Companies
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 py-4 px-6 border-b-2 font-black text-sm transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-4.5 h-4.5" /> Verification Logs
        </button>
      </div>

      {/* -------------------- TAB 1: REGISTERED USERS -------------------- */}
      {activeTab === 'users' && (
        <div className="animate-in fade-in duration-300">
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
                title: 'Database (Live MySQL)', 
                val: loading ? '...' : dbUsers.length, 
                icon: <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
                bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
              },
              { 
                title: 'Client Cache (Mocks)', 
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

          {/* Search bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm p-5 mb-8">
            <div className="relative group max-w-md">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm"
                placeholder="Search index registry (name, email, source)..."
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
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try refining your search terms or verify another employee.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                      <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID</th>
                      <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</th>
                      <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</th>
                      <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">User Type</th>
                      <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source</th>
                      <th className="px-6 py-4.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Verification Method</th>
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold capitalize ${
                            item.userType === 'enterprise' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30'
                          }`}>
                            {item.userType}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`px-2.5 py-0.5 rounded text-xs border font-black uppercase tracking-wider ${
                            item.source === 'Database'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-500/20'
                          }`}>
                            {item.source}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.provider}</td>
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
      )}

      {/* -------------------- TAB 2: PRE-APPROVED COMPANIES (CRUD) -------------------- */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Column A: Add Pre-Approved Company Form */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200/50 dark:border-white/10 shadow-lg h-fit">
            <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Approve Company Domain</h2>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                <div className="relative group">
                  <Building2 className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={newCompany.company_name}
                    onChange={(e) => setNewCompany({ ...newCompany, company_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Domain Name (Email suffix)</label>
                <div className="relative group">
                  <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={newCompany.company_domain}
                    onChange={(e) => setNewCompany({ ...newCompany, company_domain: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm"
                    placeholder="e.g. acme.com (no @)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Tier / Category</label>
                <select
                  value={newCompany.company_type}
                  onChange={(e) => setNewCompany({ ...newCompany, company_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm cursor-pointer"
                >
                  <option value="startup">Startup</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                <div>
                  <span className="block text-xs font-black text-slate-700 dark:text-slate-300">Requires Employee ID</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">Validates format check regex</span>
                </div>
                <input
                  type="checkbox"
                  checked={newCompany.requires_employee_id}
                  onChange={(e) => setNewCompany({ ...newCompany, requires_employee_id: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 rounded"
                />
              </div>

              {newCompany.requires_employee_id && (
                <div>
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Employee ID Pattern (Regex)</label>
                  <div className="relative group">
                    <Fingerprint className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      required
                      value={newCompany.employee_id_pattern}
                      onChange={(e) => setNewCompany({ ...newCompany, employee_id_pattern: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-mono text-sm"
                      placeholder="e.g. ^TS[0-9]{6}$"
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 ml-1">
                    Default is <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.*</code> (allows any format)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Max Pre-Approved Seats</label>
                <div className="relative group">
                  <Hash className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="number"
                    min={1}
                    value={newCompany.max_employees}
                    onChange={(e) => setNewCompany({ ...newCompany, max_employees: parseInt(e.target.value) || 100 })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm"
                    placeholder="100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-md hover:shadow-indigo-500/10 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" /> Add Company Domain
              </button>
            </form>
          </div>

          {/* Column B: Pre-Approved Company List Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-6 py-4 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Currently Approved Domains ({companies.length})
              </h3>
            </div>

            {companiesLoading ? (
              <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                <LoadingSpinner message="Retrieving authorized workplace registries..." />
              </div>
            ) : companies.length === 0 ? (
              <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm text-center">
                <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-bold">No pre-approved companies registered</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Use the pre-approval panel on the left to approve your first startup domain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {companies.map((co) => (
                  <div key={co.id} className="bg-white dark:bg-slate-900 p-5 rounded-[1.8rem] border border-slate-200/60 dark:border-white/10 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{co.company_name}</h4>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border border-indigo-200/50 bg-indigo-50 text-indigo-700 dark:border-indigo-500/10 dark:bg-indigo-950 dark:text-indigo-400">
                          {co.company_type}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCompany(co.id, co.company_domain)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Remove Domain Rules"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      <div className="flex items-center justify-between">
                        <span>Pre-Approved Domain</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">@{co.company_domain}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ID Validation</span>
                        <span>
                          {co.requires_employee_id ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Active Check
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </span>
                      </div>
                      {co.requires_employee_id && (
                        <div className="flex items-center justify-between">
                          <span>Regex Pattern</span>
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[140px]" title={co.employee_id_pattern}>
                            {co.employee_id_pattern}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Max Authorized Seats</span>
                        <span className="font-mono text-slate-700 dark:text-slate-200">{co.max_employees || 100}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- TAB 3: AUDIT VERIFICATION LOGS -------------------- */}
      {activeTab === 'logs' && (
        <div className="animate-in fade-in duration-300 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Employee Verification Audit Trail ({logs.length})
            </h3>
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Live security logging active
            </div>
          </div>

          {logsLoading ? (
            <div className="py-24">
              <LoadingSpinner message="Retrieving secure system logs..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center px-4">
              <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No audit traces present</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Verification attempts will generate cryptographically secure traces here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Verification Method</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Domain</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee ID</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trace Reason / Action</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors font-bold text-xs text-slate-700 dark:text-slate-300">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at || log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-extrabold text-sm">{log.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-black uppercase text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                          {log.verification_method === 'linkedin' ? 'LinkedIn OAuth' : log.verification_method === 'email_code' ? 'Email OTP Code' : log.verification_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-indigo-600 dark:text-indigo-400">{log.company_domain ? `@${log.company_domain}` : '-'}</td>
                      <td className="px-6 py-4 font-mono">{log.employee_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.verification_status === 'approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.rejection_reason}>
                        {log.rejection_reason || <span className="text-emerald-500 font-extrabold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Validated Access</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">{log.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
