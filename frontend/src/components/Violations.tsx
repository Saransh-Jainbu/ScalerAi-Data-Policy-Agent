import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Search, Filter, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// API URL
const SCANNER_URL = 'http://localhost:8083';

interface Violation {
  violation_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'resolved' | 'ignored' | 'false_positive';
  evidence: any;
  explanation: string;
  created_at: string;
  rule_name: string;
  rule_type: string;
}

export const Violations: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchViolations = async () => {
    try {
      const res = await axios.get(`${SCANNER_URL}/violations`);
      setViolations(res.data.violations);
    } catch (err) {
      console.error("Failed to fetch violations", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    setScanning(true);
    try {
      await axios.post(`${SCANNER_URL}/scan`);
      setTimeout(fetchViolations, 2000);
    } catch (err) {
      console.error("Scan failed", err);
      alert("Scan failed to start.");
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (violationId: string, status: 'resolved' | 'ignored') => {
    setProcessingId(violationId);
    try {
      await axios.post(`${SCANNER_URL}/violations/${violationId}/resolve?status=${status}`);
      // Optimistic update
      setViolations(prev => prev.map(v =>
        v.violation_id === violationId ? { ...v, status } : v
      ));
    } catch (err) {
      console.error("Failed to resolve violation", err);
      alert("Failed to update status.");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchViolations();
    const interval = setInterval(fetchViolations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Helpers
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900';
      case 'medium': return 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900';
      default: return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Violations</h2>
          <p className="text-sm text-slate-500">Detected issues across your database infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search violations..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <ShieldAlert className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
            {scanning ? 'Scanning...' : 'Run Full Scan'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rule Violation</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Explanation</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detected At</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading violations...</td></tr>
              ) : violations.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No violations found! Your system is compliant. 🎉</td></tr>
              ) : (
                violations.map((v) => (
                  <tr key={v.violation_id} className={`transition-colors group ${v.status !== 'open' ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getSeverityColor(v.severity)}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {v.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{v.rule_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{v.rule_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400 max-w-[300px] truncate" title={v.explanation}>
                        {v.explanation}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[300px]">
                        {JSON.stringify(v.evidence)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(v.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase ${v.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                          v.status === 'ignored' ? 'text-slate-500 bg-slate-100 border border-slate-200' :
                            'text-red-600 bg-red-50 border border-red-100'
                        }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {v.status === 'open' && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleResolve(v.violation_id, 'resolved')}
                            disabled={processingId === v.violation_id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-all disabled:opacity-50"
                            title="Mark Resolved"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResolve(v.violation_id, 'ignored')}
                            disabled={processingId === v.violation_id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                            title="Ignore / False Positive"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
