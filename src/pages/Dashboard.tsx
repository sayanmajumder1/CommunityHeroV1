import { 
  ShieldAlert, CheckCircle, Clock, TrendingUp, AlertTriangle, 
  MapPin, Check, X, Shield, RefreshCw, BarChart2, Users, FileText 
} from 'lucide-react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { Link } from 'react-router';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export default function Dashboard() {
  const issues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);
  const updateIssueStatus = useStore((state) => state.updateIssueStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!user) return null;

  // --- ACTIONS FOR OFFICERS/ADMINS ---
  const handleUpdateStatus = async (issueId: string, newStatus: 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved') => {
    setUpdatingId(issueId);
    try {
      updateIssueStatus(issueId, newStatus, user.displayName, user.uid);
      toast.success(`Issue updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================
  // CITIZEN DASHBOARD
  // ============================================
  if (user.role === 'Citizen') {
    const stats = [
      { name: 'Total Community Reports', value: issues.length, icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-100' },
      { name: 'Your Reported Issues', value: issues.filter(i => i.reporterId === user.uid).length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
      { name: 'Resolved Community Issues', value: issues.filter(i => i.status === 'Resolved').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      { name: 'Your Contribution Score', value: '480 XP', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Welcome back, {user.displayName}</h1>
            <p className="text-sm text-neutral-500">Here's how your reports are helping shape your neighborhood.</p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Report New Issue
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.name} className="bg-white overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${item.bg} rounded-lg p-3`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{item.name}</dt>
                      <dd>
                        <div className="text-2xl font-bold text-neutral-900">{item.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent reports list */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center bg-white">
            <h3 className="text-lg font-bold text-neutral-900">Recent Community Reports</h3>
            <Link to="/activity" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-500">
                      No reports found. Be the first to improve your community!
                    </td>
                  </tr>
                ) : (
                  issues.slice(0, 5).map((issue) => (
                    <tr key={issue.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-200">
                            {issue.imageUrl ? (
                              <img src={issue.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ShieldAlert className="h-5 w-5 text-neutral-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-neutral-900">{issue.title}</div>
                            <div className="text-xs text-neutral-500 truncate max-w-xs">{issue.location.address || 'Coordinates Provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {issue.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                          ${issue.severity === 'Critical' ? 'bg-red-100 text-red-800' : 
                            issue.severity === 'High' ? 'bg-orange-100 text-orange-800' : 
                            issue.severity === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                          ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800' : 
                            issue.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500 font-medium">
                        {format(issue.createdAt, 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // OFFICER DASHBOARD (STAFF)
  // ============================================
  if (user.role === 'Officer') {
    const pendingIssues = issues.filter(i => i.status !== 'Resolved');
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Officer Dispatch Center</h1>
            <p className="text-sm text-neutral-500">Monitor active community reports and update incident response status.</p>
          </div>
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
            Assigned District: Sector A
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Unresolved</p>
              <h2 className="text-2xl font-extrabold text-neutral-900">{pendingIssues.length}</h2>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Response SLA</p>
              <h2 className="text-2xl font-extrabold text-neutral-900">94.8% <span className="text-xs font-normal text-green-600">On-Time</span></h2>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Weekly Resolved</p>
              <h2 className="text-2xl font-extrabold text-neutral-900">{issues.filter(i => i.status === 'Resolved').length}</h2>
            </div>
          </div>
        </div>

        {/* Officer Verification Queue */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center bg-white">
            <h3 className="text-lg font-bold text-neutral-900">Incident Dispatch & Action Queue</h3>
            <span className="text-xs font-semibold text-neutral-500">{pendingIssues.length} assignments pending</span>
          </div>
          <div className="divide-y divide-neutral-200">
            {pendingIssues.length === 0 ? (
              <div className="p-10 text-center text-sm text-neutral-500">
                All assignments cleared! Great job keeping the community safe.
              </div>
            ) : (
              pendingIssues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-neutral-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200 flex-shrink-0">
                      {issue.imageUrl ? (
                        <img src={issue.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-900 text-sm">{issue.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-neutral-100 text-neutral-700'
                        }`}>{issue.severity}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 max-w-xl">{issue.description}</p>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2 font-medium">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.location.address || 'Unknown'}</span>
                        <span>•</span>
                        <span>Category: {issue.category}</span>
                        <span>•</span>
                        <span>Upvotes: {issue.upvotes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="flex items-center gap-2">
                    {updatingId === issue.id ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                        <RefreshCw className="animate-spin w-4 h-4 text-blue-600" />
                        Updating...
                      </div>
                    ) : (
                      <>
                        {issue.status === 'Submitted' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, 'Under Review')}
                            className="bg-neutral-100 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 border border-neutral-300 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            Mark: Under Review
                          </button>
                        )}
                        {issue.status === 'Under Review' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, 'In Progress')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition"
                          >
                            Mark: Dispatch Team (In Progress)
                          </button>
                        )}
                        {issue.status === 'In Progress' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, 'Resolved')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Resolve Issue
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ADMINISTRATOR DASHBOARD
  // ============================================
  // Admin role gets full system, analytics, and operational dashboard
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;
  const inProgressIssues = issues.filter(i => i.status === 'In Progress').length;
  const criticalIssues = issues.filter(i => i.severity === 'Critical').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-green-600" />
            Platform Security & Admin Console
          </h1>
          <p className="text-sm text-neutral-500 font-medium">Global operations control center for Municipal Corporation.</p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 text-white px-3 py-1 rounded-lg text-xs font-mono font-bold border border-neutral-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          SYSTEM STATE: SECURED
        </div>
      </div>

      {/* Admin Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-neutral-100 text-neutral-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Global Incidents</p>
            <h2 className="text-2xl font-extrabold text-neutral-900">{totalIssues}</h2>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Critical Threats</p>
            <h2 className="text-2xl font-extrabold text-red-600">{criticalIssues}</h2>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Active Workflows</p>
            <h2 className="text-2xl font-extrabold text-neutral-900">{inProgressIssues}</h2>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Resolved SLA</p>
            <h2 className="text-2xl font-extrabold text-neutral-900">
              {totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100}%
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Management */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center bg-white">
            <h3 className="text-lg font-bold text-neutral-900">Platform Issue Management</h3>
            <span className="text-xs bg-neutral-100 px-2 py-1 border border-neutral-200 rounded font-bold text-neutral-600 uppercase">Interactive Master List</span>
          </div>
          <div className="divide-y divide-neutral-200">
            {issues.length === 0 ? (
              <div className="p-10 text-center text-sm text-neutral-500">
                No active issues reported.
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="p-5 hover:bg-neutral-50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900">{issue.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1">Reporter: {issue.reporterName || 'Unknown'} • Category: {issue.category} • Status: <span className="font-semibold text-neutral-700">{issue.status}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(issue.id, 'Resolved')}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 hover:border-green-300 px-2.5 py-1 rounded-lg text-xs font-bold transition"
                    >
                      Instant Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(issue.id, 'In Progress')}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold transition"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics & Rules Overview */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-md font-bold text-neutral-900 flex items-center gap-1.5 mb-1">
              <Shield className="w-5 h-5 text-blue-600" />
              Hardened Access Control
            </h3>
            <p className="text-xs text-neutral-500">Zero-Trust rules enforce role boundary validations across all Firestore entities.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-600">Strict Type Enforcements</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-600">ID Poisoning Filter (regex)</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-600">Self-Privilege Blockers</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-600">Anti-Update-Gap hasOnly()</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">ACTIVE</span>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-5 text-center">
            <p className="text-xs text-neutral-400 leading-normal">
              Admin logs, category weights, and department dispatch workflows are locked in real-time under active audit rules version 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
