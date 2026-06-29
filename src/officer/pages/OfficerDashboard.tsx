import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useStore, useRehydrateStore } from '../../store';
import { Issue } from '../../types';
import { AppNotification } from '../../store';
import {
  CheckSquare, ShieldAlert, Clock, BarChart2,
  AlertTriangle, ShieldCheck, Cpu, RefreshCw,
  Users, MapPin, Calendar, Eye, MessageSquare, User,
  Activity, TrendingUp, Award, Zap, Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import IssueLiveTracker from '../../components/IssueLiveTracker';
import { format } from 'date-fns';

export default function OfficerDashboard() {
  // Rehydration
  const rehydrated = useRehydrateStore();

  // Store – with safe fallbacks
  const storeIssues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);
  const isFirebaseSession = useStore((state) => state.isFirebaseSession);
  const isInitialized = useStore((state) => state.isInitialized);
  const updateIssueStatus = useStore((state) => state.updateIssueStatus);
  const assignIssue = useStore((state) => state.assignIssue);
  const fetchIssues = useStore((state) => state.fetchIssues);
  const fetchNotifications = useStore((state) => state.fetchNotifications);
  const storeNotifications = useStore((state) => state.notifications);

  // ✅ Always arrays
  const issues = Array.isArray(storeIssues) ? storeIssues : [];
  const notifications = Array.isArray(storeNotifications) ? storeNotifications : [];

  // UI state
  const [viewMode, setViewMode] = useState<'department' | 'all'>('department');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  // --- Initial load (with rehydration) ---
  useEffect(() => {
    if (!isInitialized || !rehydrated) {
      setLoading(true);
      return;
    }
    const loadData = async () => {
      try {
        const hasLocalIssues = issues.length > 0;
        if (isFirebaseSession && user) {
          if (hasLocalIssues) {
            setLoading(false);
            initialLoadDone.current = true;
            await fetchIssues().catch(console.error);
          } else {
            setLoading(true);
            await fetchIssues();
            setLoading(false);
            initialLoadDone.current = true;
          }
          setLastUpdated(new Date());
        } else if (user && user.role === 'Guest') {
          setLoading(false);
          initialLoadDone.current = true;
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
        if (issues.length > 0) toast.error('Using cached data – server unreachable');
      }
    };
    loadData();
  }, [isInitialized, rehydrated, isFirebaseSession, user, fetchIssues, issues.length]);

  // --- Auto‑assign unassigned issues (matches server) ---
  useEffect(() => {
    if (!user || !user.departmentId || !isFirebaseSession || !rehydrated) return;
    if (issues.length === 0) return;

    const unassignedIssues = issues.filter(
      issue =>
        !issue.departmentId &&
        issue.status !== 'Resolved' &&
        ['Pothole', 'Broken Road', 'Damaged Light', 'Water Leakage'].includes(issue.category || '')
    );

    if (unassignedIssues.length > 0) {
      const batch = unassignedIssues.slice(0, 5);
      batch.forEach(issue => {
        // ✅ Only send what the server expects
        assignIssue(
          issue.id,
          user.departmentId!,
          user.uid,
          user.displayName
        ).catch(console.error);
      });
      console.log(`Auto‑assigned ${batch.length} issues to department ${user.departmentId}`);
    }
  }, [issues, user, isFirebaseSession, rehydrated, assignIssue]);

  // --- Polling (every 5s) ---
  useEffect(() => {
    if (!isFirebaseSession || !user || user.role === 'Guest' || !rehydrated) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }
    pollIntervalRef.current = setInterval(() => {
      fetchIssues()
        .then(() => setLastUpdated(new Date()))
        .catch(console.error);
      fetchNotifications().catch(console.error);
    }, 5000);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isFirebaseSession, user, rehydrated, fetchIssues, fetchNotifications]);

  // --- Manual refresh ---
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchIssues();
      await fetchNotifications();
      setLastUpdated(new Date());
      toast.success('Dashboard refreshed successfully');
    } catch (err) {
      console.error('Refresh failed:', err);
      toast.error('Failed to refresh – check your connection');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchIssues, fetchNotifications]);

  // --- Status update (matches PUT /api/issues/:id/status) ---
  const handleUpdateStatus = useCallback(async (
    issueId: string,
    newStatus: 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved'
  ) => {
    if (!user) return;
    if (updatingIssueId) {
      toast.error('Please wait for the current update to finish');
      return;
    }
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
      toast.error('Issue not found');
      return;
    }
    setUpdatingIssueId(issueId);
    try {
      await updateIssueStatus(issueId, newStatus, user.displayName, user.uid);
      toast.success(`Case #${issueId.substring(0, 6).toUpperCase()} → ${newStatus}`);
      await fetchIssues();
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error('❌ Status update failed:', e);
      toast.error(e?.message || `Failed to update case #${issueId.substring(0, 6).toUpperCase()}`);
    } finally {
      setUpdatingIssueId(null);
    }
  }, [user, issues, updateIssueStatus, fetchIssues, updatingIssueId]);

  // --- Notifications ---
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  // --- Filtering & metrics ---
  const {
    departmentIssues,
    allIssues,
    metrics,
    recentActivity,
    resolvedToday,
    pendingCount
  } = useMemo(() => {
    const activeIssues = issues.filter(i => i.status !== 'Resolved');
    const deptIssues = user?.departmentId
      ? activeIssues.filter(i => i.departmentId === user.departmentId)
      : activeIssues;
    const allActive = activeIssues;

    const totalAssigned = deptIssues.length;
    const submittedCount = deptIssues.filter(i =>
      i.status === 'Submitted' || i.status === 'Under Review'
    ).length;
    const inProgressCount = deptIssues.filter(i =>
      i.status === 'In Progress'
    ).length;
    const resolvedCount = issues.filter(i =>
      i.status === 'Resolved' &&
      i.departmentId === user?.departmentId
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedTodayCount = issues.filter(i => {
      if (i.status !== 'Resolved') return false;
      if (i.departmentId !== user?.departmentId) return false;
      const resolvedDate = new Date(i.updatedAt || i.createdAt);
      resolvedDate.setHours(0, 0, 0, 0);
      return resolvedDate.getTime() === today.getTime();
    }).length;

    const resolvedIssues = issues.filter(i =>
      i.status === 'Resolved' &&
      i.departmentId === user?.departmentId
    );
    const avgResponseTime = resolvedIssues.length > 0
      ? Math.round(
          resolvedIssues.reduce((acc, issue) => {
            const submittedTime = issue.createdAt;
            const resolvedTime = issue.updatedAt || issue.createdAt;
            return acc + (resolvedTime - submittedTime);
          }, 0) / resolvedIssues.length / (1000 * 60 * 60)
        )
      : 0;

    const recent = [...issues]
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
      .slice(0, 5);

    return {
      departmentIssues: deptIssues,
      allIssues: allActive,
      metrics: {
        totalAssigned,
        submittedCount,
        inProgressCount,
        resolvedCount,
        avgResponseTime,
        totalCityWide: allActive.length,
        resolvedToday: resolvedTodayCount,
      },
      recentActivity: recent,
      resolvedToday: resolvedTodayCount,
      pendingCount: submittedCount + inProgressCount,
    };
  }, [issues, user]);

  const displayIssues = useMemo(() => {
    return viewMode === 'department' ? departmentIssues : allIssues;
  }, [viewMode, departmentIssues, allIssues]);

  // --- Styles ---
  const severityStyles: Record<string, string> = {
    Critical: 'bg-red-50 text-red-700 border-red-100',
    High: 'bg-orange-50 text-orange-700 border-orange-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Low: 'bg-blue-50 text-blue-700 border-blue-100'
  };
  const statusStyles: Record<string, string> = {
    Submitted: 'bg-sky-50 text-sky-700 border-sky-100',
    'Under Review': 'bg-purple-50 text-purple-700 border-purple-100',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-slate-100 rounded-2xl" />
            <div className="h-64 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Please log in to view dashboard</p>
        </div>
      </div>
    );
  }

  // --- Metric cards ---
  const metricCards = [
    {
      name: 'Active Dispatches',
      value: metrics.totalAssigned,
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
      subtitle: `${metrics.inProgressCount} in progress`,
      trend: metrics.totalAssigned > 0 ? 'active' : 'idle'
    },
    {
      name: 'Avg Response Time',
      value: `${metrics.avgResponseTime}h`,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
      subtitle: 'To resolution',
      trend: metrics.avgResponseTime < 24 ? 'good' : 'warning'
    },
    {
      name: 'Pending Review',
      value: metrics.submittedCount,
      icon: ShieldCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-100',
      subtitle: 'Awaiting inspection',
      trend: metrics.submittedCount > 0 ? 'needs-attention' : 'clear'
    },
    {
      name: 'City-Wide Active',
      value: metrics.totalCityWide,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100',
      subtitle: 'All departments',
      trend: 'info'
    }
  ];

  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-8 text-left font-sans" id="officer-dashboard-workspace">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              OPS AREA: {user.departmentId === 'dept-1' ? 'Road Maintenance' : `Dept ${user.departmentId?.toUpperCase() || 'Unassigned'}`}
            </span>
            {isFirebaseSession && (
              <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Incident Operations Dashboard
            {isRefreshing && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />}
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            {viewMode === 'department'
              ? `Managing ${metrics.totalAssigned} active issues in your department`
              : `Viewing all ${metrics.totalCityWide} active city-wide issues`}
            <span className="text-[10px] text-slate-400 ml-2">
              • Last updated: {format(lastUpdated, 'h:mm:ss a')}
            </span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer relative"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Notifications</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer ${n.unread ? 'bg-sky-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{n.title}</p>
                          <p className="text-[10px] text-slate-500">{n.text}</p>
                        </div>
                        {n.unread && <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-900 rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              toast.success('Emergency dispatch notification sent to all crews');
              fetchNotifications();
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Dispatch Alerts
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(metric => (
          <div key={metric.name} className={`bg-white border rounded-2xl p-5 shadow-sm ${metric.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{metric.name}</span>
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{metric.value}</p>
            {metric.subtitle && (
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                {metric.trend === 'active' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                {metric.trend === 'warning' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                {metric.trend === 'needs-attention' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {metric.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Issues list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm gap-2">
            <div className="space-y-0.5">
              <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                Active Dispatches
              </h3>
              {user.departmentId && (
                <p className="text-[10px] text-slate-400 font-bold">
                  Department: <span className="text-emerald-600">
                    {user.departmentId === 'dept-1' ? 'Road Maintenance Division' : `Dept ${user.departmentId.toUpperCase()}`}
                  </span>
                </p>
              )}
            </div>
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setViewMode('department')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                  viewMode === 'department' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                My Dept ({departmentIssues.length})
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                  viewMode === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All City ({allIssues.length})
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {displayIssues.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <CheckSquare className="w-10 h-10 text-slate-300" />
                  <p className="text-xs text-slate-400 font-bold">
                    {viewMode === 'department'
                      ? 'No active dispatches in your department. All clear!'
                      : 'No active city-wide issues. Great job, teams!'}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    {issues.filter(i => i.status === 'Resolved').length} issues resolved
                  </p>
                </div>
              </div>
            ) : (
              displayIssues.slice(0, 5).map(issue => {
                const isDeptIssue = issue.departmentId === user.departmentId;
                const isUpdating = updatingIssueId === issue.id;

                return (
                  <div key={issue.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-100 transition space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black font-mono text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                            #{issue.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                            severityStyles[issue.severity] || 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                            statusStyles[issue.status] || 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {issue.status}
                          </span>
                          {isDeptIssue && (
                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              MY DEPT
                            </span>
                          )}
                          {issue.category && (
                            <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {issue.category}
                            </span>
                          )}
                        </div>
                        <h4 className="text-md font-bold text-slate-900 mt-1.5 line-clamp-1">{issue.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 font-semibold">
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {issue.reporterName || 'Anonymous'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(issue.createdAt), 'MMM d, h:mm a')}
                          </span>
                          {issue.location?.address && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {issue.location.address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {issue.upvotes || 0} votes
                          </span>
                        </div>
                      </div>

                      {issue.imageUrl && (
                        <div className="h-16 w-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={issue.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* ACTION BUTTONS — only for Officers/Admins */}
                    <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="text-slate-400 font-bold">
                        {isDeptIssue ? (
                          <span className="text-emerald-600 font-black">✓ Your Department</span>
                        ) : issue.departmentId ? (
                          <span className="text-slate-400">Other Dept: {issue.departmentId}</span>
                        ) : (
                          <span className="text-amber-500">⏳ Unassigned</span>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedTrackingId(issue.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider rounded-lg transition-transform active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Track
                        </button>

                        {/* ✅ Only Officers and Admins can update status */}
                        {isOfficerOrAdmin && (
                          <>
                            {issue.status === 'Submitted' && (
                              <button
                                onClick={() => handleUpdateStatus(issue.id, 'Under Review')}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-700 font-bold text-[11px] rounded-lg transition cursor-pointer disabled:opacity-50"
                              >
                                Inspect
                              </button>
                            )}
                            {['Submitted', 'Under Review'].includes(issue.status) && (
                              <button
                                onClick={() => handleUpdateStatus(issue.id, 'In Progress')}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 font-bold text-[11px] rounded-lg transition cursor-pointer disabled:opacity-50"
                              >
                                Start Work
                              </button>
                            )}
                            {issue.status === 'In Progress' && (
                              <button
                                onClick={() => handleUpdateStatus(issue.id, 'Resolved')}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-lg transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                Resolve
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {displayIssues.length > 5 && (
            <div className="text-center pt-2">
              <button
                onClick={() => window.location.href = '/officer/issues'}
                className="text-sm font-black text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1 mx-auto"
              >
                View All {displayIssues.length} Issues →
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Stats & Activity */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Today's Performance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Resolved Today</p>
                <p className="text-xl font-black text-emerald-600">{metrics.resolvedToday}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Pending</p>
                <p className="text-xl font-black text-amber-600">{pendingCount}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Resolution Rate</p>
                <p className="text-xl font-black text-blue-600">
                  {metrics.totalAssigned + metrics.resolvedCount > 0
                    ? `${Math.round((metrics.resolvedCount / (metrics.totalAssigned + metrics.resolvedCount)) * 100)}%`
                    : '0%'}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Total Cases</p>
                <p className="text-xl font-black text-slate-900">{issues.length}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Recent Activity
            </h3>
            <div className="space-y-3.5 text-left max-h-[250px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((issue) => (
                  <div key={issue.id} className="flex gap-3 text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${
                      issue.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : issue.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {issue.status === 'Resolved' ? '✓' : issue.status === 'In Progress' ? '⚡' : '•'}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{issue.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          statusStyles[issue.status] || 'bg-slate-50 text-slate-600'
                        }`}>
                          {issue.status}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {format(new Date(issue.updatedAt || issue.createdAt), 'h:mm a')}
                        </span>
                        {issue.departmentId === user.departmentId && (
                          <span className="text-[8px] text-emerald-600 font-black">• My Dept</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SLA */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 space-y-3 text-left">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-black tracking-widest text-emerald-700 uppercase">
                Department SLA
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Resolution Rate</span>
                <span className="text-emerald-700">
                  {metrics.totalAssigned + metrics.resolvedCount > 0
                    ? `${Math.round((metrics.resolvedCount / (metrics.totalAssigned + metrics.resolvedCount)) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: metrics.totalAssigned + metrics.resolvedCount > 0
                      ? `${Math.round((metrics.resolvedCount / (metrics.totalAssigned + metrics.resolvedCount)) * 100)}%`
                      : '100%'
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>{metrics.resolvedCount} Resolved</span>
                <span>{metrics.totalAssigned} Active</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 font-mono pt-2 border-t border-emerald-200">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Realtime sync: {format(lastUpdated, 'h:mm:ss a')}</span>
              {isRefreshing && (
                <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin ml-auto" />
              )}
            </div>

            <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 font-mono pt-1">
              <span className="text-emerald-500">●</span>
              <span>
                {issues.length > 0
                  ? `${issues.length} issues loaded ${isFirebaseSession ? 'from server' : 'from cache'}`
                  : 'No data loaded'}
              </span>
              <span className="text-slate-300">|</span>
              <span>
                {isFirebaseSession ? '🟢 Online' : '🟡 Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TRACKER MODAL */}
      {selectedTrackingId && (
        <IssueLiveTracker
          issueId={selectedTrackingId}
          onClose={() => setSelectedTrackingId(null)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
      `}} />
    </div>
  );
}