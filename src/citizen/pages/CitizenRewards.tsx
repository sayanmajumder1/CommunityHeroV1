import React, { useState, useEffect, useCallback } from 'react';
import { useStore, getAuthToken } from '../../store';
import { 
  Award, Trophy, Zap, Sparkles, Clock, Gift, Shield, 
  TrendingUp, Coins, ChevronRight, CheckCircle2, Lock, 
  Ticket, Bus, Trash2, Users, QrCode, ArrowUpRight, Check,
  Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

// ============================================
// TYPES (matching the store and backend)
// ============================================
interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  xp: number;
  category: string;
  icon: typeof Zap;
}

interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: typeof Gift;
  category: 'Transit' | 'Eco' | 'Utility' | 'Event';
}

interface Badge {
  id: string;
  name: string;
  description: string;
  xpRequired: number;
  category: string;
  icon: typeof Award;
}

interface LeaderboardUser {
  uid: string;
  displayName: string;
  points: number;
  role: string;
}

// ============================================
// STATIC DATA (Quests, Rewards, Badges)
// ============================================
const QUESTS: Quest[] = [
  { id: 'quest-1', title: 'First Steps', description: 'Complete registration on CommunityHero platform', points: 50, xp: 100, category: 'Account', icon: Shield },
  { id: 'quest-2', title: 'The Waste Ranger', description: 'Report a waste management or litter issue', points: 100, xp: 200, category: 'Environment', icon: Trash2 },
  { id: 'quest-3', title: 'Streetlight Scout', description: 'Help verify an issue reported by another citizen', points: 40, xp: 80, category: 'Verification', icon: Sparkles },
  { id: 'quest-4', title: 'SLA Champion', description: 'Upvote a critical infrastructure threat', points: 60, xp: 120, category: 'Safety', icon: Trophy },
  { id: 'quest-5', title: 'Civic Dialogue', description: 'Leave 3 constructive comments in discussion threads', points: 50, xp: 100, category: 'Engagement', icon: Users },
];

const REWARDS: RewardItem[] = [
  { id: 'reward-1', name: '1-Month Municipal Bus Pass', description: 'Unlimited rides on all metropolitan transit services for 30 days.', cost: 250, icon: Bus, category: 'Transit' },
  { id: 'reward-2', name: 'Premium Home Compost Bin', description: 'Heavy-duty 10-gallon compost box for organic kitchen wastes.', cost: 120, icon: Trash2, category: 'Eco' },
  { id: 'reward-3', name: 'Water Bill Rebate (10%)', description: 'Get 10% off your next quarterly municipal water and sewage utility bill.', cost: 300, icon: Coins, category: 'Utility' },
  { id: 'reward-4', name: 'VIP Community Gala Ticket', description: 'Priority VIP seating and fast-pass entrance to the annual City Festival.', cost: 180, icon: Ticket, category: 'Event' },
  { id: 'reward-5', name: 'Eco-Friendly Reusable Bottle', description: 'Vacuum-insulated stainless steel flask with laser-engraved Hero seal.', cost: 80, icon: Gift, category: 'Eco' }
];

const BADGES: Badge[] = [
  { id: 'badge-1', name: 'Civic Scout', description: 'Welcome badge awarded to active community participants.', xpRequired: 50, category: 'General', icon: Award },
  { id: 'badge-2', name: 'Eco Warrior', description: 'Awarded for active reporting of waste management and litter violations.', xpRequired: 200, category: 'Environment', icon: Zap },
  { id: 'badge-3', name: 'First Responder', description: 'Unlocked after reporting your first verified neighborhood threat.', xpRequired: 100, category: 'Safety', icon: Shield },
  { id: 'badge-4', name: 'Civic Anchor', description: 'Awarded to users reaching Level 3 for consistent civic activity.', xpRequired: 400, category: 'Influence', icon: Trophy },
  { id: 'badge-5', name: 'Elite Verifier', description: 'Awarded for verifying over 10 distinct community incidents.', xpRequired: 600, category: 'Verification', icon: Sparkles }
];

