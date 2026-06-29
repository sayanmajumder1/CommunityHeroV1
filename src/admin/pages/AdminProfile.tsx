import React, { useState } from 'react';
import { useStore } from '../../store';
import { Database, ShieldAlert, Cpu, Lock, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminProfile() {
  const user = useStore((state) => state.user);
  const auditLogs = useStore((state) => state.auditLogs);
  const [clearedLogs, setClearedLogs] = useState(false);

  if (!user) return null;

  // Flatten and map real-time system logs chronologically
  const systemLogs = clearedLogs ? [] : Object.values(auditLogs)
    .flat()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(log => ({
      id: log.id,
      timestamp: new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19),
      type: log.action || 'ACTIVITY',
      actor: log.actorName || 'System',
      detail: log.details || `Modified incident #${log.issueId.substring(0, 8)}`,
      status: log.action?.includes('ERROR') || log.action?.includes('REJECT') ? 'DANGER' : (log.action?.includes('WARNING') ? 'WARNING' : 'SUCCESS')
    }));

  const purgeAuditTrail = () => {
    const isConfirmed = window.confirm("Are you absolutely sure you want to purge the current Session Audit Logs? Tamper-protection compliance logs persist in secure cloud ledger storage, but this will clear your screen view.");
    if (isConfirmed) {
      setClearedLogs(true);
      toast.success("Current session audit view cleared");
    }
  };

  return (
    <div className="space-y-6 text-left font-sans" id="admin-profile-audit">
      
      {/* Identity block */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-4 text-left">
          <div className="h-16 w-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-2xl text-white shrink-0 shadow-sm">
            SU
          </div>
          <div>
            <h2 className="text-md font-bold text-slate-900 leading-tight">{user.displayName || 'Superuser'}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                Superuser Console
              </span>
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                IAM Root Core
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Enterprise System Audit Trail</span>
          </h3>
          <button
            onClick={purgeAuditTrail}
            className="text-[10px] font-black text-red-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Logs</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {systemLogs.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-semibold">
              No audit logs on record. Purge complete.
            </div>
          ) : (
            systemLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-slate-400 font-bold">{log.timestamp}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase
                      ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 
                        log.status === 'WARNING' ? 'bg-amber-50 text-amber-700' : 
                        'bg-red-50 text-red-600'}`}>
                      {log.type}
                    </span>
                  </div>
                  <p className="text-slate-700 font-semibold">{log.detail}</p>
                </div>
                
                <span className="text-[10px] text-slate-500 font-bold shrink-0">{log.actor}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
