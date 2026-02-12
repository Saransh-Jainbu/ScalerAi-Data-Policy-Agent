import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Search, Filter, AlertTriangle, ShieldAlert, ChevronDown, ChevronRight, Package } from 'lucide-react';
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

interface ViolationGroup {
  rule_name: string;
  rule_type: string;
  violations: Violation[];
  openCount: number;
  severity: string;
}

export const Violations: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const handleBulkResolve = async (ruleName: string, status: 'resolved' | 'ignored') => {
    const ruleViolations = violations.filter(v => v.rule_name === ruleName && v.status === 'open');
    for (const v of ruleViolations) {
      await handleResolve(v.violation_id, status);
    }
  };

  useEffect(() => {
    fetchViolations();
    const interval = setInterval(fetchViolations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Group violations by rule
  const groupedViolations: ViolationGroup[] = React.useMemo(() => {
    const groups = new Map<string, ViolationGroup>();

    violations.forEach(v => {
      if (!groups.has(v.rule_name)) {
        groups.set(v.rule_name, {
          rule_name: v.rule_name,
          rule_type: v.rule_type,
          violations: [],
          openCount: 0,
          severity: v.severity
        });
      }
      const group = groups.get(v.rule_name)!;
      group.violations.push(v);
      if (v.status === 'open') group.openCount++;
    });

    return Array.from(groups.values()).sort((a, b) => b.openCount - a.openCount);
  }, [violations]);

  const toggleGroup = (ruleName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(ruleName)) {
        next.delete(ruleName);
      } else {
        next.add(ruleName);
      }
      return next;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900';
      case 'medium': return 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900';
      default: return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900';
    }
  };

  const totalOpen = violations.filter(v => v.status === 'open').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Violations</h2>
          <p className="text-sm text-slate-500">{totalOpen} open issues across {groupedViolations.length} rules</p>
        </div>
        <div className="flex items-center gap-3">
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

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading violations...</div>
      ) : groupedViolations.length === 0 ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">All Clear!</h3>
          <p className="text-emerald-700 dark:text-emerald-300 text-sm">No violations found. Your system is compliant. 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedViolations.map((group) => {
            const isExpanded = expandedGroups.has(group.rule_name);
            return (
              <motion.div
                key={group.rule_name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Group Header */}
                <div
                  onClick={() => toggleGroup(group.rule_name)}
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white">{group.rule_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{group.rule_type} • {group.violations.length} total violations</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getSeverityColor(group.severity)}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {group.severity}
                      </span>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg">
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm">{group.openCount}</span>
                        <span className="text-red-500 dark:text-red-500 text-xs ml-1">open</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Violations */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Showing {group.violations.length} violation{group.violations.length !== 1 ? 's' : ''}
                        </p>
                        {group.openCount > 0 && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleBulkResolve(group.rule_name, 'resolved'); }}
                              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium"
                            >
                              Resolve All ({group.openCount})
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleBulkResolve(group.rule_name, 'ignored'); }}
                              className="text-xs px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all font-medium"
                            >
                              Ignore All
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {group.violations.map((v) => (
                          <div
                            key={v.violation_id}
                            className={`p-4 flex items-start justify-between gap-4 transition-colors ${v.status !== 'open' ? 'opacity-50 bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-white dark:hover:bg-slate-900'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 dark:text-slate-300">{v.explanation}</p>
                              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                <span>Detected: {new Date(v.created_at).toLocaleString()}</span>
                                <span className={`px-2 py-0.5 rounded ${v.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : v.status === 'ignored' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                                  {v.status}
                                </span>
                              </div>
                            </div>
                            {v.status === 'open' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleResolve(v.violation_id, 'resolved')}
                                  disabled={processingId === v.violation_id}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                                  title="Mark Resolved"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleResolve(v.violation_id, 'ignored')}
                                  disabled={processingId === v.violation_id}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                  title="Ignore"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
