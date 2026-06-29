// ============================================
// src/components/officer/OfficerIssuesList.tsx
// ============================================
// 
// PURPOSE: The main issues list view for Officers.
// Shows all issues with filtering, searching, and status updates.
// 
// KEY FEATURES:
// - Displays issues in a grid with status badges
// - Filter by status (Submitted, Under Review, In Progress, Resolved)
// - Filter by scope (My Department or All City)
// - Search by title, description, ID, address, reporter
// - Status update buttons (Inspect, Start Work, Resolve)
// - 🔥 CRITICAL: Syncs local issues to backend on login
// - Live tracking via IssueLiveTracker modal
// - Auto-refresh every 5 seconds
// - Shows "LOCAL" badge for issues not yet synced to backend
// 
// THE CRITICAL FIX: When an Officer logs in, this component automatically
// calls syncLocalIssuesToBackend() to push any local issues to the backend.
// This prevents the "Issue not found" error when updating status.
// ============================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore, useRehydrateStore, getAuthToken } from '../../store';
import { 
  ShieldAlert, MapPin, Activity, RefreshCw,
  Search, Calendar, User, Eye, CheckSquare,
  Filter, Clock, AlertTriangle, MessageSquare, Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import IssueLiveTracker from '../../components/IssueLiveTracker';
import { format } from 'date-fns';

export default function OfficerIssuesList() {
  // ==========================================
  // HOOKS
  // ==========================================
  
  // Rehydration hook - restores state from localStorage
  const rehydrated = useRehydrateStore();

  // Global store subscriptions
  const issues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);
  const isFirebaseSession = useStore((state) => state.isFirebaseSession);
  const isInitialized = useStore((state) => state.isInitialized);
  const updateIssueStatus = useStore((state) => state.updateIssueStatus);
  const assignIssue = useStore((state) => state.assignIssue);
  const fetchIssues = useStore((state) => state.fetchIssues);
  
  // 🔥 CRITICAL: The sync function that fixes the "Issue not found" error
  const syncLocalIssuesToBackend = useStore((state) => state.syncLocalIssuesToBackend);

  // ==========================================
  // LOCAL STATE
  // ==========================================
  
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Under Review' | 'Submitted' | 'Resolved'>('All');
  const [scope, setScope] = useState<'department' | 'all'>('department');
  const [trackingIssueId, setTrackingIssueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Refs for polling and sync tracking
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);
  const syncDone = useRef(false);

  // ==========================================
  // 🔥 CRITICAL: SYNC LOCAL ISSUES TO BACKEND ON LOGIN
  // ==========================================
  
  /**
   * This effect runs when a user logs in as Officer or Admin.
   * It pushes all local issues to the backend to prevent "Issue not found" errors.
   * 
   * WHY THIS IS CRITICAL:
   * - Issues created in Guest mode or offline only exist in localStorage
   * - When the user later logs in as Officer, the backend doesn't know about these issues
   * - Trying to update status on a backend-missing issue causes 404
   * - This sync fixes that by creating all local issues in the backend
   */
  useEffect(() => {
    // Wait for initialization and rehydration
    if (!isInitialized || !rehydrated || !isFirebaseSession || !user) return;
    if (syncDone.current) return;
    
    // Only sync if user is Officer or Admin (they have permission to update issues)
    if (user.role !== 'Officer' && user.role !== 'Admin') return;
    
    // Check if we have local issues that might not be in backend
    const hasLocalIssues = issues.length > 0;
    if (!hasLocalIssues) {
      syncDone.current = true;
      return;
    }
    
    // Check if we have non-seed issues (issues created locally)
    const nonSeedIssues = issues.filter(i => !i.id.startsWith('seed-'));
    if (nonSeedIssues.length === 0) {
      syncDone.current = true;
      return;
    }
    
    console.log(`🔄 Found ${nonSeedIssues.length} local issues to sync`);
    setIsSyncing(true);
    
    // Call the sync function from the store
    syncLocalIssuesToBackend()
      .then(({ syncedCount, errorCount }) => {
        if (syncedCount > 0) {
          toast.success(`Synced ${syncedCount} local issues to server`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to sync ${errorCount} issues`);
        }
        syncDone.current = true;
      })
      .catch(console.error)
      .finally(() => {
        setIsSyncing(false);
      });
  }, [isInitialized, rehydrated, isFirebaseSession, user, issues, syncLocalIssuesToBackend]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  
  /**
   * Loads issues on component mount.
   * Shows local issues immediately, then refreshes from backend.
   */
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
            // Show local issues immediately (fast UX)
            setLoading(false);
            initialLoadDone.current = true;
            // Then refresh from backend in background
            await fetchIssues().catch(console.error);
          } else {
            // No local issues, fetch from backend
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
        console.error('Error loading issues:', error);
        setLoading(false);
        if (issues.length > 0) {
          toast.error('Using cached data - server unreachable');
        }
      }
    };

    loadData();
  }, [isInitialized, rehydrated, isFirebaseSession, user, fetchIssues, issues.length]);

  // ==========================================
  // POLLING (Realtime updates)
  // ==========================================
  
  /**
   * Polls the backend every 5 seconds for new issues and updates.
   * This keeps the officer's view in sync with citizen submissions.
   */
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
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isFirebaseSession, user, rehydrated, fetchIssues]);

  // ==========================================
  // AUTO-ASSIGN
  // ==========================================
  
  /**
   * Automatically assigns unassigned issues to the officer's department.
   * This routes citizen reports to the correct department automatically.
   */
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
        assignIssue(
          issue.id,
          user.departmentId!,
          user.uid,
          user.displayName,
          'system',
          'Auto-assigned to department'
        ).catch(console.error);
      });
    }
  }, [issues, user, isFirebaseSession, rehydrated, assignIssue]);

  // ==========================================
  // REFRESH
  // ==========================================
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchIssues();
      setLastUpdated(new Date());
      toast.success('Issues list refreshed');
    } catch (err) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchIssues]);

  // ==========================================
  // 🔥 STATUS UPDATE WITH SYNC CHECK
  // ==========================================
  
  /**
   * Updates the status of an issue.
   * 
   * THE CRITICAL FIX: Before updating, this checks if the issue exists in
   * the backend. If not, it creates it first. This prevents the 404 error.
   * 
   * This is the SECOND line of defense (the first is sync on login).
   * Even if sync didn't run, this will still work by creating the issue
   * on-demand before updating it.
   */
  const handleUpdateStatus = useCallback(async (
    issueId: string, 
    newStatus: 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved'
  ) => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }
    
    console.log(`🔍 Attempting to update status for issue: ${issueId}`);
    console.log(`🔍 Current issues in store:`, issues.map(i => ({ id: i.id, title: i.title })));
    
    // Find the issue in the store
    const issueInStore = issues.find(i => i.id === issueId);
    if (!issueInStore) {
      toast.error(`Issue ${issueId} not found in local store`);
      return;
    }
    
    // 🔥 CRITICAL: If we're in Firebase session, check if the issue exists in backend
    if (isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        
        // Check if issue exists in backend
        const checkRes = await fetch(`/api/issues/${issueId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (checkRes.status === 404) {
          // Issue doesn't exist in backend - create it first
          console.log(`📤 Issue ${issueId} not in backend, creating it first...`);
          toast.loading('Syncing issue to server...', { id: 'sync-toast' });
          
          const createRes = await fetch('/api/issues', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              id: issueInStore.id,
              title: issueInStore.title,
              description: issueInStore.description || 'No description provided',
              category: issueInStore.category || 'Other',
              severity: issueInStore.severity || 'Medium',
              status: issueInStore.status || 'Submitted',
              lat: issueInStore.location?.lat ?? issueInStore.lat ?? 0,
              lng: issueInStore.location?.lng ?? issueInStore.lng ?? 0,
              address: issueInStore.location?.address ?? issueInStore.address ?? null,
              imageUrl: issueInStore.imageUrl ?? null,
              departmentId: issueInStore.departmentId ?? null,
              reporterId: issueInStore.reporterId ?? 'unknown',
              reporterName: issueInStore.reporterName ?? 'Anonymous',
            })
          });
          
          toast.dismiss('sync-toast');
          
          if (!createRes.ok) {
            const errorText = await createRes.text();
            console.error(`❌ Failed to create issue: ${errorText}`);
            toast.error('Failed to sync issue to server');
            return;
          }
          
          console.log(`✅ Issue ${issueId} created in backend`);
          toast.success('Issue synced to server');
          
          // Refresh issues after creation
          await fetchIssues();
        }
      } catch (error) {
        console.error('Error checking issue in backend:', error);
        toast.error('Failed to verify issue on server');
        return;
      }
    }
    
    // Now update the status
    try {
      await updateIssueStatus(issueId, newStatus, user.displayName, user.uid);
      toast.success(`Case #${issueId.substring(0, 6).toUpperCase()} → ${newStatus}`);
      await fetchIssues();
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error(`❌ Status update failed for issue: ${issueId}`, e);
      const errorMessage = e?.message || 'Failed to update status';
      toast.error(errorMessage);
    }
  }, [user, issues, isFirebaseSession, updateIssueStatus, fetchIssues]);

  // ==========================================
  // FILTERING
  // ==========================================
  
  /**
   * Filters and sorts issues based on user preferences.
   * Memoized for performance.
   */
  const filteredIssues = useMemo(() => {
    let result = issues;

    // Filter by status
    if (filter !== 'All') {
      result = result.filter(issue => issue.status === filter);
    }

    // Filter by department scope
    if (scope === 'department' && user?.departmentId) {
      result = result.filter(issue => issue.departmentId === user.departmentId);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(issue =>
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.id.toLowerCase().includes(query) ||
        (issue.location?.address || '').toLowerCase().includes(query) ||
        (issue.reporterName || '').toLowerCase().includes(query) ||
        (issue.category || '').toLowerCase().includes(query)
      );
    }

    // Sort by newest first
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [issues, filter, scope, user, searchQuery]);

  // ==========================================
  // STATS
  // ==========================================
  
  const stats = useMemo(() => {
    const deptIssues = filteredIssues.filter(i => i.departmentId === user?.departmentId);
    return {
      total: filteredIssues.length,
      department: deptIssues.length,
      submitted: filteredIssues.filter(i => i.status === 'Submitted').length,
      inProgress: filteredIssues.filter(i => i.status === 'In Progress').length,
      resolved: filteredIssues.filter(i => i.status === 'Resolved').length,
      underReview: filteredIssues.filter(i => i.status === 'Under Review').length,
    };
  }, [filteredIssues, user]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  
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

  // ==========================================
  // LOADING STATE
  // ==========================================
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-slate-100 rounded-2xl" />
            ))}
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
          <p className="text-slate-500 font-bold">Please log in to view issues</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <div className="space-y-6 text-left font-sans" id="officer-issues-workspace">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            Operations Dispatch Registry
          </h2>
          <p className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            {scope === 'department' 
              ? `Showing ${stats.department} issues in your department` 
              : `Showing ${stats.total} city-wide issues`}
            <span className="text-[10px] text-slate-400">
              • Updated: {format(lastUpdated, 'h:mm:ss a')}
            </span>
            {isRefreshing && (
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
            )}
            {isSyncing && (
              <span className="text-[10px] text-amber-600 flex items-center gap-1">
                <Upload className="w-3 h-3 animate-pulse" />
                Syncing...
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div className="bg-white border border-slate-200 p-3 rounded-xl text-center">
          <p className="text-[8px] text-slate-400 font-bold uppercase">Total</p>
          <p className="text-lg font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl text-center">
          <p className="text-[8px] text-sky-600 font-bold uppercase">Submitted</p>
          <p className="text-lg font-black text-sky-700">{stats.submitted}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl text-center">
          <p className="text-[8px] text-purple-600 font-bold uppercase">Review</p>
          <p className="text-lg font-black text-purple-700">{stats.underReview}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
          <p className="text-[8px] text-amber-600 font-bold uppercase">In Progress</p>
          <p className="text-lg font-black text-amber-700">{stats.inProgress}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
          <p className="text-[8px] text-emerald-600 font-bold uppercase">Resolved</p>
          <p className="text-lg font-black text-emerald-700">{stats.resolved}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
          <p className="text-[8px] text-slate-400 font-bold uppercase">My Dept</p>
          <p className="text-lg font-black text-slate-900">{stats.department}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
            {(['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                  filter === tab 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'All' ? 'All' : tab}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setScope('department')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                scope === 'department' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              My Dept
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                scope === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All City
            </button>
          </div>
        </div>
      </div>

      {/* ISSUES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-2 bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center text-sm text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <CheckSquare className="w-10 h-10 text-slate-300" />
              <p className="font-bold">No incidents found</p>
              <p className="text-xs">{issues.length > 0 ? 'All issues resolved!' : 'No issues reported yet'}</p>
              {(searchQuery || filter !== 'All' || scope === 'department') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('All');
                    setScope('department');
                  }}
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredIssues.map(issue => {
            const isDeptIssue = issue.departmentId === user.departmentId;
            
            return (
              <div key={issue.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-100 transition flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Header with badges */}
                  <div className="flex justify-between items-start text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        #{issue.id.substring(0, 8).toUpperCase()}
                      </span>
                      {isDeptIssue && (
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          MY DEPT
                        </span>
                      )}
                      {/* 🔥 "LOCAL" badge - shows this issue exists in localStorage but may not be in backend */}
                      {!issue.id.startsWith('seed-') && (
                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          LOCAL
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                      statusStyles[issue.status] || 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {issue.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex gap-3">
                    {issue.imageUrl ? (
                      <div className="h-14 w-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
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
                    ) : (
                      <div className="h-14 w-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{issue.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-semibold">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{issue.reporterName || 'Anonymous'}</span>
                      <span className="text-slate-300 mx-1">•</span>
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{format(new Date(issue.createdAt), 'MMM d')}</span>
                      <span className="text-slate-300 mx-1">•</span>
                      <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{issue.upvotes || 0} votes</span>
                    </p>
                    {issue.location?.address && (
                      <p className="flex items-center gap-1.5 font-semibold truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{issue.location.address}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {issue.category && (
                        <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {issue.category}
                        </span>
                      )}
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                        severityStyles[issue.severity] || 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {issue.severity}
                      </span>
                      {!issue.departmentId && (
                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex gap-2">
                    {issue.status === 'Submitted' && (
                      <button 
                        onClick={() => handleUpdateStatus(issue.id, 'Under Review')}
                        className="flex-1 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-700 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    )}
                    {['Submitted', 'Under Review'].includes(issue.status) && (
                      <button 
                        onClick={() => handleUpdateStatus(issue.id, 'In Progress')}
                        className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                      >
                        Start Work
                      </button>
                    )}
                    {issue.status === 'In Progress' && (
                      <button 
                        onClick={() => handleUpdateStatus(issue.id, 'Resolved')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => setTrackingIssueId(issue.id)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Track Live Journey</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TRACKER MODAL */}
      {trackingIssueId && (
        <IssueLiveTracker 
          issueId={trackingIssueId} 
          onClose={() => setTrackingIssueId(null)} 
        />
      )}
    </div>
  );
}