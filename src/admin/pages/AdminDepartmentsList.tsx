import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore, Department } from '../../store';

export default function AdminDepartmentsList() {
  const user = useStore((state) => state.user);
  const issues = useStore((state) => state.issues);
  const departments = useStore((state) => state.departments);
  const fetchDepartments = useStore((state) => state.fetchDepartments);
  const triggerDepartmentAudit = useStore((state) => state.triggerDepartmentAudit);
  const sendDepartmentWarning = useStore((state) => state.sendDepartmentWarning);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditingId, setAuditingId] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to load departments');
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  // Compute metrics for a department from real issue data
  const computeMetrics = (deptId: string) => {
    const deptIssues = issues.filter(i => i.departmentId === deptId);
    const total = deptIssues.length;
    const resolved = deptIssues.filter(i => i.status === 'Resolved').length;
    const active = total - resolved;
    const sla = total === 0 ? 100 : Math.round((resolved / total) * 100);
    const health = sla >= 90 ? 'Healthy' : sla >= 70 ? 'At Risk' : 'Critical';
    return { active, resolved, total, sla, health };
  };

  const handleAudit = async (deptId: string) => {
    setAuditingId(deptId);
    try {
      await triggerDepartmentAudit(deptId);
      toast.success('Audit completed – metrics updated');
      await loadDepartments(); // refresh department list (lastAudit updated)
    } catch (err: any) {
      toast.error(err.message || 'Audit failed');
    } finally {
      setAuditingId(null);
    }
  };

  const handleSendWarning = async (deptId: string) => {
    try {
      await sendDepartmentWarning(deptId);
      toast.success('Warning sent to department head');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send warning');
    }
  };

  // Guard: only Admin can view
  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
        <div className="text-center">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Access restricted to Administrators</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-400 mt-2">Loading department data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-red-600 font-bold">{error}</p>
        <button onClick={loadDepartments} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans" id="admin-departments-workspace">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Civic Department Nodes</h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Track and coordinate dispatches across civic bodies, personnel heads, and pending SLA loads.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.loading('Sending warnings...');
              departments.forEach(d => handleSendWarning(d.id));
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer"
          >
            Send Warnings
          </button>
          <button
            onClick={loadDepartments}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.length === 0 ? (
          <div className="col-span-2 bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-400">
            No departments configured. Please add some.
          </div>
        ) : (
          departments.map(dept => {
            const metrics = computeMetrics(dept.id);
            return (
              <div key={dept.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4 shadow-sm">
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-sm font-black text-slate-900 leading-snug">{dept.name}</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                      metrics.health === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      metrics.health === 'At Risk' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {metrics.health}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Department Head:</span>
                      <span className="text-slate-900 font-extrabold">{dept.head}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Active Load:</span>
                      <span className="text-emerald-700 font-black">{metrics.active} Incidents</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">SLA Compliance:</span>
                      <span className={`font-black ${metrics.sla >= 90 ? 'text-emerald-600' : metrics.sla >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {metrics.sla}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAudit(dept.id)}
                    disabled={auditingId === dept.id}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-xl transition border border-slate-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {auditingId === dept.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Run Compliance Audit'
                    )}
                  </button>
                  <button
                    onClick={() => handleSendWarning(dept.id)}
                    className="py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black text-[11px] uppercase tracking-wider rounded-xl transition border border-amber-200 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}