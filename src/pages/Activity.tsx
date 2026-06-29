import { useState, FormEvent } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { 
  ShieldAlert, ThumbsUp, MessageSquare, Send, MapPin, 
  User, Calendar, ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

function CommentSection({ issueId }: { issueId: string }) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = useStore((state) => state.user);
  const comments = useStore((state) => state.comments[issueId] || []);
  const addComment = useStore((state) => state.addComment);
  const addPointsAndXp = useStore((state) => state.addPointsAndXp);

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      addComment(issueId, user.uid, user.displayName, newComment.trim());
      addPointsAndXp(10, 20); // +10 Points, +20 XP
      setNewComment('');
      toast.success('Comment posted! Earned +10 Points & +20 XP!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 bg-neutral-50 rounded-xl p-4 border border-neutral-200/60 space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
        <MessageSquare className="w-3.5 h-3.5" />
        Community Discussion ({comments.length})
      </h4>

      {comments.length === 0 ? (
        <p className="text-xs text-neutral-400 italic py-2">No comments yet. Start the conversation!</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm bg-white p-3 rounded-lg border border-neutral-200/50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-neutral-900 text-xs flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-400" />
                  {c.userName}
                </span>
                <span className="text-[10px] text-neutral-400 font-semibold">
                  {format(c.createdAt, 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-neutral-700 leading-relaxed text-xs">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a polite comment to help resolve this..."
            className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            maxLength={1000}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 flex items-center justify-center disabled:opacity-50 transition"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const issues = useStore((state) => state.issues);
  const upvotedIssueIds = useStore((state) => state.upvotedIssueIds);
  const toggleUpvote = useStore((state) => state.toggleUpvote);
  const addPointsAndXp = useStore((state) => state.addPointsAndXp);
  const user = useStore((state) => state.user);
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);

  if (!user) return null;

  const handleToggleUpvote = async (issueId: string) => {
    const isUpvoted = upvotedIssueIds.includes(issueId);
    try {
      toggleUpvote(issueId, user.uid);
      if (isUpvoted) {
        toast.success('Verification removed');
      } else {
        addPointsAndXp(5, 10); // +5 Points, +10 XP
        toast.success('Issue verified! Earned +5 Points & +10 XP!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to complete upvote action');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl tracking-tight">
          Civic Discussion & Activity Feed
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Verify local issues posted by neighbors, upvote critical concerns, and collaborate with municipal officers.
        </p>
      </div>

      <div className="space-y-4">
        {issues.length === 0 ? (
          <div className="bg-white p-12 text-center text-sm text-neutral-500 rounded-xl border border-neutral-200 shadow-sm">
            No active civic reports found. Check back later or file a new report!
          </div>
        ) : (
          issues.map((issue) => {
            const hasUpvoted = upvotedIssueIds.includes(issue.id);
            const isDiscussionExpanded = expandedDiscussionId === issue.id;

            return (
              <div 
                key={issue.id} 
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-5 sm:p-6">
                  {/* Header metadata */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {issue.category}
                      </span>
                      <h3 className="text-lg font-bold text-neutral-900 mt-1.5">{issue.title}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      issue.status === 'Resolved' ? 'bg-green-100 text-green-800' : 
                      issue.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>

                  {/* Body description */}
                  <p className="text-neutral-600 text-sm leading-relaxed mb-4">{issue.description}</p>

                  {/* Associated Image */}
                  {issue.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden max-h-80 bg-neutral-100 border border-neutral-200">
                      <img 
                        src={issue.imageUrl} 
                        alt="Issue Evidence" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Geospatial and temporal details */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-neutral-400 border-b border-neutral-100 pb-4 mb-4">
                    <span className="flex items-center gap-1 text-neutral-500">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {issue.location.address || 'Coordinates Provided'}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Reported {format(issue.createdAt, 'MMM d, yyyy')}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      By {issue.reporterName || 'Civic Member'}
                    </span>
                  </div>

                  {/* Operational actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleUpvote(issue.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        hasUpvoted 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-blue-500' : ''}`} />
                      <span>{issue.upvotes} {hasUpvoted ? 'Verified' : 'Verify'}</span>
                    </button>

                    <button
                      onClick={() => setExpandedDiscussionId(isDiscussionExpanded ? null : issue.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Discuss</span>
                      {isDiscussionExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Thread Expansion */}
                  {isDiscussionExpanded && <CommentSection issueId={issue.id} />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
