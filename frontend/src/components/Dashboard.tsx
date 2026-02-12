import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, AlertTriangle, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

// API URLs
const DOC_URL = 'http://localhost:8081';
const RULE_URL = 'http://localhost:8082';
const SCANNER_URL = 'http://localhost:8083';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    documents: 0,
    rules: 0,
    violations: 0,
    complianceScore: 100
  });

  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel requests
        const [docsRes, rulesRes, violationsRes] = await Promise.all([
          axios.get(`${DOC_URL}/documents`),
          axios.get(`${RULE_URL}/rules`),
          axios.get(`${SCANNER_URL}/violations`)
        ]);

        const totalDocs = docsRes.data.count || 0;
        const totalRules = rulesRes.data.count || 0;
        const totalViolations = violationsRes.data.count || 0;

        // Simple heuristic for compliance score
        // Start at 100, deduct 5 for each violation
        const score = Math.max(0, 100 - (totalViolations * 5));

        setStats({
          documents: totalDocs,
          rules: totalRules,
          violations: totalViolations,
          complianceScore: score
        });

        // Set recent 5 violations
        setRecentViolations(violationsRes.data.violations.slice(0, 5));

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance Overview</h2>
          <p className="text-slate-500 mt-1">Real-time monitoring of your data infrastructure policies.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">System Status</p>
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold">Operational</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Documents Processed"
          value={stats.documents.toString()}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          trend="+2 this week"
          color="blue"
        />
        <StatsCard
          title="Active Rules"
          value={stats.rules.toString()}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          trend="Systems protected"
          color="emerald"
        />
        <StatsCard
          title="Open Violations"
          value={stats.violations.toString()}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          trend={stats.violations > 0 ? "Requires Attention" : "All clear"}
          color="red"
        />
        <StatsCard
          title="Compliance Score"
          value={`${stats.complianceScore}%`}
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          trend="Overall Health"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Violations Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Violations</h3>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View All</button>
          </div>

          <div className="space-y-4">
            {recentViolations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                <p>No recent violations detected.</p>
              </div>
            ) : (
              recentViolations.map((v: any) => (
                <div key={v.violation_id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className={`p-2 rounded-lg shrink-0 ${v.severity === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                      v.severity === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                        'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
                    }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{v.rule_name}</p>
                      <span className="text-[10px] text-slate-400">{new Date(v.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{v.explanation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions / Activity (Mock for now) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
          <h3 className="font-bold text-lg mb-2">Automated Protection</h3>
          <p className="text-blue-100 text-sm mb-6">Your system is actively monitoring 4 databases and 12 policy documents.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <span className="text-sm font-medium">Database Scanned</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Just now</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <span className="text-sm font-medium">Rules Updated</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded">2h ago</span>
            </div>
          </div>

          <button className="w-full mt-6 bg-white text-blue-600 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
            View Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, trend, color }: any) => (
  <motion.div
    whileHover={{ translateY: -4 }}
    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${color === 'red' && parseInt(value) > 0 ? 'text-red-500' : 'text-emerald-500'
        }`}>
        {trend}
        <ArrowUpRight className="w-3 h-3" />
      </div>
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
  </motion.div>
);
