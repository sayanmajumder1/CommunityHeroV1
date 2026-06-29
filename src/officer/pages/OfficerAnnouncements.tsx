import React, { useState, useEffect } from 'react';
import { useStore, getAuthToken } from '../../store';
import { 
  Megaphone, Plus, Loader2, Calendar, Sparkles, 
  Clock, Send, FileText, Layout, Info, Search, RefreshCw, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  desc: string;
  date: string;
  createdAt: number;
}

export default function OfficerAnnouncements() {
  const user = useStore((state) => state.user);
  
  // State variables
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString());
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async (showToast = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authorization token is missing.');
      }
      const res = await fetch('/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve announcements');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort newest first
        const sorted = data.sort((a, b) => b.createdAt - a.createdAt);
        setAnnouncements(sorted);
        if (showToast) {
          toast.success('Broadcasts feed synced with city registry');
        }
      } else {
        throw new Error('Invalid format returned from server');
      }
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError(err.message || 'Unable to sync announcements feed.');
      if (showToast) {
        toast.error('Failed to sync broadcasts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      toast.error('Please fill in both title and description');
      return;
    }

    setIsPublishing(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          desc: desc.trim(),
          date: date || new Date().toLocaleDateString()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to post announcement to server');
      }

      const newAnnouncement = await res.json();
      
      // Update local state (newest first)
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      
      // Clear form
      setTitle('');
      setDesc('');
      setDate(new Date().toLocaleDateString());
      
      toast.success('Broadcasting complete! Circular posted to Citizen Community Feed.');
    } catch (err: any) {
      console.error('Error publishing announcement:', err);
      toast.error(err.message || 'Failed to dispatch announcement.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Filtered announcements
  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ann.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left font-sans" id="officer-announcements-workspace">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm shadow-slate-100/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
              Official Broadcaster
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3 h-3" /> Realtime Sync
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-600" />
            <span>Announcements Console</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Dispatch urgent public circulars, safety bulletins, and official ward declarations directly to the citizen dashboard.
          </p>
        </div>

        <button
          onClick={() => fetchAnnouncements(true)}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Feed</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Broadcasts</p>
            <p className="text-lg font-black text-slate-900">{announcements.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Last Broadcast</p>
            <p className="text-xs font-extrabold text-slate-800">
              {announcements.length > 0 ? announcements[0].date : 'No active circulars'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Scope</p>
            <p className="text-xs font-black text-slate-800">All Registered Citizens</p>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Post Announcement Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between self-start">
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Draft New Circular</h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-slate-400">Bulletin Title</label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Cleanliness Drive: Sector 5 Central Park"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-slate-400">Date Stamp</label>
              <input
                type="text"
                required
                placeholder="e.g. 28/06/2026 or Today"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-slate-400">Full Description / Advisory Details</label>
              <textarea
                required
                rows={5}
                maxLength={1000}
                placeholder="Provide precise details here, including timelines, target streets, alternative routes, or contact coordinates..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/30 resize-none"
              />
            </div>

            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 flex items-start gap-2.5 text-emerald-800 text-[11px] font-medium">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Publishing this announcement immediately notifies citizens on their live feed within the <strong>Announcements</strong> sub-tab of the civic forum.
              </span>
            </div>

            <button
              type="submit"
              disabled={isPublishing || !title.trim() || !desc.trim()}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-wider uppercase transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting Circular...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish & Broadcast</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Active Broadcasts */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-2.5">
            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search active bulletins by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400 bg-transparent"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs text-slate-400 font-bold">Synchronizing bulletins database...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-xs text-red-700 font-black">{error}</p>
                <button
                  onClick={() => fetchAnnouncements(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Retry Fetching
                </button>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-black">
                  {searchTerm ? 'No results matched your search' : 'No active bulletins published'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {searchTerm ? 'Try adjusting your search filters or clear to see all items.' : 'Draft and broadcast your first circular using the left panel to alert residents.'}
                </p>
              </div>
            ) : (
              filteredAnnouncements.map((ann, idx) => (
                <div 
                  key={ann.id || idx} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500/40 hover:shadow-md hover:shadow-slate-100/50 transition-all flex flex-col justify-between space-y-3 text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 h-10 w-10 bg-emerald-50 rounded-bl-full flex items-center justify-center text-emerald-600">
                    <Sparkles className="w-4 h-4 scale-75" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black text-slate-900 leading-snug pr-6 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{ann.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      {ann.desc}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-bold font-mono">
                        Date: {ann.date}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Published
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
