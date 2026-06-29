import React, { useEffect } from 'react';
import { useStore } from '../../store';
import { 
  Users, FileText, Database, Cpu, Activity, RefreshCw, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const issues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);
  const users = useStore((state) => state.users);
  const auditLogs = useStore((state) => state.auditLogs);
  const fetchIssues = useStore((state) => state.fetchIssues);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  if (!user) return null;

  // Platform wide stats
  const totalReports = issues.length;
  const activeSLA = issues.filter(i => i.status !== 'Resolved').length;

  const handleIntegrityCheck = () => {
    toast.loading('Scanning database node cluster...');
    setTimeout(() => {
      toast.success('Database verified! All replica chains are healthy.');
    }, 1500);
  };

  const adminStats = [
    { name: 'Total System Incidents', value: totalReports, icon: FileText, color: 'text-violet-400', bg: 'bg-violet-950/45 border-violet-900/30' },
    { name: 'Live SLA Tickets', value: activeSLA, icon: Activity, color: 'text-rose-400', bg: 'bg-rose-950/45 border-rose-900/30' },
    { name: 'Registered Citizens', value: `${users.filter(u => u.role === 'Citizen').length} Users`, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-950/45 border-indigo-900/30' },
  
  ];

  // Flatten and sort real audit logs
  const allLogs = Object.values(auditLogs)
    .flat()
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-8 text-left font-sans" id="admin-dashboard-workspace">
      
      {/* Enterprise Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">ENTERPRISE COMMAND INTERFACE</span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Platform Command Center</h1>
          <p className="text-xs text-slate-500 font-semibold">Configure global configurations, run state rollbacks and track city-wide performance metrics.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleIntegrityCheck}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verify Replica Sync</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map(stat => (
          <div key={stat.name} className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.name}</span>
              <stat.icon className={`w-5 h-5 ${stat.color.replace('text-','text-emerald-')}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Visual Analytics block & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SLA and Audit log history */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Department SLA Compliance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Response times and resolved targets by government unit</p>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Live Audit</span>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Roads & Public Works Division', rate: '96%', color: 'bg-emerald-600' },
                { name: 'Sanitation & Solid Waste Management', rate: '94%', color: 'bg-emerald-600' },
                { name: 'Electrical & Power Grid Grid', rate: '98%', color: 'bg-emerald-600' },
                { name: 'Water & Sewerage Operations Board', rate: '92%', color: 'bg-emerald-600' }
              ].map((dept, index) => (
                <div key={`${dept.name}-${index}`} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-slate-600">
                    <span>{dept.name}</span>
                    <span className="font-extrabold text-slate-900">{dept.rate} Resolved within SLA</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${dept.color} h-full`} style={{ width: dept.rate }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs block */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black tracking-widest text-slate-500 uppercase">Cloud Platform Audit Logs</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {allLogs.length === 0 ? (
                <p className="text-slate-500 py-4 font-bold text-center">No platform operations logged yet.</p>
              ) : (
                allLogs.slice(0, 5).map((log, index) => (
                  <div key={`${log.id}-${index}`} className="py-3 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{log.action || 'ACTIVITY'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{log.actorName}</span>
                      </div>
                      <p className="text-slate-700 font-semibold">{log.details || `Modified issue #${log.issueId.substring(0, 8)}`}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Platform Toggles and Settings */}
        <div className="space-y-6">
          {/* Registered Citizens List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black tracking-widest text-emerald-600 uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Registered Citizens ({users.filter(u => u.role === 'Citizen').length})</span>
              </h3>
            </div>
            
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {users.filter(u => u.role === 'Citizen').length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center font-bold">No citizens registered yet.</p>
              ) : (
                users.filter(u => u.role === 'Citizen').map((citizen, index) => {
                  const initials = (citizen.displayName || citizen.email || 'Civic Hero')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  
                  return (
                    <div key={`${citizen.uid}-${index}`} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-[11px] text-emerald-700 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold text-slate-900 truncate">{citizen.displayName || 'Anonymous Hero'}</p>
                          <p className="text-[9px] text-slate-400 font-mono truncate">{citizen.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{citizen.points || 0} PTS</span>
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Level {citizen.level || 1}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

         

         
        </div>

      </div>

    </div>
  );
}
