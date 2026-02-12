import React, { useState, useEffect } from 'react';
import { BrainCircuit, ExternalLink, Edit2, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

// API URL
const API_URL = 'http://localhost:8082';

interface Rule {
  rule_id: number;
  rule_name: string;
  rule_type: string;
  description: string;
  parameters: any;
  confidence_score: number;
  source_text_snippet: string;
  source_document: string;
  status: string;
}

export const RulesEngine: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      const res = await axios.get(`${API_URL}/rules`);
      setRules(res.data.rules);
    } catch (err) {
      console.error("Failed to fetch rules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI-Extracted Rules ({rules.length})</h2>
          <p className="text-sm text-slate-500">Review and approve logic extracted from your policy documents.</p>
        </div>
        <button
          onClick={fetchRules}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <BrainCircuit className="w-4 h-4" />
          Refresh Rules
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading AI rules...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No rules extracted yet. Upload a document first!</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <motion.div
              key={rule.rule_id}
              whileHover={{ translateY: -2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{rule.rule_name}</h3>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold border ${rule.confidence_score > 0.9 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                  {Math.round(rule.confidence_score * 100)}% CONFIDENCE
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Original Policy Text</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed line-clamp-3">
                    "{rule.source_text_snippet}"
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Extracted Logic ({rule.rule_type})</p>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-blue-400 leading-relaxed overflow-x-auto border border-slate-800">
                    <pre>{JSON.stringify(rule.parameters, null, 2)}</pre>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Source: <span className="font-medium text-slate-700 dark:text-slate-300 ml-1">{rule.source_document}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button className="text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-700 transition-colors">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
);

