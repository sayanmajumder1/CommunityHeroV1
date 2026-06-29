import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, getAuthToken } from '../../store';
import { 
  Users, MessageSquare, Sparkles, Trophy, Award, Zap, Heart, Send, Check, Trash2, Megaphone, Clock, Plus, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

// ============================================
// TYPES
// ============================================
interface Comment {
  id: string;
  postId: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: number;
  authorId?: string;
}

interface Post {
  id: string;
  author: string;
  role: string;
  avatar: string;
  content: string;
  likes: number;
  commentCount: number;
  createdAt: number;
  hasLiked?: boolean;
  authorId?: string;
}

interface Announcement {
  id: string;
  title: string;
  desc: string;
  date: string;
  createdAt: number;
}

interface LeaderboardUser {
  uid: string;
  displayName: string;
  points: number;
  role: string;
}

export default function CitizenCommunity() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'announcements'>('feed');

  // -------- Sync current user's profile with backend after gaining points --------
  const syncUserProfile = async () => {
    try {
      const token = await getAuthToken();
      if (token && user?.uid) {
        const res = await fetch(`/api/users/${user.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const updatedUser = await res.json();
          setUser(updatedUser, true);
        }
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
    }
  };
  
  // Feed states
  const [posts, setPosts] = useState<Post[]>([]);
  const [postInput, setPostInput] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  
  // Comments states
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  
  // Announcements states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [isPublishingAnn, setIsPublishingAnn] = useState(false);

  // Leaderboard state – always an array
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // General loading/error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref for polling interval
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // -------- Fetch leaderboard (separate function for clarity) --------
  const fetchLeaderboard = useCallback(async (showToast = false) => {
    const token = await getAuthToken();
    if (!token) {
      setLeaderboardUsers([]);
      setLeaderboardError('No auth token');
      return;
    }
    setLoadingLeaderboard(true);
    setLeaderboardError(null);
    try {
      const res = await fetch('/api/users/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaderboardUsers(data);
        if (showToast) toast.success('Leaderboard updated');
        setLeaderboardError(null);
      } else {
        console.warn('Leaderboard API returned non-array:', data);
        setLeaderboardUsers([]);
        setLeaderboardError('Invalid data format');
      }
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setLeaderboardError(err.message || 'Could not load leaderboard');
      setLeaderboardUsers([]);
      if (showToast) toast.error('Failed to refresh leaderboard');
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  // -------- Main fetchTabData (as before) --------
  const fetchTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      if (activeTab === 'feed') {
        const res = await fetch('/api/posts', { headers });
        if (!res.ok) throw new Error('Failed to load posts');
        const data = await res.json();
        setPosts(data);
      } 
      else if (activeTab === 'leaderboard') {
        await fetchLeaderboard(false); // no extra toast
      } 
      else if (activeTab === 'announcements') {
        const res = await fetch('/api/announcements', { headers });
        if (!res.ok) throw new Error('Failed to load announcements');
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while fetching data');
      if (activeTab === 'leaderboard') {
        setLeaderboardUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // -------- Polling for leaderboard updates --------
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only poll if leaderboard tab is active
    if (activeTab === 'leaderboard') {
      // Initial fetch (already done by fetchTabData on tab change, but do it anyway)
      fetchLeaderboard(false);
      // Set up interval every 10 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchLeaderboard(false);
      }, 10000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeTab, fetchLeaderboard]);

  // -------- Load active tab data on tab change --------
  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  // -------- Handlers (unchanged) --------
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postInput.trim()) return;

    setIsSubmittingPost(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: postInput }),
      });

      if (!res.ok) {
        throw new Error('Failed to publish post');
      }

      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setPostInput('');
      toast.success('Your post has been published to the feed! +10 Points, +20 XP');
      syncUserProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    const originalPost = posts[postIndex];
    const originalHasLiked = !!originalPost.hasLiked;
    const nextHasLiked = !originalHasLiked;
    const nextLikesCount = nextHasLiked ? originalPost.likes + 1 : Math.max(0, originalPost.likes - 1);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, hasLiked: nextHasLiked, likes: nextLikesCount }
          : p
      )
    );

    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Could not sync like on server');
      }
      const data = await res.json();
      
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, hasLiked: data.hasLiked, likes: data.likes }
            : p
        )
      );
    } catch (err) {
      console.error('Like toggle failed:', err);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, hasLiked: originalHasLiked, likes: originalPost.likes }
            : p
        )
      );
      toast.error('Failed to update reaction on server. Please try again.');
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);

    if (!commentsByPost[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      try {
        const token = await getAuthToken();
        const res = await fetch(`/api/posts/${postId}/comments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const commentsData = await res.json();
          setCommentsByPost((prev) => ({ ...prev, [postId]: commentsData }));
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
        toast.error('Could not load comments.');
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handlePostComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (!res.ok) throw new Error('Failed to post comment');
      const newComment = await res.json();

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])],
      }));

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      toast.success('Comment posted! +5 Points, +10 XP');
      syncUserProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this community post? This cannot be undone.')) {
      return;
    }

    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete post');

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Community post removed successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete post.');
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annDesc.trim()) return;

    setIsPublishingAnn(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: annTitle.trim(),
          desc: annDesc.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to publish announcement');
      const newAnn = await res.json();

      setAnnouncements((prev) => [newAnn, ...prev]);
      setAnnTitle('');
      setAnnDesc('');
      setShowAnnounceForm(false);
      toast.success('Announcement published successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish announcement');
    } finally {
      setIsPublishingAnn(false);
    }
  };

  // -------- Compute sorted leaderboard data safely --------
  const sortedLeaderboardUsers = Array.isArray(leaderboardUsers) 
    ? leaderboardUsers.map((u, index) => {
        let badge = '🛡️';
        if (index === 0) badge = '🏆';
        else if (index === 1) badge = '🥈';
        else if (index === 2) badge = '🥉';

        let title = 'Civic Ally';
        if (u.points > 1000) title = 'Grand Guardian';
        else if (u.points > 500) title = 'Chief Vigilant';
        else if (u.points > 300) title = 'SLA Pioneer';

        return {
          uid: u.uid,
          rank: index + 1,
          name: u.displayName || 'Anonymous Hero',
          title,
          points: `${u.points || 0} PTS`,
          badge,
          highlight: u.uid === user?.uid,
        };
      })
    : [];

  const isOfficerOrAdmin = user?.role === 'Officer' || user?.role === 'Admin';

  // ============================================
  // RENDER – THEME: White & Emerald
  // ============================================
  return (
    <div className="space-y-6 max-w-lg mx-auto pb-6" id="citizen-community-social-view">
      {/* Dynamic Segmented Control */}
      <div className="flex bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
        {[
          { id: 'feed', label: 'Feed', icon: MessageSquare },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'announcements', label: 'Announcements', icon: Award }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.id
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading && posts.length === 0 && leaderboardUsers.length === 0 && announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-neutral-400 font-semibold">Synchronizing with live community data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-red-600 font-bold mb-3">{error}</p>
          <button 
            onClick={fetchTabData} 
            className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-xl transition"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Quick Create Post */}
              <form onSubmit={handleCreatePost} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
                <input
                  type="text"
                  placeholder="Post a neighborhood update..."
                  value={postInput}
                  onChange={e => setPostInput(e.target.value)}
                  disabled={isSubmittingPost}
                  className="flex-1 bg-neutral-50 text-xs font-semibold rounded-xl p-2.5 px-3.5 border border-neutral-200/80 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition text-neutral-800"
                />
                <button 
                  type="submit" 
                  disabled={isSubmittingPost || !postInput.trim()} 
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-xl transition shrink-0"
                >
                  {isSubmittingPost ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>

              {/* Feed Posts */}
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center text-neutral-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
                    <p className="text-xs font-bold text-neutral-500">The community feed is currently quiet.</p>
                    <p className="text-[11px] text-neutral-400">Be the first to share an update about your neighborhood!</p>
                  </div>
                ) : (
                  posts.map(post => {
                    const relativeTime = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
                    const isAuthor = post.authorId === user?.uid || user?.role === 'Admin';
                    return (
                      <div key={post.id} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-xs text-left space-y-3 transition-all hover:border-neutral-200">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 font-bold text-neutral-700 text-xs flex items-center justify-center shrink-0">
                              {post.avatar || post.author.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                                <span>{post.author}</span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  post.role === 'Officer' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                                }`}>{post.role}</span>
                              </h4>
                              <p className="text-[9px] text-neutral-400 font-semibold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{relativeTime}</span>
                              </p>
                            </div>
                          </div>
                          {isAuthor && (
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="text-neutral-400 hover:text-red-600 p-1 rounded-lg transition"
                              title="Delete Post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                          {post.content}
                        </p>

                        <div className="flex gap-4 border-t border-neutral-50 pt-2.5 text-[11px] font-bold">
                          <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1 transition ${post.hasLiked ? 'text-rose-600' : 'text-neutral-400 hover:text-neutral-700'}`}
                          >
                            <Heart className="w-4 h-4" fill={post.hasLiked ? 'currentColor' : 'none'} />
                            <span>{post.likes} Likes</span>
                          </button>
                          <button 
                            onClick={() => handleToggleComments(post.id)}
                            className={`flex items-center gap-1 transition ${expandedPostId === post.id ? 'text-emerald-600' : 'text-neutral-400 hover:text-neutral-700'}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentCount} Comments</span>
                          </button>
                        </div>

                        {/* Slide-Down Comments Section */}
                        {expandedPostId === post.id && (
                          <div className="border-t border-neutral-100 pt-3 mt-3 space-y-3 bg-neutral-50/50 p-3 rounded-xl">
                            <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Discussion Thread</h5>
                            
                            {/* Comment Input */}
                            <form 
                              onSubmit={(e) => handlePostComment(post.id, e)}
                              className="flex gap-2 items-center"
                            >
                              <input
                                type="text"
                                placeholder="Write a reply..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                disabled={submittingComment[post.id]}
                                className="flex-1 bg-white text-[11px] font-semibold rounded-lg p-2 px-3 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition text-neutral-800"
                              />
                              <button 
                                type="submit"
                                disabled={submittingComment[post.id] || !(commentInputs[post.id] || '').trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition disabled:opacity-50"
                              >
                                {submittingComment[post.id] ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </form>

                            {/* Loading comments */}
                            {loadingComments[post.id] ? (
                              <div className="flex items-center gap-1.5 justify-center py-2 text-[10px] text-neutral-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Loading thread...</span>
                              </div>
                            ) : (
                              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {(commentsByPost[post.id] || []).length === 0 ? (
                                  <p className="text-[10px] text-neutral-400 font-medium text-center py-1">No comments yet. Start the conversation!</p>
                                ) : (
                                  (commentsByPost[post.id] || []).map((comm) => (
                                    <div key={comm.id} className="flex gap-2 text-left bg-white p-2 rounded-lg border border-neutral-100">
                                      <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {comm.avatar || comm.author.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-[10px] font-black text-neutral-800">{comm.author}</span>
                                          <span className="text-[8px] text-neutral-400">{formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed font-medium">
                                          {comm.content}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-xs text-left">
              <div className="p-4 border-b border-neutral-100 bg-gradient-to-tr from-emerald-50 to-neutral-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Ward Honor Roll</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-semibold">Our most active contributors this month</p>
                </div>
                <button
                  onClick={() => fetchLeaderboard(true)}
                  disabled={loadingLeaderboard}
                  className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {loadingLeaderboard && sortedLeaderboardUsers.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : leaderboardError ? (
                  <div className="p-6 text-center text-sm text-red-500">
                    <p>{leaderboardError}</p>
                    <button onClick={() => fetchLeaderboard(true)} className="mt-2 text-emerald-600 underline">Retry</button>
                  </div>
                ) : sortedLeaderboardUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400">No active citizens currently ranked.</div>
                ) : (
                  sortedLeaderboardUsers.map(u => (
                    <div key={u.uid} className={`flex items-center justify-between p-3.5 px-4 transition ${u.highlight ? 'bg-emerald-50/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-neutral-400 w-5 text-center">{u.rank}</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            <span>{u.badge}</span>
                          </h4>
                          <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">{u.title}</p>
                        </div>
                      </div>
                      <div className="text-xs font-black text-neutral-800">{u.points}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-4 text-left">
              {/* Publisher for Officers & Admins */}
              {isOfficerOrAdmin && (
                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
                  {!showAnnounceForm ? (
                    <button
                      onClick={() => setShowAnnounceForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black transition-all hover:bg-emerald-100"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Publish Official Announcement</span>
                    </button>
                  ) : (
                    <form onSubmit={handlePublishAnnouncement} className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                        <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                          <Megaphone className="w-4 h-4 text-emerald-600" />
                          <span>New Ward Announcement</span>
                        </h4>
                        <button 
                          type="button" 
                          onClick={() => setShowAnnounceForm(false)}
                          className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-neutral-400">Announcement Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Scheduled Overhead Line Maintenance"
                          value={annTitle}
                          onChange={(e) => setAnnTitle(e.target.value)}
                          className="w-full bg-neutral-50 text-xs font-semibold rounded-xl p-2.5 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-neutral-400">Details / Directions</label>
                        <textarea
                          required
                          placeholder="Provide descriptive details for ward residents..."
                          rows={3}
                          value={annDesc}
                          onChange={(e) => setAnnDesc(e.target.value)}
                          className="w-full bg-neutral-50 text-xs font-semibold rounded-xl p-2.5 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isPublishingAnn || !annTitle.trim() || !annDesc.trim()}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isPublishingAnn ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <>
                            <Megaphone className="w-3.5 h-3.5" />
                            <span>Publish Announcement</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Announcements List */}
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center text-neutral-400 space-y-2">
                    <Megaphone className="w-8 h-8 mx-auto text-neutral-300" />
                    <p className="text-xs font-bold text-neutral-500">No active announcements</p>
                    <p className="text-[11px] text-neutral-400">Everything is clear in the ward today!</p>
                  </div>
                ) : (
                  announcements.map((ann, idx) => (
                    <div key={ann.id || idx} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-neutral-200">
                      <div className="absolute top-0 right-0 h-10 w-10 bg-emerald-50 rounded-bl-full flex items-center justify-center text-emerald-600">
                        <Sparkles className="w-4 h-4 scale-75" />
                      </div>
                      <h4 className="text-xs font-black text-neutral-900 pr-6">{ann.title}</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed font-medium">{ann.desc}</p>
                      <span className="inline-block text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-bold mt-3 font-mono">
                        {ann.date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}