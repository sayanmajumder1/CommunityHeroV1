import React, { useState, useCallback } from 'react';
import { useStore } from '../../store';
import { ShieldAlert, Trash2, MapPin, Search, Activity, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import IssueLiveTracker from '../../components/IssueLiveTracker';

export default function AdminIssuesList() {
  // -------- STORE --------
  const issues = useStore((state) => state.issues);
  const deleteIssue = useStore((state) => state.deleteIssue);
  const fetchIssues = useStore((state) => state.fetchIssues);
  const user = useStore((state) => state.user);
  const isFirebaseSession = useStore((state) => state.isFirebaseSession);

  // -------- LOCAL STATE --------
  const [search, setSearch] = useState('');
  const [trackingIssueId, setTrackingIssueId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // -------- GUARD: Only Admins --------
  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Access restricted to Administrators</p>
        </div>
      </div>
    );
  }

  // -------- FILTERING --------
  const filtered = issues.filter(issue =>
    issue.title.toLowerCase().includes(search.toLowerCase()) ||
    issue.category.toLowerCase().includes(search.toLowerCase()) ||
    issue.description.toLowerCase().includes(search.toLowerCase())
  );

  // -------- DELETE HANDLER (with optimistic update & rollback) --------
  const handleDeleteIssue = useCallback(async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this issue from the system database? This action is irreversible.')) {
      return;
    }

    // Find the issue to delete (for rollback)
    const issueToDelete = issues.find(i => i.id === id);
    if (!issueToDelete) {
      toast.error('Issue not found');
      return;
    }

    setDeletingId(id);
    try {
      // 1. Optimistically remove from UI
      // (we'll rely on the store to handle this via the deleteIssue call)
      // But the store's deleteIssue should update the local state.
      await deleteIssue(id);

      // 2. Success toast
      toast.success(`Issue #${id.substring(0, 6).toUpperCase()} permanently deleted`);

      // 3. Refresh the list from server to ensure consistency
      if (isFirebaseSession) {
        await fetchIssues();
      }
    } catch (error: any) {
      console.error('Failed to delete issue:', error);
      toast.error(error?.message || 'Failed to delete issue. Please try again.');
      // The store should have rolled back the optimistic update on error.
      // If not, we could manually revert, but that's the store's job.
    } finally {
      setDeletingId(null);
    }
  }, [deleteIssue, fetchIssues, issues, isFirebaseSession]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6 text-left font-sans" id="admin-issues-workspace">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Platform Incident Moderation</h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Search, moderate, prune, or delete uploaded user content to ensure database integrity.
          </p>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text"
            placeholder="Search all cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-bold text-slate-900 bg-slate-50 pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ISSUES GRID */}
      <div className="grid grid-cols-1 gap-4 text-left">
        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center text-sm text-slate-500">
            No incidents matched your query.
          </div>
        ) : (
          filtered.map(issue => {
            const isDeleting = deletingId === issue.id;
            return (
              <div key={issue.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-200 transition flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm">
                
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {issue.imageUrl ? (
                      <img src={issue.imageUrl} alt="" className="h-full w-full object-cover animate-fade-in" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">STATION ID: {issue.id.substring(0, 8).toUpperCase()}</span>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                        {issue.category}
                      </span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        issue.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{issue.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{issue.location?.address || 'District Coordinates'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 justify-between">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded ${
                    issue.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {issue.status}
                  </span>

                  <button 
                    onClick={() => setTrackingIssueId(issue.id)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Track Journey</span>
                  </button>

                  <button
                    onClick={() => handleDeleteIssue(issue.id)}
                    disabled={isDeleting}
                    className={`p-2.5 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Purge Incident"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* TRACKER MODAL */}
      {trackingIssueId && (
        <IssueLiveTracker issueId={trackingIssueId} onClose={() => setTrackingIssueId(null)} />
      )}
    </div>
  );
}