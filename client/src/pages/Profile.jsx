import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 font-bold">
        Please login to view profile
      </div>
    );
  }

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      updateUser(formData);
      setIsEditing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user.fullName || user.name || '',
      email: user.email || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const InputField = ({ label, icon, name, value, editable, disabled, error }) => (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>
          {icon}
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
          disabled={!editable || disabled}
          className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 rounded-2xl outline-none transition-all font-bold text-slate-900 dark:text-white ${
            error 
              ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-slate-100 dark:border-white/5 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10'
          } ${!editable ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-white/5 border-transparent' : ''}`}
        />
      </div>
      {error && <p className="text-red-500 text-xs font-bold ml-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> {error}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/5 overflow-hidden">
        {/* Header/Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 relative">
          <div className="absolute -bottom-16 left-10 p-2 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl">
            <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-500/20 rounded-[1.8rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-4 border-white dark:border-slate-900">
              <User className="w-16 h-16" />
            </div>
          </div>
        </div>

        <div className="pt-20 px-10 pb-10 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Welcome, {user.fullName || user.name}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
            </div>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all active:scale-95"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={handleCancel}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-6">
            <InputField 
              label="Full Name" 
              icon={<User className="w-5 h-5" />} 
              name="fullName"
              value={isEditing ? formData.fullName : (user.fullName || user.name || '')} 
              editable={isEditing}
              error={errors.fullName}
            />
            <InputField 
              label="Email Address" 
              icon={<Mail className="w-5 h-5" />} 
              name="email"
              value={isEditing ? formData.email : (user.email || '')} 
              editable={isEditing}
              error={errors.email}
            />
            <InputField 
              label="User ID" 
              icon={<Shield className="w-5 h-5" />} 
              name="userId"
              value={user.id || 'demo'} 
              editable={false}
              disabled={true}
            />
            <InputField 
              label="Member Since" 
              icon={<Calendar className="w-5 h-5" />} 
              name="memberSince"
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'May 2026'} 
              editable={false}
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-right-8 duration-300">
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 font-black">
            <CheckCircle2 className="w-6 h-6" />
            Profile updated successfully!
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
