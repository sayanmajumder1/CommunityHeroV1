import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { ShieldAlert, MapPin, Clock, CheckCircle2, AlertCircle, Sparkles, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router';
import IssueLiveTracker from '../../components/IssueLiveTracker';

export default function CitizenReportsList() {
  const issues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);
  const fetchIssues = useStore((state) => state.fetchIssues);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved'>('All');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  if (!user) return null;

  const myIssues = issues.filter((i) => i.reporterId === user.uid);
  
  const filteredIssues = myIssues.filter((i) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') {
      return i.status === 'Submitted' || i.status === 'Under Review';
    }
    return i.status === filter;
  });

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-4" id="citizen-reports-list-panel">
      {/* Header section with count */}
      <div className="flex justify-between items-center text-left bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs">
        <div>
          <h2 className="text-xs font-black text-neutral-900 uppercase tracking-wider">My Lodged Complaints</h2>
          <p className="text-[10px] text-neutral-400 font-semibold">{myIssues.length} total reports filed by you</p>
        </div>
        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] tracking-wide uppercase px-3.5 py-2 rounded-xl transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report New</span>
        </Link>
      </div>

      {/* Segmented status filter */}
      <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
        {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
              filter === status
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-200 rounded-3xl p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h4 className="text-xs font-black text-neutral-700">No matching reports found</h4>
            <p className="text-[10px] text-neutral-400 mt-1 max-w-xs mx-auto">
              Any neighborhood issues you log with photos or location details will appear in this feed.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-xs text-left hover:border-emerald-200 transition space-y-3"
            >
              <div className="flex gap-3.5">
                <div className="h-16 w-16 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden shrink-0">
                  {issue.imageUrl ? (
                     <img src={issue.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-500">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-neutral-100 text-neutral-700 uppercase">
                      {issue.category}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide border
                      ${issue.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        issue.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {issue.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-neutral-900 mt-1.5 truncate">{issue.title}</h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">{issue.description}</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-neutral-50 pt-3 text-[9px] text-neutral-400 font-bold">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">{issue.location.address || 'Central Ward 4'}</span>
                </span>
                
                <button
                  onClick={() => setSelectedTrackingId(issue.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black uppercase text-[8px] tracking-wider rounded-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                  </span>
                  <span>Track Live Status</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTrackingId && (
        <IssueLiveTracker
          issueId={selectedTrackingId}
          onClose={() => setSelectedTrackingId(null)}
        />
      )}
    </div>
  );
}
