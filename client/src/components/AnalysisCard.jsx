import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, DollarSign, Settings } from 'lucide-react';

const AnalysisCard = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden mt-8 transition-all hover:shadow-md">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Original Request</h3>
        <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">"{analysis.user_input}"</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4 p-5 rounded-xl bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20">
          <div className="bg-orange-100 dark:bg-orange-500/20 p-2.5 rounded-lg mt-1 shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-2">The REAL Hidden Problem</h4>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg">{analysis.hidden_problem}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-red-100 dark:border-red-500/20 bg-white dark:bg-slate-950 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="w-32 h-32 text-red-500 transform rotate-12" />
            </div>
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">What They Asked For</h4>
            <p className="text-slate-800 dark:text-slate-200 font-medium mb-6 text-xl leading-snug">{analysis.wrong_solution}</p>
            <div className="inline-block bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-full text-sm font-bold border border-red-200 dark:border-red-500/30 shadow-sm">
              Est. Cost: {analysis.wrong_solution_cost}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/5 dark:to-slate-950 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Lightbulb className="w-32 h-32 text-emerald-500 transform -rotate-12" />
            </div>
            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">What They Actually Need</h4>
            <p className="text-slate-800 dark:text-slate-200 font-medium mb-6 text-xl leading-snug">{analysis.right_solution}</p>
            <div className="inline-block bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
              Est. Cost: {analysis.right_solution_cost}
            </div>
          </div>
        </div>

        <hr className="border-slate-100 my-2" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-indigo-50 dark:bg-indigo-500/10 p-8 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-xl shadow-sm">
              <TrendingUp className="w-8 h-8 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900/60 dark:text-indigo-400 uppercase tracking-wider">Potential Savings</p>
              <p className="text-4xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight drop-shadow-sm">{analysis.savings}</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-white/5 backdrop-blur p-5 rounded-xl w-full md:w-auto border border-indigo-100/50 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Recommended Tech Stack</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.tech_stack && Array.isArray(analysis.tech_stack) ? (
                analysis.tech_stack.map((tech, i) => (
                  <span key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 text-sm font-bold rounded-lg shadow-sm">
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 dark:text-slate-400 text-sm italic">No specific stack required</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;
