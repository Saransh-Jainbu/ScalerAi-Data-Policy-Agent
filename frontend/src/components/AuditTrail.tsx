import React from 'react';
import { 
  History, 
  User, 
  Shield, 
  Database, 
  Search,
  Download,
  Filter
} from 'lucide-react';

const auditEvents = [
  { id: 1, user: 'alex.compliance', action: 'Approved Rule #102', target: 'User Age Restriction', timestamp: '2026-02-12 10:45:21', ip: '192.168.1.45', status: 'Success' },
  { id: 2, user: 'system.engine', action: 'Detected Violation', target: 'users_table (id: 4521)', timestamp: '2026-02-12 09:12:05', ip: 'internal', status: 'Logged' },
  { id: 3, user: 'sarah.engineer', action: 'Modified Policy', target: 'Data_Retention_v3.pdf', timestamp: '2026-02-11 16:30:12', ip: '10.0.4.12', status: 'Success' },
  { id: 4, user: 'alex.compliance', action: 'Exported Compliance Report', target: 'Q1_Audit_Report.xlsx', timestamp: '2026-02-11 14:20:00', ip: '192.168.1.45', status: 'Success' },
  { id: 5, user: 'system.engine', action: 'Full Database Scan', target: 'Prod_DB_Cluster_01', timestamp: '2026-02-11 00:00:00', ip: 'internal', status: 'Completed' },
];

export const AuditTrail: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Audit Trail</h2>
          <p className="text-sm text-slate-500">Immutable log of all user actions and system events for SOC2/ISO compliance.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by user, action, or target..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action / Operation</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resource Target</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{event.timestamp}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                        {event.user === 'system.engine' ? <Shield className="w-3 h-3 text-blue-600" /> : <User className="w-3 h-3 text-emerald-600" />}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{event.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{event.action}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{event.target}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{event.ip}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 uppercase tracking-wide">
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-white">
          <Shield className="w-8 h-8 text-blue-500 mb-4" />
          <h4 className="font-bold text-lg mb-1">SOC2 Compliant Logs</h4>
          <p className="text-sm text-slate-400">All logs are signed and stored in an immutable WORM (Write Once Read Many) storage bucket.</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-white">
          <Database className="w-8 h-8 text-emerald-500 mb-4" />
          <h4 className="font-bold text-lg mb-1">Retention Policy</h4>
          <p className="text-sm text-slate-400">Audit logs are retained for 7 years according to standard enterprise financial compliance.</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-white">
          <History className="w-8 h-8 text-amber-500 mb-4" />
          <h4 className="font-bold text-lg mb-1">Auto-Archiving</h4>
          <p className="text-sm text-slate-400">Logs older than 90 days are automatically compressed and archived to cold storage.</p>
        </div>
      </div>
    </div>
  );
};
