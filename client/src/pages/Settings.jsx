import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Moon, Sun, Laptop, Bell, Shield, Download, Trash2, 
  ChevronRight, CheckCircle2, AlertCircle, Info 
} from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useTheme();
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleToggle = (key) => {
    updateSettings({ [key]: !settings[key] });
    triggerToast();
  };

  const handleThemeChange = (newTheme) => {
    updateSettings({ theme: newTheme });
    triggerToast();
  };

  const handleClearHistory = () => {
    localStorage.removeItem('rootcauseai_history'); // Assuming local history for demo
    setShowConfirmModal(false);
    triggerToast();
    // In a real app, we'd call an API here
  };

  const handleExportData = () => {
    const userData = {
      profile: JSON.parse(sessionStorage.getItem('rootcauseai_user_profile') || '{}'),
      settings: settings,
      history: JSON.parse(localStorage.getItem('rootcauseai_history') || '[]'),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rootcauseai_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const Section = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, enabled, onToggle }) => (
    <div className="flex items-center justify-between py-2">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative shadow-inner ${enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${enabled ? 'left-6' : 'left-0.5'}`}></div>
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center md:text-left mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your app preferences and data.</p>
      </div>

      {/* Appearance Section */}
      <Section icon={<Sun className="w-5 h-5" />} title="Appearance">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
              { id: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
              { id: 'system', icon: <Laptop className="w-4 h-4" />, label: 'System' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  settings.theme === t.id 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' 
                  : 'border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {t.icon}
                <span className="text-xs font-bold uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>
          <Toggle 
            label="Compact Mode" 
            enabled={settings.compactMode} 
            onToggle={() => handleToggle('compactMode')} 
          />
        </div>
      </Section>

      {/* Notifications Section */}
      <Section icon={<Bell className="w-5 h-5" />} title="Notifications">
        <div className="space-y-4">
          <Toggle 
            label="Email Notifications" 
            enabled={settings.emailNotifications} 
            onToggle={() => handleToggle('emailNotifications')} 
          />
          <Toggle 
            label="Analysis Completion Alerts" 
            enabled={settings.analysisAlerts} 
            onToggle={() => handleToggle('analysisAlerts')} 
          />
        </div>
      </Section>

      {/* Data & Privacy Section */}
      <Section icon={<Shield className="w-5 h-5" />} title="Data & Privacy">
        <div className="space-y-4">
          <button 
            onClick={() => setShowConfirmModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-100 dark:border-red-500/20 hover:scale-[1.01] transition-transform font-bold"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <span>Clear All Analysis History</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </button>

          <button 
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:scale-[1.01] transition-transform font-bold"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5" />
              <span>Export My Data (JSON)</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </button>
        </div>
      </Section>

      {/* About Section */}
      <Section icon={<Info className="w-5 h-5" />} title="About">
        <div className="flex items-center justify-between py-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">App Version</span>
          <span className="text-slate-500 font-mono">v1.0.0</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">Demo Mode</span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30">Active</span>
        </div>
      </Section>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full z-10 shadow-2xl border border-slate-200 dark:border-white/10 space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center text-red-600 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Are you sure?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                This will permanently delete all your analysis history. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-4 rounded-xl font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearHistory}
                className="flex-1 px-6 py-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all active:scale-95"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white" />
            Settings saved successfully!
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
