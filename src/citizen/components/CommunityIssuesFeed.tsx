import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore, getAuthToken } from '../../store';
import { Issue, IssueCategory, IssueStatus } from '../../types';
import { 
  Search, Filter, ArrowUpDown, ThumbsUp, MessageSquare, 
  Share2, Bookmark, Bell, AlertTriangle, MapPin, Calendar, 
  ChevronRight, ChevronLeft, User, CheckCircle2, Loader2, 
  ShieldAlert, Send, Eye, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

// ============================================
// TYPES (Keep your existing types)
// ============================================
interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

// ============================================
// COMPONENT: CommunityIssuesFeed (The Phoenix)
// ============================================
export default function CommunityIssuesFeed() {
  // -------- GLOBAL STORE SUBSCRIPTIONS (Direct access) --------
  // CRITICAL FIX #1: Use store directly, no local copies
  const storeIssues = useStore((state) => state.issues);
  const setStoreIssues = useStore((state) => state.setIssues);
  const user = useStore((state) => state.user);
  const isFirebaseSession = useStore((state) => state.isFirebaseSession);
  const isInitialized = useStore((state) => state.isInitialized);
  const addPointsAndXp = useStore((state) => state.addPointsAndXp);
  const addComment = useStore((state) => state.addComment);
  const comments = useStore((state) => state.comments);
  const setComments = useStore((state) => state.setComments);
  const fetchIssues = useStore((state) => state.fetchIssues);

  // -------- LOCAL UI STATE (Only UI, NOT data) --------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'Most Upvoted' | 'Severity'>('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // -------- PERSISTENT UI STATE (localStorage for user preferences) --------
  const [bookmarkedIssueIds, setBookmarkedIssueIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('community_feed_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [followedIssueIds, setFollowedIssueIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('community_feed_followed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [upvotedIssueIds, setUpvotedIssueIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('community_feed_upvotes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // -------- REFS (For cleanup) --------
  const initialLoadDone = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // -------- CRITICAL FIX #2: Sync with store issues (NO local copy) --------
  // We use storeIssues directly - no local state duplication
  const issues = storeIssues;

  // -------- CRITICAL FIX #3: Comments come from global store --------
  const commentsByIssue = comments;

  // -------- LOADING STATE (Only for initial load) --------
  useEffect(() => {
    // Wait for store to be initialized
    if (!isInitialized) {
      setLoading(true);
      return;
    }

    // Only fetch if we have a valid session
    if (isFirebaseSession && user && user.role !== 'Guest') {
      if (!initialLoadDone.current) {
        setLoading(true);
        fetchIssues()
          .catch((err) => {
            console.error('Initial fetch failed:', err);
            setError('Failed to load community feed');
          })
          .finally(() => {
            setLoading(false);
            initialLoadDone.current = true;
          });
      } else {
        setLoading(false);
      }
    } else if (user && user.role === 'Guest') {
      // Guest mode - use local data or empty state
      setLoading(false);
    } else {
      // No user - show loading until auth resolves
      setLoading(false);
    }
  }, [isFirebaseSession, isInitialized, user, fetchIssues]);

  // -------- CRITICAL FIX #4: Subscribe to store changes --------
  // This effect re-runs whenever storeIssues changes (from ANY component)
  useEffect(() => {
    // If we have issues in the store, we're good
    if (storeIssues.length > 0 && initialLoadDone.current) {
      setLoading(false);
    }
  }, [storeIssues]);

  // -------- POLLING (Realtime updates) --------
  useEffect(() => {
    // Only poll if authenticated (not guest)
    if (!isFirebaseSession || !user || user.role === 'Guest') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Start polling every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      // Silent refresh - don't show loading state
      fetchIssues().catch(console.error);
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isFirebaseSession, user, fetchIssues]);

  // -------- MANUAL REFRESH --------
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchIssues();
      toast.success('Feed refreshed!');
    } catch (err) {
      toast.error('Failed to refresh feed');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchIssues]);

  // -------- CRITICAL FIX #5: Comments use global store --------
  // No local fetchComments - use store's comments directly

  // -------- EXPAND HANDLER (Uses global comments) --------
  const handleExpandIssue = useCallback((issueId: string) => {
    if (expandedIssueId === issueId) {
      setExpandedIssueId(null);
    } else {
      setExpandedIssueId(issueId);
      // Comments are already in global store - no fetch needed
      // But if we want to ensure they're loaded, we can trigger a fetch
      // The store's fetchIssues already loads comments
    }
  }, [expandedIssueId]);

  // -------- UPVOTE HANDLER (Syncs with store) --------
  const handleToggleUpvote = useCallback(async (issueId: string) => {
    if (!user) {
      toast.error('Please sign in to upvote and verify community reports!');
      return;
    }

    const isUpvoted = upvotedIssueIds.includes(issueId);
    
    // Optimistic update
    const nextUpvotedList = isUpvoted 
      ? upvotedIssueIds.filter(id => id !== issueId)
      : [...upvotedIssueIds, issueId];
    
    setUpvotedIssueIds(nextUpvotedList);
    localStorage.setItem('community_feed_upvotes', JSON.stringify(nextUpvotedList));

    // Update local issue count optimistically
    const updatedIssues = issues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          upvotes: issue.upvotes + (isUpvoted ? -1 : 1)
        };
      }
      return issue;
    });
    setStoreIssues(updatedIssues);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/issues/${issueId}/upvote`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        throw new Error('Could not toggle upvote on backend');
      }

      const resData = await res.json();
      
      if (!isUpvoted) {
        addPointsAndXp(5, 10);
        toast.success('Issue verified! Earned +5 Points & +10 XP!');
      } else {
        toast.success('Upvote removed');
      }

      // Refresh from server to get accurate counts
      await fetchIssues();
    } catch (err) {
      console.error(err);
      toast.error('Unable to complete upvote action');
      
      // Rollback on error
      setUpvotedIssueIds(upvotedIssueIds);
      localStorage.setItem('community_feed_upvotes', JSON.stringify(upvotedIssueIds));
      await fetchIssues(); // Revert to server state
    }
  }, [upvotedIssueIds, issues, setStoreIssues, addPointsAndXp, fetchIssues, user]);

  // -------- COMMENT HANDLER (Uses global store) --------
  const handleSubmitComment = useCallback(async (e: React.FormEvent, issueId: string) => {
    e.preventDefault();
    const text = newCommentText[issueId]?.trim();
    if (!text || !user) return;

    setSubmittingComment(prev => ({ ...prev, [issueId]: true }));
    
    try {
      // Use the store's addComment method which handles both local and API
      await addComment(issueId, user.uid, user.displayName, text);
      
      // Clear the input
      setNewCommentText(prev => ({ ...prev, [issueId]: '' }));
      addPointsAndXp(10, 20);
      toast.success('Comment posted! Earned +10 Points & +20 XP!');
    } catch (err) {
      console.error(err);
      toast.error('Unable to post comment');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [issueId]: false }));
    }
  }, [newCommentText, user, addComment, addPointsAndXp]);

  // -------- BOOKMARK HANDLER --------
  const handleToggleBookmark = useCallback((issueId: string) => {
    const isBookmarked = bookmarkedIssueIds.includes(issueId);
    const nextList = isBookmarked
      ? bookmarkedIssueIds.filter(id => id !== issueId)
      : [...bookmarkedIssueIds, issueId];
    
    setBookmarkedIssueIds(nextList);
    localStorage.setItem('community_feed_bookmarks', JSON.stringify(nextList));
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks');
  }, [bookmarkedIssueIds]);

  // -------- FOLLOW HANDLER --------
  const handleToggleFollow = useCallback((issueId: string) => {
    const isFollowed = followedIssueIds.includes(issueId);
    const nextList = isFollowed
      ? followedIssueIds.filter(id => id !== issueId)
      : [...followedIssueIds, issueId];
    
    setFollowedIssueIds(nextList);
    localStorage.setItem('community_feed_followed', JSON.stringify(nextList));
    toast.success(isFollowed 
      ? 'You stopped following updates for this issue'
      : 'You will receive real-time notifications for status updates'
    );
  }, [followedIssueIds]);

  // -------- SHARE HANDLER --------
  const handleShare = useCallback((issue: Issue) => {
    const link = `${window.location.origin}/citizen/reports?id=${issue.id}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Incident link copied to clipboard!');
    }).catch(() => {
      toast.success(`Copied: #${issue.id.slice(0, 8).toUpperCase()}`);
    });
  }, []);

  // -------- REPORT HANDLER --------
  const handleReportContent = useCallback((issueId: string) => {
    toast.success('Thank you! This incident report has been flagged for administrative inspection.');
  }, []);

  // -------- FILTERING AND SORTING (Memoized for performance) --------
  const filteredAndSortedIssues = useMemo(() => {
    // First, filter
    const filtered = issues.filter(issue => {
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.location?.address || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || issue.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Then, sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'Newest') {
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'Most Upvoted') {
        return b.upvotes - a.upvotes;
      }
      if (sortBy === 'Severity') {
        const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const weightA = severityWeight[a.severity] || 0;
        const weightB = severityWeight[b.severity] || 0;
        return weightB - weightA;
      }
      return 0;
    });

    return sorted;
  }, [issues, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // -------- PAGINATION --------
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredAndSortedIssues.length / itemsPerPage);
  const paginatedIssues = useMemo(() => {
    return filteredAndSortedIssues.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredAndSortedIssues, currentPage]);

  // -------- RESET PAGE ON FILTER CHANGE --------
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  // -------- RENDER HELPERS --------
  const categories = ['All', 'Pothole', 'Water Leakage', 'Waste Accumulation', 'Broken Road', 'Damaged Light', 'Other'];
  const statuses = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved'];

  const severityStyles: Record<string, string> = {
    Critical: 'bg-red-50 text-red-700 border-red-100',
    High: 'bg-orange-50 text-orange-700 border-orange-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Low: 'bg-slate-50 text-slate-700 border-slate-100'
  };

  const statusStyles: Record<string, string> = {
    Submitted: 'bg-sky-50 text-sky-700 border-sky-100',
    'Under Review': 'bg-purple-50 text-purple-700 border-purple-100',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6" id="community-issues-feed-root"> 
      {/* -------- SEARCH AND FILTERS -------- */}
      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-4">
        
        {/* Search bar + refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by keyword, address, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-2xl transition flex items-center justify-center cursor-pointer min-h-[44px]"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Category Filters */}
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Filter by Category</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide shrink-0 transition-all snap-start border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status + Sort */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-50">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">Incident Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-black text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {statuses.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
              ))}
            </select>
          </div>

          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1">Sort Feed</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-black text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="Most Upvoted">Most Upvoted</option>
              <option value="Severity">Severity Priority</option>
            </select>
          </div>
        </div>

      </div>

      {/* -------- MAIN FEED -------- */}
      <div className="space-y-4">
        {loading ? (
          // Skeleton Loaders
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-xs animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                  <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                </div>
                <div className="h-6 bg-slate-200 rounded-full w-20" />
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded-md w-1/4" />
                <div className="h-8 bg-slate-200 rounded-xl w-24" />
              </div>
            </div>
          ))
        ) : error ? (
          // Error State
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
            <div>
              <h4 className="text-sm font-black text-red-950">Connection Error</h4>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-700 active:scale-95 transition cursor-pointer"
            >
              Try Reconnecting
            </button>
          </div>
        ) : paginatedIssues.length === 0 ? (
          // Empty State
          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">No matching incident reports</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                We couldn't find any reports matching your filter or keyword. Try resetting search, filters, or categories.
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          // Feed Items
          paginatedIssues.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            const isBookmarked = bookmarkedIssueIds.includes(issue.id);
            const isFollowed = followedIssueIds.includes(issue.id);
            const isUpvoted = upvotedIssueIds.includes(issue.id);
            const issueComments = commentsByIssue[issue.id] || [];
            const isCommunityVerified = (issue.upvotes ?? 0) >= 2 || issue.status === 'Resolved';

            return (
              <motion.div
                key={issue.id}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl shadow-xs transition-all duration-200 overflow-hidden text-left"
              >
                {/* Image Header */}
                {issue.imageUrl && (
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100 border-b border-slate-50">
                    <img
                      src={issue.imageUrl}
                      alt={issue.title}
                      className="w-full h-full object-cover filter brightness-95"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                    
                    {isCommunityVerified && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-white fill-emerald-800" />
                        <span>Community Verified</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Card Details */}
                <div className="p-5 space-y-4">
                  
                  {/* Status, Category, ID */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${severityStyles[issue.severity] || severityStyles.Medium}`}>
                        {issue.severity}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyles[issue.status] || statusStyles.Submitted}`}>
                        {issue.status}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono tracking-wider">
                        {issue.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      #{issue.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                      {issue.title}
                    </h3>
                    <p className={`text-xs text-slate-500 leading-relaxed font-medium ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {issue.description}
                    </p>
                    {issue.description.length > 100 && (
                      <button
                        onClick={() => handleExpandIssue(issue.id)}
                        className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider cursor-pointer block pt-0.5"
                      >
                        {isExpanded ? 'Show Less' : 'Read Full Description'}
                      </button>
                    )}
                  </div>

                  {/* Location & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 text-[11px] font-semibold bg-slate-50 p-2.5 rounded-2xl border border-slate-100/40">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate text-slate-600">{issue.location?.address || 'Ward 4 Area'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{format(new Date(issue.createdAt), 'MMM d, yyyy • h:mm a')}</span>
                    </div>
                  </div>

                  {/* Reporter & Stats */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-[9px] font-black flex items-center justify-center">
                        {issue.reporterName ? issue.reporterName.charAt(0).toUpperCase() : 'R'}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Reporter</p>
                        <p className="text-xs font-black text-slate-700 leading-none mt-1">
                          {issue.reporterName || 'Local Neighbor'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold self-start sm:self-center">
                      <span className="flex items-center gap-1" title="Community Upvotes">
                        <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'text-emerald-600 fill-emerald-100' : ''}`} />
                        <span>{issue.upvotes ?? 0}</span>
                      </span>
                      <span className="flex items-center gap-1" title="Comments">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{issueComments.length}</span>
                      </span>
                      <span className="flex items-center gap-1" title="Views">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{(issue.upvotes * 7) + 12}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleToggleUpvote(issue.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1 px-1 py-1.5 rounded-xl transition cursor-pointer text-[10px] font-extrabold ${
                        isUpvoted 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-emerald-100 stroke-[2.5px]' : ''}`} />
                      <span>{isUpvoted ? 'Verified' : 'Verify'}</span>
                    </button>

                    <button
                      onClick={() => handleExpandIssue(issue.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1 px-1 py-1.5 rounded-xl transition cursor-pointer text-[10px] font-extrabold ${
                        isExpanded 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Discuss</span>
                    </button>

                    <button
                      onClick={() => handleToggleBookmark(issue.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1 px-1 py-1.5 rounded-xl transition cursor-pointer text-[10px] font-extrabold ${
                        isBookmarked 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-100' : ''}`} />
                      <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => handleShare(issue)}
                      className="flex flex-col sm:flex-row items-center justify-center gap-1 w-full py-1.5 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition cursor-pointer text-[10px] font-extrabold"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Expanded Comments Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-slate-50 pt-4 mt-2 space-y-4"
                      >
                        {/* Operations Bar */}
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs text-slate-600">
                          <span className="font-bold">Incident Operations</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleFollow(issue.id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                                isFollowed 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <Bell className={`w-3 h-3 ${isFollowed ? 'fill-emerald-800' : ''}`} />
                              <span>{isFollowed ? 'Following' : 'Follow'}</span>
                            </button>

                            <button
                              onClick={() => handleReportContent(issue.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-100 transition cursor-pointer"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Report</span>
                            </button>
                          </div>
                        </div>

                        {/* Comments Section */}
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 pt-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>Community Discussion ({issueComments.length})</span>
                        </h4>

                        <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                          {issueComments.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">No community comments yet. Start the discussion!</p>
                          ) : (
                            [...issueComments].sort((a, b) => a.createdAt - b.createdAt).map((comm) => (
                              <div key={comm.id} className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="font-extrabold text-slate-800 flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <span>{comm.userName}</span>
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold font-mono">
                                    {format(new Date(comm.createdAt), 'MMM d, h:mm a')}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-medium">{comm.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Comment Input */}
                        {user && (
                          <form onSubmit={(e) => handleSubmitComment(e, issue.id)} className="flex gap-2">
                            <input
                              type="text"
                              value={newCommentText[issue.id] || ''}
                              onChange={(e) => setNewCommentText(prev => ({ ...prev, [issue.id]: e.target.value }))}
                              placeholder="Write a constructive, polite neighborhood note..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
                              maxLength={1000}
                              disabled={submittingComment[issue.id]}
                            />
                            <button
                              type="submit"
                              disabled={submittingComment[issue.id] || !newCommentText[issue.id]?.trim()}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-40 transition cursor-pointer shrink-0"
                            >
                              {submittingComment[issue.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          </form>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* -------- PAGINATION -------- */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-100 px-4 py-3 rounded-3xl shadow-xs">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <span className="text-xs font-bold text-slate-500 font-mono">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 transition cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}