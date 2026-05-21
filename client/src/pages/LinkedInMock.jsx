import React, { useState } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, Sparkles, Send, Building } from 'lucide-react';

const LinkedInMock = () => {
  const [fullName, setFullName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex.rivera@zoho.com');
  const [companyName, setCompanyName] = useState('Zoho');
  const [verifiedWorkplace, setVerifiedWorkplace] = useState(true);

  // Pre-configured profiles for hackathon presentation demo
  const demoProfiles = [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@zoho.com',
      company: 'Zoho',
      verified: true,
      badge: '🏢 Zoho (Enterprise) - Approved',
      color: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300'
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah@tcs.com',
      company: 'TCS',
      verified: true,
      badge: '🏢 TCS (Enterprise) - Approved',
      color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
    },
    {
      name: 'Startup Founder',
      email: 'founder@demostartup1.com',
      company: 'Demo Startup 1',
      verified: true,
      badge: '🚀 Startup 1 - Approved',
      color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
    },
    {
      name: 'Fraudulent Claim',
      email: 'hacker@gmail.com',
      company: 'Fake Corp',
      verified: false,
      badge: '⚠️ Personal Gmail - Blocked',
      color: 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
    },
    {
      name: 'Unknown Company',
      email: 'hacker@unknown.com',
      company: 'Unknown LLC',
      verified: true,
      badge: '🚫 Unapproved Domain - Blocked',
      color: 'border-slate-500 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300'
    }
  ];

  const handleSelectProfile = (profile) => {
    setFullName(profile.name);
    setEmail(profile.email);
    setCompanyName(profile.company);
    setVerifiedWorkplace(profile.verified);
  };

  const handleAuthorize = () => {
    const linkedinId = `li_mock_${Date.now()}`;
    const query = new URLSearchParams({
      email,
      fullName,
      companyName,
      verifiedWorkplace: verifiedWorkplace.toString(),
      linkedinId
    }).toString();

    // Redirect to the backend oauth callback
    window.location.href = `http://localhost:5000/api/auth/linkedin/callback?${query}`;
  };

  return (
    <div className="max-w-4xl mx-auto my-6 sm:my-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Brand logo at the top */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="bg-[#0a66c2] p-2 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          LinkedIn <span className="text-[#0a66c2] font-black">Developer Portal</span>
        </span>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Simulation panel */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-white/5 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0a66c2] via-[#00a0dc] to-[#0a66c2]"></div>
          
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Demo Simulator
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-3">Workplace Verification</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">Verify employee workplace status securely using LinkedIn r_verify protocol.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Profile Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-[#0a66c2] dark:focus:border-[#0a66c2] rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-bold"
                placeholder="Alex Rivera"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">LinkedIn Verified Workplace Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-[#0a66c2] dark:focus:border-[#0a66c2] rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-bold"
                placeholder="alex.rivera@zoho.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider ml-1">Company Registered Name</label>
              <div className="relative group">
                <Building className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-[#0a66c2] transition-colors" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-100 dark:border-white/5 focus:border-[#0a66c2] dark:focus:border-[#0a66c2] rounded-2xl outline-none transition-all bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-bold"
                  placeholder="Zoho"
                />
              </div>
            </div>

            {/* Verification Status Selector */}
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 mt-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">LinkedIn Verified workplace badge</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">LinkedIn verifies work history against company databases.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifiedWorkplace(!verifiedWorkplace)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative ${
                    verifiedWorkplace ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 bg-white rounded-full transition-all shadow ${
                      verifiedWorkplace ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            <button
              onClick={handleAuthorize}
              className="w-full bg-[#0a66c2] hover:bg-[#004b87] text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-blue-500/20 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer transform active:scale-95"
            >
              <ShieldCheck className="w-5 h-5" /> Authorize Workplace Check & Sign In
            </button>
          </div>
        </div>

        {/* Right Side: Demo Presets */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-100/50 dark:bg-white/5 rounded-[2rem] border border-slate-200/40 dark:border-white/5 p-6">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Presentation Scenarios</h3>
            
            <div className="space-y-2.5">
              {demoProfiles.map((profile, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectProfile(profile)}
                  className={`w-full text-left p-3.5 border-2 rounded-2xl flex items-center justify-between transition-all duration-300 hover:scale-[1.01] active:scale-95 bg-white dark:bg-slate-900 cursor-pointer shadow-sm ${
                    email === profile.email ? profile.color : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{profile.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.email}</p>
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                        {profile.verified ? <UserCheck className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                        {profile.badge}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Secure gate message */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl">
            <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Fraud Protection Guard
            </h4>
            <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1 font-medium leading-relaxed">
              When clicked, this mock redirects to the server's OAuth callback handler to execute complete server-side user registration, JWT generation, and MySQL audit logging.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LinkedInMock;
