import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Target, ShieldCheck, Zap } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative px-4 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="max-w-4xl w-full text-center z-10 space-y-12">
        {/* Header Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold uppercase tracking-widest mb-4">
            <Target className="w-4 h-4" />
            Strategic Problem Discovery
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">RootCauseAI</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Stop building the wrong thing. Start finding the right one. 
            Identify the core issues draining your budget before you write a single line of code.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {[
            { icon: <ShieldCheck className="w-6 h-6" />, title: "Risk Mitigation", desc: "Identify architectural flaws early." },
            { icon: <Zap className="w-6 h-6" />, title: "Rapid Analysis", desc: "AI-powered insight in seconds." },
            { icon: <Target className="w-6 h-6" />, title: "Precision Focus", desc: "Solve problems that actually matter." }
          ].map((feature, i) => (
            <div key={i} className="bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-500 font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
          <button 
            onClick={() => navigate('/login')}
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl hover:shadow-indigo-500/20 active:scale-95 overflow-hidden"
          >
            <span className="relative z-10">Enter Platform</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
