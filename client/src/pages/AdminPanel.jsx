import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.email === 'afrahfathimahms9333@gmail.com';
  const isHR = user?.role === 'hr';
  const hasAccess = isAdmin || isHR;

  useEffect(() => {
    if (!hasAccess) return;
    fetchPendingApprovals();
    if (isAdmin) {
      fetchUsers();
      fetchLogs();
    }
  }, [isAdmin, isHR, hasAccess]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/auth/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const endpoint = isHR ? '/api/auth/hr/pending-approvals' : '/api/auth/admin/pending-approvals';
      const res = await axios.get(endpoint);
      setPendingUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/auth/admin/verification-logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const approveUser = async (userId) => {
    setLoading(true);
    try {
      const endpoint = isHR ? `/api/auth/hr/approve-user/${userId}` : `/api/auth/admin/approve-user/${userId}`;
      await axios.post(endpoint);
      setMessage({ type: 'success', text: isHR ? 'Employee verified! Awaiting Admin.' : 'User fully approved successfully!' });
      fetchPendingApprovals();
      if (isAdmin) fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to approve user' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const rejectUser = async (userId) => {
    setLoading(true);
    try {
      const endpoint = isHR ? `/api/auth/hr/reject-user/${userId}` : `/api/auth/admin/reject-user/${userId}`;
      await axios.post(endpoint);
      setMessage({ type: 'success', text: 'User rejected' });
      fetchPendingApprovals();
      if (isAdmin) fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to reject user' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Shield className="w-16 h-16 text-red-500/50 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Administrative privileges required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isHR ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-indigo-100 dark:bg-indigo-500/20'}`}>
              <Shield className={`w-7 h-7 ${isHR ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
            </div>
            {isHR ? 'HR Portal' : 'Admin Panel'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            {isHR 
              ? 'Verify employee identities from your company (Stage 1 of 2).' 
              : 'Manage system users, final approvals, and verification audit logs.'}
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 hidden-scrollbar">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'pending' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
          }`}
        >
          <Clock className="w-4 h-4" />
          {isHR ? 'Employees Awaiting Verification' : 'Stage 2 Final Approvals'} ({pendingUsers.length})
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'users' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'logs' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              Verification Logs
            </button>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
        {/* PENDING APPROVALS TAB */}
        {activeTab === 'pending' && (
          <div className="p-6">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">All caught up!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">There are no users waiting for your approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((pUser) => (
                  <div key={pUser.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-sm">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-lg text-slate-900 dark:text-white">{pUser.full_name}</p>
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border ${
                          isHR ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                               : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                        }`}>
                          {isHR ? 'Stage 1: Pending' : 'Stage 2: Pending'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{pUser.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-white/10">🏢 {pUser.company_name}</span>
                        <span className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-white/10">⏱️ {new Date(pUser.requested_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => approveUser(pUser.user_id)}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isHR ? 'Verify Employee' : 'Final Approve'}
                      </button>
                      <button
                        onClick={() => rejectUser(pUser.user_id)}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 border border-slate-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/30 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB (ADMIN ONLY) */}
        {isAdmin && activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role / Type</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trust Level</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stage</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize border border-slate-200 dark:border-white/10">
                        {u.role || u.user_type || 'employee'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        u.trust_level === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                        u.trust_level === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                      }`}>
                        {u.trust_level || 'low'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {u.approval_stage === 'fully_approved' ? '✅ Fully Approved' : 
                           u.approval_stage === 'hr_approved' ? '⏳ Stage 2 (Admin)' : '⏳ Stage 1 (HR)'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {new Date(u.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LOGS TAB (ADMIN ONLY) */}
        {isAdmin && activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'})}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{log.email}</td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-white/10">
                        {log.verification_method}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${log.verification_status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {log.verification_status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className="capitalize">{log.verification_status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400">{log.rejection_reason || '-'}</td>
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
