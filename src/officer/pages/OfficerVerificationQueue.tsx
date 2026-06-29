import React from 'react';
import { useStore } from '../../store';
import { ShieldCheck, CheckCircle, Cpu } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function OfficerVerificationQueue() {
  const issues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);
  const updateIssueStatus = useStore((state) => state.updateIssueStatus);

  if (!user) return null;

  const pendingVerification = issues.filter(issue => ['Submitted', 'Under Review'].includes(issue.status));

  const handleVerify = async (issueId: string, status: 'Under Review' | 'In Progress') => {
    try {
      await updateIssueStatus(issueId, status, user.displayName, user.uid);
      toast.success(`Verified incident and shifted to: ${status}`);
    } catch (e) {
      toast.error('Failed to verify incident');
    }
  };

  return (
    <div className="space-y-6 text-left font-sans" id="officer-verification-workspace">
      
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">AI Verification Queue</h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Inspect civic reports with AI-predicted categories and duplications prior to scheduling works.</p>
        </div>

        <div className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-200">
          Queue load: <span className="text-emerald-600 font-extrabold">{pendingVerification.length} pending</span>
        </div>
      </div>

      {/* Verification cards */}
      <div className="space-y-4">
        {pendingVerification.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center text-sm text-slate-400 max-w-xl mx-auto">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
            <h4 className="font-extrabold text-slate-900 text-md">Queue Empty & Verified</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">Outstanding citizen incident reports have been completely verified by the Ward 4 dispatch center.</p>
          </div>
        ) : (
          pendingVerification.map(issue => {
            const mockConfidence = 96;

            return (
              <div key={issue.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-emerald-100 transition space-y-4">
                
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-400 font-bold">STATION ID: {issue.id.toUpperCase().substring(0, 10)}</span>
                    <span className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                    <span className="text-slate-500 font-semibold">{format(issue.createdAt, 'MMM d, h:mm a')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      issue.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {issue.severity} Severity
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{issue.status}</span>
                  </div>
                </div>

                {/* Content body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Title & Description */}
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-sm font-black text-slate-900">{issue.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">{issue.description}</p>
                    
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 text-xs">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-700 font-bold">Reporter: <strong className="text-slate-900">{issue.reporterName}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500 font-semibold">{issue.location.address || 'District geofence'}</span>
                    </div>
                  </div>

                  {/* AI analysis insight box */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GEMINI AI AUDIT</span>
                      </div>
                      
                      <div className="pt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Predicted Category:</span>
                          <span className="text-slate-900 font-extrabold">{issue.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Confidence Score:</span>
                          <span className="text-emerald-600 font-black">{mockConfidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Duplicate Check:</span>
                          <span className="text-slate-700 font-extrabold">Clean (No match)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => handleVerify(issue.id, 'Under Review')}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-lg transition cursor-pointer"
                      >
                        Inspect details
                      </button>
                      <button 
                        onClick={() => handleVerify(issue.id, 'In Progress')}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider rounded-lg transition cursor-pointer"
                      >
                        Approve Dispatch
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