// ============================================
// COMPONENT
// ============================================
export default function Rewards() {
  const user = useStore((state) => state.user);
  const claimQuest = useStore((state) => state.claimQuest);
  const redeemReward = useStore((state) => state.redeemReward);
  const isFirebaseSession = useStore((state) => state.isFirebaseSession);
  
  // -------- UI state --------
  const [activeTab, setActiveTab] = useState<'overview' | 'quests' | 'shop' | 'badges'>('overview');
  
  // -------- Leaderboard state (dynamic) --------
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // -------- Fetch leaderboard (same as CitizenCommunity) --------
  const fetchLeaderboard = useCallback(async (showToast = false) => {
    if (!isFirebaseSession) {
      setLeaderboardUsers([]);
      return;
    }
    setLoadingLeaderboard(true);
    setLeaderboardError(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
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
  }, [isFirebaseSession]);

  // -------- Fetch on mount and when session changes --------
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // -------- Compute user stats from store --------
  const points = user?.points ?? 0;
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const completedQuestIds = user?.completedQuestIds ?? [];
  const unlockedBadgeIds = user?.unlockedBadgeIds ?? [];
  const redeemedRewards = user?.redeemedRewards ?? [];

  // -------- Level progression --------
  const xpInCurrentLevel = xp % 200;
  const xpNeededForNextLevel = 200 - xpInCurrentLevel;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / 200) * 100));

  // -------- Handlers --------
  const handleClaimQuest = (quest: Quest) => {
    if (completedQuestIds.includes(quest.id)) return;
    claimQuest(quest.id, quest.points, quest.xp);
    toast.success(`Claimed "${quest.title}"! Earned +${quest.points} pts, +${quest.xp} XP!`);
    // Refresh leaderboard after claiming quest (user points may change)
    setTimeout(() => fetchLeaderboard(), 500);
  };

  const handleRedeemReward = async (reward: RewardItem) => {
    if (points < reward.cost) {
      toast.error(`Insufficient points. You need ${reward.cost - points} more points.`);
      return;
    }
    const result = await redeemReward(reward.id, reward.name, reward.cost);
    if (result.success) {
      toast.success(
        <div className="text-left">
          <p className="font-bold text-neutral-900">Reward Redeemed Successfully!</p>
          <p className="text-xs text-neutral-500 mt-0.5">Use Code: <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">{result.code}</span></p>
        </div>,
        { duration: 6000 }
      );
      // Refresh leaderboard (points decreased)
      setTimeout(() => fetchLeaderboard(), 500);
    } else {
      toast.error('Redemption failed');
    }
  };

  // -------- Compute sorted leaderboard for display --------
  const sortedLeaderboard = React.useMemo(() => {
    if (!Array.isArray(leaderboardUsers) || leaderboardUsers.length === 0) return [];
    return leaderboardUsers
      .filter(u => u.role === 'Citizen') // only citizens
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((u, index) => {
        let badge = '🛡️';
        let title = 'Civic Ally';
        if (index === 0) badge = '🏆';
        else if (index === 1) badge = '🥈';
        else if (index === 2) badge = '🥉';
        if (u.points > 1000) title = 'Grand Guardian';
        else if (u.points > 500) title = 'Chief Vigilant';
        else if (u.points > 300) title = 'SLA Pioneer';

        return {
          rank: index + 1,
          name: u.displayName || 'Anonymous Hero',
          title,
          points: `${u.points || 0} PTS`,
          badge,
          isCurrentUser: u.uid === user?.uid,
          uid: u.uid,
        };
      });
  }, [leaderboardUsers, user]);

  // ============================================
  // RENDER – THEME: White & Emerald Green
  // ============================================
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-16 h-16 text-neutral-400 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-neutral-900">Sign in to Access Civic Gamification</h3>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm">
          Join your neighbors and start earning points for improving your community!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner – Emerald Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(16,185,129,0.3),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Trophy className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/25 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Civic Rewards Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Your Community Engagement Profile</h1>
            <p className="text-sm text-neutral-300 max-w-xl">
              Earn points by submitting verified complaints, commenting on reports, and participating in civic campaigns. Redeem them for real-world benefits.
            </p>
          </div>

          <div className="flex gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 self-stretch md:self-auto justify-around">
            <div className="text-center px-4">
              <span className="block text-2xl font-extrabold text-emerald-300">{points}</span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1 justify-center mt-1">
                <Coins className="w-3 h-3" /> Active Points
              </span>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center px-4">
              <span className="block text-2xl font-extrabold text-amber-300">{xp}</span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1 justify-center mt-1">
                <TrendingUp className="w-3 h-3" /> Total XP
              </span>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center px-4">
              <span className="block text-2xl font-extrabold text-emerald-400">Lv.{level}</span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1 justify-center mt-1">
                <Award className="w-3 h-3" /> Citizen Class
              </span>
            </div>
          </div>
        </div>

        {/* Level Progression – Emerald */}
        <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="flex justify-between items-center mb-2 text-xs font-semibold">
            <span className="text-neutral-300">Level {level} Progress</span>
            <span className="text-emerald-300">{xpInCurrentLevel} / 200 XP ({progressPercent}%) • {xpNeededForNextLevel} XP to Level {level + 1}</span>
          </div>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Tabs Menu – Emerald */}
      <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Dashboard', icon: Shield },
          { id: 'quests', label: 'Civic Quests', icon: Zap, count: QUESTS.length - completedQuestIds.length },
          { id: 'shop', label: 'Municipal Rewards Shop', icon: Gift },
          { id: 'badges', label: 'Honor Badges', icon: Award, count: unlockedBadgeIds.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab.id === 'quests' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leaderboard */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-neutral-900 text-md flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        District Honor Roll (Leaderboard)
                      </h3>
                      <p className="text-xs text-neutral-400 font-semibold mt-0.5">Top performing civic guardians in Sector A</p>
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

                  {loadingLeaderboard && sortedLeaderboard.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    </div>
                  ) : leaderboardError ? (
                    <div className="p-6 text-center text-sm text-red-500">
                      <p>{leaderboardError}</p>
                      <button onClick={() => fetchLeaderboard(true)} className="mt-2 text-emerald-600 underline">Retry</button>
                    </div>
                  ) : sortedLeaderboard.length === 0 ? (
                    <div className="p-6 text-center text-sm text-neutral-400">No active citizens ranked yet.</div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {sortedLeaderboard.map((lead) => (
                        <div 
                          key={lead.uid} 
                          className={`flex items-center justify-between p-4 transition-all ${
                            lead.isCurrentUser ? 'bg-emerald-50/50 font-semibold border-l-4 border-l-emerald-600' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`w-6 text-center font-extrabold text-xs ${
                              lead.rank === 1 ? 'text-amber-500 text-sm' : 
                              lead.rank === 2 ? 'text-neutral-400 text-sm' : 
                              lead.rank === 3 ? 'text-amber-700 text-sm' : 'text-neutral-400'
                            }`}>
                              #{lead.rank}
                            </span>
                            <div className={`w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm`}>
                              {lead.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                                {lead.name}
                                {lead.isCurrentUser && <span className="bg-emerald-600 text-white text-[9px] px-1 rounded uppercase tracking-wider font-extrabold">You</span>}
                              </div>
                              <span className="text-[10px] text-neutral-400 uppercase tracking-wide font-extrabold">{lead.title}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-neutral-900">{lead.points}</span>
                            <span className="text-[10px] text-neutral-400 font-bold">PTS</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Info Box – Emerald */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-xl p-6 border border-emerald-200 flex flex-col sm:flex-row gap-5 items-center">
                  <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-md shadow-emerald-500/10">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-sm">How does the community rewards system work?</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                      Every verified issue you report gets analyzed and routed. When action is dispatched, you receive +50 active points. Helping confirm an existing problem grants +5 active points. These points are real credits redeemable for actual municipal passes, water credits, and event entries!
                    </p>
                  </div>
                </div>
              </div>

              {/* Badges and Recent Redeemed Rewards */}
              <div className="space-y-6">
                {/* Badges Box – Emerald */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                    <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Unlocked Badges</h4>
                    <button onClick={() => setActiveTab('badges')} className="text-[11px] font-bold text-emerald-600 hover:underline">View All</button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {BADGES.map((b) => {
                      const isUnlocked = unlockedBadgeIds.includes(b.id);
                      return (
                        <div key={b.id} className="text-center group relative cursor-pointer">
                          <div className={`mx-auto w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                            isUnlocked 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm shadow-emerald-500/5' 
                              : 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-40'
                          }`}>
                            <b.icon className="w-5 h-5" />
                          </div>
                          <span className="block text-[10px] text-neutral-600 truncate font-bold mt-1.5">{b.name}</span>
                          
                          {/* Hover Tooltip */}
                          <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-neutral-950 text-white p-2 rounded-lg text-[10px] leading-snug w-36 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity font-semibold shadow-lg">
                            <span className="block font-bold border-b border-white/10 pb-1 mb-1">{b.name}</span>
                            <span>{b.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coupons Box – Emerald accents */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-4">
                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider pb-2 border-b border-neutral-100">Your Redeemed Coupons</h4>
                  {redeemedRewards.length === 0 ? (
                    <div className="text-center py-6">
                      <Lock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-[11px] text-neutral-400 italic">No rewards redeemed yet. Collect points and visit the store tab!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {redeemedRewards.map((item) => (
                        <div key={item.id} className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-neutral-900">{item.rewardName}</p>
                            <p className="text-[9px] text-neutral-400 mt-0.5">Used {item.pointsUsed} Points</p>
                          </div>
                          <div className="text-right">
                            <span className="block font-mono text-[10px] font-extrabold text-emerald-600 bg-white border border-emerald-200 px-1.5 py-0.5 rounded shadow-sm select-all">
                              {item.code}
                            </span>
                            <span className="text-[8px] text-neutral-400 font-bold block mt-0.5 uppercase">Scan Code</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== QUESTS TAB ==================== */}
          {activeTab === 'quests' && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-200">
                <h3 className="font-bold text-neutral-900 text-md flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Available Civic Engagement Quests
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Complete community targets to unlock instant points and level upgrades.</p>
              </div>

              <div className="divide-y divide-neutral-200">
                {QUESTS.map((q) => {
                  const isCompleted = completedQuestIds.includes(q.id);
                  return (
                    <div key={q.id} className="p-6 hover:bg-neutral-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl border flex-shrink-0 ${
                          isCompleted 
                            ? 'bg-neutral-100 border-neutral-200 text-neutral-400' 
                            : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}>
                          <q.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${isCompleted ? 'text-neutral-500 line-through' : 'text-neutral-900'}`}>
                              {q.title}
                            </h4>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                              {q.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1 max-w-xl">{q.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded flex items-center gap-0.5">
                              <Coins className="w-3 h-3" /> +{q.points} Points
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" /> +{q.xp} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isCompleted ? (
                          <button
                            disabled
                            className="bg-neutral-100 text-neutral-400 border border-neutral-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4 text-neutral-400" /> Completed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClaimQuest(q)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-transparent px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            Complete Target <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== SHOP TAB ==================== */}
          {activeTab === 'shop' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-neutral-900 text-md flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    Municipal Benefits Redemption Shop
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Spend your earned CommunityHero points to redeem transit cards, water bills, or eco gifts.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider leading-none">Your Balance</span>
                    <span className="text-lg font-black text-emerald-700">{points} <span className="text-xs font-bold">PTS</span></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {REWARDS.map((rew) => {
                  const canAfford = points >= rew.cost;
                  return (
                    <div 
                      key={rew.id} 
                      className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-200 hover:shadow-md transition duration-200"
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3">
                            <rew.icon className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {rew.category}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm leading-tight">{rew.name}</h4>
                          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{rew.description}</p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 border-t border-neutral-100 mt-auto bg-neutral-50/50 flex items-center justify-between gap-2">
                        <div className="text-left">
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-neutral-400">Cost to Claim</span>
                          <span className="text-md font-extrabold text-neutral-900 flex items-center gap-1">
                            <Coins className="w-4 h-4 text-amber-500" />
                            {rew.cost} <span className="text-xs font-semibold text-neutral-500">pts</span>
                          </span>
                        </div>

                        <button
                          onClick={() => handleRedeemReward(rew)}
                          disabled={!canAfford}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            canAfford 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm shadow-emerald-500/10' 
                              : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                          }`}
                        >
                          Redeem Voucher <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== BADGES TAB ==================== */}
          {activeTab === 'badges' && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-6 space-y-6">
              <div>
                <h3 className="font-bold text-neutral-900 text-md flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Your Citizen Badges Gallery
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Collect points to level up and unlock historic badges showcasing your neighborhood impact.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {BADGES.map((b) => {
                  const isUnlocked = unlockedBadgeIds.includes(b.id);
                  return (
                    <div 
                      key={b.id} 
                      className={`p-5 rounded-xl border transition-all flex items-start gap-4 ${
                        isUnlocked 
                          ? 'bg-gradient-to-br from-emerald-50/20 to-emerald-100/20 border-emerald-200 text-neutral-900 shadow-sm' 
                          : 'bg-neutral-50/50 border-neutral-200/80 text-neutral-400 opacity-60'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl border flex-shrink-0 ${
                        isUnlocked 
                          ? 'bg-emerald-600 text-white border-transparent shadow-md' 
                          : 'bg-neutral-100 border-neutral-200 text-neutral-400'
                      }`}>
                        <b.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-neutral-900 leading-snug">{b.name}</h4>
                          {isUnlocked ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">Unlocked</span>
                          ) : (
                            <span className="bg-neutral-100 text-neutral-500 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                              <Lock className="w-2 h-2" /> Locked
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-snug">{b.description}</p>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 block mt-2">Required XP: {b.xpRequired}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}