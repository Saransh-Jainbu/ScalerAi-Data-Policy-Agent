import React from 'react';
import {
  LayoutDashboard,
  FileText,
  BrainCircuit,
  AlertTriangle,
  Settings,
  Moon,
  Sun,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode
}) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'rules', label: 'Rules Engine', icon: BrainCircuit },
    { id: 'violations', label: 'Violations', icon: AlertTriangle },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavigation = (id: string) => {
    setActiveTab(id);
    navigate(`/${id}`);
  };

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">ComplianceAI</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Data Policy Agent</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
            <span className="font-medium text-sm">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTab"
                className="ml-auto"
              >
                <ChevronRight className="w-4 h-4 text-blue-200" />
              </motion.div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 mb-4 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
          <span className="text-xs font-medium">Dark Mode</span>
          <button
            onClick={toggleDarkMode}
            className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-600'}`}
          >
            <motion.div
              animate={{ x: isDarkMode ? 20 : 2 }}
              className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        <div className="flex items-center gap-3 px-2">
          <img
            src="https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDgwNjgzMXww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-slate-700"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">Alex compliance</p>
            <p className="text-[10px] text-slate-500 truncate">Compliance Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
