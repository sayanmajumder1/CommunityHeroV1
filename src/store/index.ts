// ============================================
// store/index.ts - COMPLETE STORE WITH SYNC & FETCH USERS
// ============================================
// 
// PURPOSE: This is the SINGLE SOURCE OF TRUTH for all application state.
// It uses Zustand for state management and localStorage for persistence.
// 
// KEY FEATURES:
// - User authentication state (login, logout, guest)
// - Issue management (CRUD operations)
// - Sync between local and backend data
// - Gamification (points, XP, levels)
// - Notifications
// - Comments and audit logs
// - fetchUsers for Admin user management
// 
// WHY THIS EXISTS: Centralized state prevents "prop drilling" and ensures
// all components share the same data. The sync function solves the
// "Issue not found" error by pushing local issues to the backend.
// ============================================

import { create } from 'zustand';
import { Issue, IssueCategory, IssueSeverity, IssueStatus } from '../types';

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'Citizen' | 'Officer' | 'Admin' | 'Guest';
  createdAt: number;
  points?: number;
  xp?: number;
  level?: number;
  unlockedBadgeIds?: string[];
  redeemedRewards?: { id: string; rewardName: string; code: string; date: number; pointsUsed: number }[];
  completedQuestIds?: string[];
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  departmentId?: string;
  isVerified?: boolean;
  status?: string;
  profilePhoto?: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  issueId: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  text: string;
  unread: boolean;
  createdAt: number;
}
export interface Department {
  id: string;
  name: string;
  head: string;
  createdAt: number;
  updatedAt: number;
  lastAudit?: number;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  USER: 'community_hero_user',
  ISSUES: 'community_hero_issues',
  UPVOTES: 'community_hero_upvotes',
  COMMENTS: 'community_hero_comments',
  AUDIT_LOGS: 'community_hero_auditLogs',
  NOTIFICATIONS: 'community_hero_notifications',
  USERS: 'community_hero_registered_users',
  SESSION_ID: 'community_hero_session_id',
  SPLASH_SHOWN: 'splashShown',
  SPLASH_TIMESTAMP: 'splashTimestamp',
  DEPARTMENTS: 'community_hero_departments',
} as const;

// ============================================
// PERSISTENCE HELPERS
// ============================================

const loadState = <T>(key: string, defaultValue: T): T => {
  try {
    const val = localStorage.getItem(key);
    if (!val) return defaultValue;
    const parsed = JSON.parse(val);
    if (typeof parsed !== 'object' || parsed === null) return defaultValue;
    return parsed;
  } catch (e) {
    console.warn(`Failed to load state for key ${key}, using default`);
    return defaultValue;
  }
};

const cleanGiantBase64 = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('data:') && obj.length > 20000) {
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanGiantBase64);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanGiantBase64(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

const saveState = <T>(key: string, value: T) => {
  try {
    const cleaned = cleanGiantBase64(value);
    localStorage.setItem(key, JSON.stringify(cleaned));
  } catch (e: any) {
    console.error('Error saving state to localStorage', e);
    if (key === STORAGE_KEYS.ISSUES && Array.isArray(value)) {
      try {
        const pruned = value.slice(-10);
        const cleanedPruned = cleanGiantBase64(pruned);
        localStorage.setItem(key, JSON.stringify(cleanedPruned));
        console.log('Pruned issues to fit localStorage quota.');
      } catch (innerError) {
        try {
          localStorage.removeItem(key);
        } catch (_) {}
      }
    }
  }
};

// ============================================
// AUTH TOKEN GENERATOR
// ============================================

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    const userObj = JSON.parse(userStr);
    if (!userObj || !userObj.uid) return null;
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID) || Date.now().toString();
    return `local_bypass_${userObj.uid}:${sessionId}:${userObj.email || ''}`;
  } catch (e) {
    console.error('Failed to get auth token:', e);
    return null;
  }
};

// ============================================
// SEED DATA
// ============================================

const getSeedIssues = (): Issue[] => {
  return [
    {
      id: 'seed-1',
      title: 'Pothole on Main Street',
      description: 'Large pothole near the intersection causing traffic issues',
      category: 'Pothole' as IssueCategory,
      severity: 'High' as IssueSeverity,
      status: 'Submitted' as IssueStatus,
      location: { lat: 19.0760, lng: 72.8777, address: 'Main Street, Mumbai' },
      reporterName: 'Kiran Kumar',
      reporterId: 'user-seed-1',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      upvotes: 5,
      imageUrl: '',
      departmentId: 'dept-1',
    },
    {
      id: 'seed-2',
      title: 'Water Leakage in Sector 4',
      description: 'Pipeline burst causing water logging',
      category: 'Water Leakage' as IssueCategory,
      severity: 'Critical' as IssueSeverity,
      status: 'In Progress' as IssueStatus,
      location: { lat: 19.0860, lng: 72.8877, address: 'Sector 4, Mumbai' },
      reporterName: "Sarah D'Souza",
      reporterId: 'user-seed-2',
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 3600000,
      upvotes: 12,
      imageUrl: '',
      departmentId: 'dept-1',
    },
    {
      id: 'seed-3',
      title: 'Broken Street Light on Avenue Road',
      description: 'Street light not working for 3 weeks, area is dark at night.',
      category: 'Damaged Light' as IssueCategory,
      severity: 'Medium' as IssueSeverity,
      status: 'Under Review' as IssueStatus,
      location: { lat: 19.0960, lng: 72.8977, address: 'Avenue Road, Mumbai' },
      reporterName: 'Anish Shah',
      reporterId: 'user-seed-3',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 43200000,
      upvotes: 3,
      imageUrl: '',
      departmentId: 'dept-1',
    },
  ];
};

// ============================================
// INITIAL STATE LOADING
// ============================================

const initialUser = loadState<UserProfile | null>(STORAGE_KEYS.USER, null);
const initialIssues = loadState<Issue[]>(STORAGE_KEYS.ISSUES, getSeedIssues());
const initialUpvotes = loadState<string[]>(STORAGE_KEYS.UPVOTES, []);
const initialComments = loadState<Record<string, Comment[]>>(STORAGE_KEYS.COMMENTS, {});
const initialAuditLogs = loadState<Record<string, AuditLog[]>>(STORAGE_KEYS.AUDIT_LOGS, {});
const initialNotifications = loadState<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
const initialDepartments = loadState<Department[]>(STORAGE_KEYS.DEPARTMENTS, []);
const initialUsers = loadState<UserProfile[]>(STORAGE_KEYS.USERS, [
  { uid: 'user-seed-1', displayName: 'Kiran Kumar', email: 'kiran@communityhero.org', role: 'Citizen', createdAt: Date.now() - 30 * 86400000, points: 350, level: 3 },
  { uid: 'user-seed-2', displayName: "Sarah D'Souza", email: 'sarah@communityhero.org', role: 'Citizen', createdAt: Date.now() - 15 * 86400000, points: 640, level: 4 },
  { uid: 'user-seed-3', displayName: 'Anish Shah', email: 'anish@communityhero.org', role: 'Citizen', createdAt: Date.now() - 25 * 86400000, points: 210, level: 2 },
  { uid: 'user-seed-4', displayName: 'Municipal Officer Dev', email: 'officer@communityhero.org', role: 'Officer', createdAt: Date.now() - 60 * 86400000, departmentId: 'dept-1' },
  { uid: 'admin-super-1', displayName: 'Administrator Chief', email: 'admin@communityhero.org', role: 'Admin', createdAt: Date.now() - 90 * 86400000 }
]);

// ============================================
// APP STATE INTERFACE
// ============================================

export interface AppState {
  // -------- AUTH STATE --------
  user: UserProfile | null;
  setUser: (user: UserProfile | null, isFirebaseSession?: boolean) => void;
  guestLogin: () => void;
  logout: () => void;
  hardLogout: () => void;
  isFirebaseSession: boolean;
  setIsFirebaseSession: (val: boolean) => void;
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;
  
  // -------- ISSUE DATA --------
  issues: Issue[];
  setIssues: (issues: Issue[]) => void;
  addIssue: (issue: Issue) => Promise<void>;
  updateIssueStatus: (issueId: string, newStatus: IssueStatus, actorName: string, actorId: string) => Promise<void>;
  assignIssue: (issueId: string, departmentId: string, officerId?: string, officerName?: string, actorId?: string, actorName?: string) => Promise<void>;
  deleteIssue: (issueId: string) => Promise<void>;
  
  // -------- ENGAGEMENT --------
  upvotedIssueIds: string[];
  setUpvotedIssueIds: (ids: string[]) => void;
  toggleUpvote: (issueId: string, userId: string) => Promise<void>;
  
  // -------- COMMENTS & AUDIT --------
  comments: Record<string, Comment[]>;
  setComments: (comments: Record<string, Comment[]>) => void;
  addComment: (issueId: string, userId: string, userName: string, text: string) => Promise<void>;
  auditLogs: Record<string, AuditLog[]>;
  setAuditLogs: (logs: Record<string, AuditLog[]>) => void;
  addAuditLog: (issueId: string, actorId: string, actorName: string, action: string, details: string) => Promise<void>;
  
  // -------- NOTIFICATIONS --------
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // -------- USER MANAGEMENT --------
  users: UserProfile[];
  setUsers: (users: UserProfile[]) => void;
  updateUserRole: (uid: string, newRole: 'Citizen' | 'Officer' | 'Admin', departmentId?: string) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  updateProfile: (updatedForm: Partial<UserProfile>) => Promise<void>;
  
  // -------- GAMIFICATION --------
  addPointsAndXp: (points: number, xp: number) => Promise<void>;
  claimQuest: (questId: string, rewardPoints: number, rewardXp: number) => Promise<void>;
  redeemReward: (rewardId: string, rewardName: string, pointsCost: number) => Promise<{ success: boolean; code?: string }>;
  
  // -------- SYNC (THE CRITICAL FIX) --------
  syncLocalIssuesToBackend: () => Promise<{ syncedCount: number; errorCount: number }>;
  
  // -------- DATA FETCHING --------
  fetchIssues: () => Promise<void>;
  fetchUsers: () => Promise<void>; // ✅ ADDED – Admin user list
  refreshAllData: () => Promise<void>;
  forceReload: () => Promise<void>;
  
   // 🔥 ADD: Departments management
  departments: Department[];
  setDepartments: (depts: Department[]) => void;
  fetchDepartments: () => Promise<void>;
  triggerDepartmentAudit: (deptId: string) => Promise<void>;
  sendDepartmentWarning: (deptId: string) => Promise<void>;

  // -------- INTERNAL --------
  _pendingRequests: Map<string, Promise<any>>;
}

// ============================================
// THE STORE
// ============================================

export const useStore = create<AppState>((set, get) => ({
  // ==========================================
  // AUTH STATE
  // ==========================================
  
  user: initialUser ? {
    points: initialUser.points ?? 350,
    xp: initialUser.xp ?? 480,
    level: initialUser.level ?? 3,
    unlockedBadgeIds: initialUser.unlockedBadgeIds ?? ['badge-1', 'badge-3'],
    redeemedRewards: initialUser.redeemedRewards ?? [],
    completedQuestIds: initialUser.completedQuestIds ?? ['quest-1'],
    ...initialUser
  } : null,
  
  isFirebaseSession: (initialUser && initialUser.role !== 'Guest') ? true : false,
  isInitialized: false,
  
  setIsInitialized: (val) => set({ isInitialized: val }),
  
  setUser: (user, isFirebaseSession = false) => {
    const augmentedUser = user ? {
      points: user.points ?? 350,
      xp: user.xp ?? 480,
      level: user.level ?? 3,
      unlockedBadgeIds: user.unlockedBadgeIds ?? ['badge-1', 'badge-3'],
      redeemedRewards: user.redeemedRewards ?? [],
      completedQuestIds: user.completedQuestIds ?? ['quest-1'],
      ...user
    } : null;
    
    if (augmentedUser) {
      saveState(STORAGE_KEYS.USER, augmentedUser);
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      saveState(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    
    set({ 
      user: augmentedUser,
      isFirebaseSession: augmentedUser ? isFirebaseSession : false
    });
    
    if (augmentedUser && isFirebaseSession) {
      setTimeout(() => {
        get().refreshAllData().catch(console.error);
      }, 100);
    }
  },
  
  guestLogin: () => {
    const guestUser: UserProfile = {
      uid: `guest-${Math.random().toString(36).substring(2, 10)}`,
      email: `guest_${Date.now()}@communityhero.org`,
      displayName: 'Guest User',
      role: 'Guest',
      createdAt: Date.now(),
      points: 0,
      xp: 0,
      level: 1,
      unlockedBadgeIds: [],
      redeemedRewards: [],
      completedQuestIds: []
    };
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    } catch (_) {}
    set({ user: guestUser, isFirebaseSession: false });
    saveState(STORAGE_KEYS.USER, guestUser);
  },
  
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      localStorage.removeItem(STORAGE_KEYS.SPLASH_SHOWN);
      localStorage.removeItem(STORAGE_KEYS.SPLASH_TIMESTAMP);
    } catch (_) {}
    set({ user: null, isFirebaseSession: false });
    const currentIssues = get().issues;
    if (currentIssues.length > 0) {
      saveState(STORAGE_KEYS.ISSUES, currentIssues);
    }
  },
  
  hardLogout: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      try { localStorage.removeItem(key); } catch (_) {}
    });
    set({
      user: null,
      isFirebaseSession: false,
      issues: [],
      upvotedIssueIds: [],
      comments: {},
      auditLogs: {},
      notifications: [],
      users: [],
      _pendingRequests: new Map(),
    });
    sessionStorage.clear();
  },
  
  setIsFirebaseSession: (val) => set({ isFirebaseSession: val }),
  
  // -------- INTERNAL: Request deduplication --------
  _pendingRequests: new Map<string, Promise<any>>(),
  
  // ==========================================
  // ISSUE MANAGEMENT
  // ==========================================
  
  issues: initialIssues,
  
  setIssues: (issues) => {
    const normalized = issues.map((issue: any) => ({
      ...issue,
      location: issue.location && typeof issue.location === 'object' ? issue.location : {
        lat: Number(issue.lat ?? 0),
        lng: Number(issue.lng ?? 0),
        address: issue.address || ''
      }
    }));
    set({ issues: normalized });
    saveState(STORAGE_KEYS.ISSUES, normalized);
  },
  
  addIssue: async (issue) => {
    const updatedIssues = [issue, ...get().issues];
    set({ issues: updatedIssues });
    saveState(STORAGE_KEYS.ISSUES, updatedIssues);
    
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token available');
        const res = await fetch('/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(issue)
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`API Error (${res.status}): ${errorText}`);
        }
        await get().fetchIssues();
      } catch (error) {
        console.error('Error creating issue via API:', error);
        const rollbackIssues = get().issues.filter((i) => i.id !== issue.id);
        set({ issues: rollbackIssues });
        saveState(STORAGE_KEYS.ISSUES, rollbackIssues);
        throw error;
      }
    }
  },
  
  deleteIssue: async (issueId) => {
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch(`/api/issues/${issueId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        await get().fetchIssues();
      } catch (error) {
        console.error('Error deleting issue via API:', error);
        throw error;
      }
    } else {
      const updatedIssues = get().issues.filter((i) => i.id !== issueId);
      set({ issues: updatedIssues });
      saveState(STORAGE_KEYS.ISSUES, updatedIssues);
    }
  },
  
  updateIssueStatus: async (issueId, newStatus, actorName, actorId) => {
    console.log(`📤 updateIssueStatus called with: ${issueId} -> ${newStatus}`);
    const timestamp = Date.now();
    const logId = Math.random().toString(36).substring(2, 10);
    const prevIssues = get().issues;
    const prevAuditLogs = get().auditLogs;
    
    const issueToUpdate = prevIssues.find(i => i.id === issueId);
    if (!issueToUpdate) {
      console.error(`❌ Issue ${issueId} not found in store!`);
      throw new Error(`Issue ${issueId} not found in local store`);
    }
    console.log(`✅ Found issue in store: ${issueToUpdate.title}`);
    
    const updatedIssues = prevIssues.map((issue) => {
      if (issue.id === issueId) {
        return { ...issue, status: newStatus, updatedAt: timestamp };
      }
      return issue;
    });
    
    const newLog: AuditLog = {
      id: logId,
      issueId,
      actorId,
      actorName,
      action: `Status changed to ${newStatus}`,
      details: 'Updated via Platform Dashboard',
      createdAt: timestamp
    };
    const issueLogs = prevAuditLogs[issueId] || [];
    const updatedLogs = {
      ...prevAuditLogs,
      [issueId]: [...issueLogs, newLog]
    };
    
    set({ issues: updatedIssues, auditLogs: updatedLogs });
    saveState(STORAGE_KEYS.ISSUES, updatedIssues);
    saveState(STORAGE_KEYS.AUDIT_LOGS, updatedLogs);
    
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        console.log(`📡 Sending PUT request to /api/issues/${issueId}/status`);
        const res = await fetch(`/api/issues/${issueId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`❌ API Error: ${res.status} - ${errorText}`);
          throw new Error(errorText || `API Error: ${res.status}`);
        }
        console.log(`✅ Status update successful on backend`);
        await get().fetchIssues();
      } catch (error) {
        console.error('Error updating status via API:', error);
        set({ issues: prevIssues, auditLogs: prevAuditLogs });
        saveState(STORAGE_KEYS.ISSUES, prevIssues);
        saveState(STORAGE_KEYS.AUDIT_LOGS, prevAuditLogs);
        throw error;
      }
    }
  },
  
  assignIssue: async (issueId, departmentId, officerId, officerName, actorId, actorName) => {
    const timestamp = Date.now();
    const logId = Math.random().toString(36).substring(2, 10);
    const prevIssues = get().issues;
    const prevAuditLogs = get().auditLogs;
    
    const updatedIssues = prevIssues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          departmentId,
          assignedOfficerId: officerId,
          assignedOfficerName: officerName,
          updatedAt: timestamp
        };
      }
      return issue;
    });
    
    const newLog: AuditLog = {
      id: logId,
      issueId,
      actorId: actorId || 'system',
      actorName: actorName || 'System',
      action: 'Issue Reassigned',
      details: `Reassigned to department ${departmentId}${officerName ? ` and officer ${officerName}` : ''}`,
      createdAt: timestamp
    };
    const issueLogs = prevAuditLogs[issueId] || [];
    const updatedLogs = {
      ...prevAuditLogs,
      [issueId]: [...issueLogs, newLog]
    };
    
    set({ issues: updatedIssues, auditLogs: updatedLogs });
    saveState(STORAGE_KEYS.ISSUES, updatedIssues);
    saveState(STORAGE_KEYS.AUDIT_LOGS, updatedLogs);
    
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch(`/api/issues/${issueId}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ departmentId, officerId, officerName, actorId, actorName })
        });
        if (!res.ok) throw new Error(await res.text());
        await get().fetchIssues();
      } catch (error) {
        console.error('Error assigning issue via API:', error);
        set({ issues: prevIssues, auditLogs: prevAuditLogs });
        saveState(STORAGE_KEYS.ISSUES, prevIssues);
        saveState(STORAGE_KEYS.AUDIT_LOGS, prevAuditLogs);
        throw error;
      }
    }
  },
  
  // ==========================================
  // UPVOTES
  // ==========================================
  
  upvotedIssueIds: initialUpvotes,
  setUpvotedIssueIds: (upvotedIssueIds) => {
    set({ upvotedIssueIds });
    saveState(STORAGE_KEYS.UPVOTES, upvotedIssueIds);
  },
  
  toggleUpvote: async (issueId, userId) => {
    const upvotes = get().upvotedIssueIds;
    const isUpvoted = upvotes.includes(issueId);
    const prevUpvotes = get().upvotedIssueIds;
    const prevIssues = get().issues;
    
    let nextUpvotes: string[];
    if (isUpvoted) {
      nextUpvotes = upvotes.filter((id) => id !== issueId);
    } else {
      nextUpvotes = [...upvotes, issueId];
    }
    
    const updatedIssues = prevIssues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          upvotes: issue.upvotes + (isUpvoted ? -1 : 1),
          updatedAt: Date.now()
        };
      }
      return issue;
    });
    
    set({ upvotedIssueIds: nextUpvotes, issues: updatedIssues });
    saveState(STORAGE_KEYS.UPVOTES, nextUpvotes);
    saveState(STORAGE_KEYS.ISSUES, updatedIssues);
    
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch(`/api/issues/${issueId}/upvote`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        await get().fetchIssues();
      } catch (error) {
        console.error('Error toggling upvote via API:', error);
        set({ upvotedIssueIds: prevUpvotes, issues: prevIssues });
        saveState(STORAGE_KEYS.UPVOTES, prevUpvotes);
        saveState(STORAGE_KEYS.ISSUES, prevIssues);
        throw error;
      }
    }
  },
  
  // ==========================================
  // COMMENTS
  // ==========================================
  
  comments: initialComments,
  setComments: (comments) => {
    set({ comments });
    saveState(STORAGE_KEYS.COMMENTS, comments);
  },
  
  addComment: async (issueId, userId, userName, text) => {
    const commentId = Math.random().toString(36).substring(2, 10);
    const prevComments = get().comments;
    const newComment: Comment = {
      id: commentId,
      issueId,
      userId,
      userName,
      text,
      createdAt: Date.now()
    };
    const issueComments = prevComments[issueId] || [];
    const updatedComments = {
      ...prevComments,
      [issueId]: [...issueComments, newComment]
    };
    set({ comments: updatedComments });
    saveState(STORAGE_KEYS.COMMENTS, updatedComments);
    
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch(`/api/issues/${issueId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error(await res.text());
        await get().fetchIssues();
      } catch (error) {
        console.error('Error adding comment via API:', error);
        set({ comments: prevComments });
        saveState(STORAGE_KEYS.COMMENTS, prevComments);
        throw error;
      }
    }
  },
  
  // ==========================================
  // AUDIT LOGS
  // ==========================================
  
  auditLogs: initialAuditLogs,
  setAuditLogs: (auditLogs) => {
    set({ auditLogs });
    saveState(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  },
  
  addAuditLog: async (issueId, actorId, actorName, action, details) => {
    if (!get().isFirebaseSession) {
      const logId = Math.random().toString(36).substring(2, 10);
      const newLog: AuditLog = {
        id: logId,
        issueId,
        actorId,
        actorName,
        action,
        details,
        createdAt: Date.now()
      };
      const currentLogs = get().auditLogs;
      const issueLogs = currentLogs[issueId] || [];
      const updatedLogs = {
        ...currentLogs,
        [issueId]: [...issueLogs, newLog]
      };
      set({ auditLogs: updatedLogs });
      saveState(STORAGE_KEYS.AUDIT_LOGS, updatedLogs);
    }
  },
  
  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  
  notifications: initialNotifications,
  setNotifications: (notifications) => {
    set({ notifications });
    saveState(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
  
  fetchNotifications: async () => {
    if (!get().isFirebaseSession) return;
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ notifications: data });
        saveState(STORAGE_KEYS.NOTIFICATIONS, data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  },
  
  markNotificationRead: async (id) => {
    if (!get().isFirebaseSession) return;
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        const nextNotifications = get().notifications.map(n => n.id === id ? updated : n);
        set({ notifications: nextNotifications });
        saveState(STORAGE_KEYS.NOTIFICATIONS, nextNotifications);
      }
    } catch (e) {
      console.error('Error marking notification read:', e);
    }
  },
  
  deleteNotification: async (id) => {
    if (!get().isFirebaseSession) return;
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const nextNotifications = get().notifications.filter(n => n.id !== id);
        set({ notifications: nextNotifications });
        saveState(STORAGE_KEYS.NOTIFICATIONS, nextNotifications);
      }
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  },
  
  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  
  users: initialUsers,
  setUsers: (users) => {
    set({ users });
    saveState(STORAGE_KEYS.USERS, users);
  },
  
  updateUserRole: async (uid, newRole, departmentId) => {
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch(`/api/users/${uid}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: newRole, departmentId })
        });
        if (!res.ok) throw new Error(await res.text());
        const currentUser = get().user;
        if (currentUser && currentUser.role === 'Admin') {
          const usersRes = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            set({ users: usersData });
            saveState(STORAGE_KEYS.USERS, usersData);
          }
        }
      } catch (error) {
        console.error('Error updating user role via API:', error);
        throw error;
      }
    } else {
      const updatedUsers = get().users.map((u) => {
        if (u.uid === uid) {
          const updated: UserProfile = { ...u, role: newRole };
          if (departmentId !== undefined) {
            updated.departmentId = departmentId;
          } else if (newRole !== 'Officer') {
            delete updated.departmentId;
          }
          return updated;
        }
        return u;
      });
      set({ users: updatedUsers });
      saveState(STORAGE_KEYS.USERS, updatedUsers);
      
      const currentUser = get().user;
      if (currentUser && currentUser.uid === uid) {
        const updatedCurrent = { ...currentUser, role: newRole };
        if (departmentId !== undefined) {
          updatedCurrent.departmentId = departmentId;
        } else if (newRole !== 'Officer') {
          delete updatedCurrent.departmentId;
        }
        set({ user: updatedCurrent });
        saveState(STORAGE_KEYS.USER, updatedCurrent);
      }
    }
  },
  
  deleteUser: async (uid) => {
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch(`/api/users/${uid}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        const currentUser = get().user;
        if (currentUser && currentUser.role === 'Admin') {
          const usersRes = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            set({ users: usersData });
            saveState(STORAGE_KEYS.USERS, usersData);
          }
        }
      } catch (error) {
        console.error('Error deleting user via API:', error);
        throw error;
      }
    } else {
      const updatedUsers = get().users.filter(u => u.uid !== uid);
      set({ users: updatedUsers });
      saveState(STORAGE_KEYS.USERS, updatedUsers);
    }
  },
  
  updateProfile: async (updatedForm) => {
    const currentUser = get().user;
    if (!currentUser) throw new Error('No user logged in');
    const updatedUser: UserProfile = {
      ...currentUser,
      ...updatedForm
    };
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedUser)
        });
        if (!res.ok) throw new Error(await res.text());
        const profileFromServer = await res.json();
        set({ user: profileFromServer });
        saveState(STORAGE_KEYS.USER, profileFromServer);
      } catch (error) {
        console.error('Error saving user profile via API:', error);
        throw error;
      }
    } else {
      set({ user: updatedUser });
      saveState(STORAGE_KEYS.USER, updatedUser);
    }
  },
  
  // ==========================================
  // GAMIFICATION
  // ==========================================
  
  addPointsAndXp: async (points: number, xp: number) => {
    const currentUser = get().user;
    if (!currentUser) return;
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch('/api/users/rewards/points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ points, xp })
        });
        if (!res.ok) throw new Error(await res.text());
        const userRes = await fetch(`/api/users/${currentUser.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          set({ user: updatedUser });
          saveState(STORAGE_KEYS.USER, updatedUser);
        }
      } catch (error) {
        console.error('Error adding points/xp via API:', error);
      }
    } else {
      const currentPoints = currentUser.points ?? 350;
      const currentXp = currentUser.xp ?? 480;
      const nextXp = currentXp + xp;
      const nextLevel = Math.floor(nextXp / 200) + 1;
      const updatedUser: UserProfile = {
        ...currentUser,
        points: currentPoints + points,
        xp: nextXp,
        level: nextLevel,
      };
      set({ user: updatedUser });
      saveState(STORAGE_KEYS.USER, updatedUser);
    }
  },
  
  claimQuest: async (questId, rewardPoints, rewardXp) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const completedQuests = currentUser.completedQuestIds ?? ['quest-1'];
    if (completedQuests.includes(questId)) return;
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch('/api/users/rewards/points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ points: rewardPoints, xp: rewardXp })
        });
        if (!res.ok) throw new Error(await res.text());
        const updatedQuests = [...completedQuests, questId];
        const unlockedBadges = [...(currentUser.unlockedBadgeIds ?? ['badge-1', 'badge-3'])];
        let newBadgeId: string | null = null;
        if (questId === 'quest-2' && !unlockedBadges.includes('badge-2')) {
          newBadgeId = 'badge-2';
        } else if (questId === 'quest-3' && !unlockedBadges.includes('badge-4')) {
          newBadgeId = 'badge-4';
        } else if (questId === 'quest-4' && !unlockedBadges.includes('badge-5')) {
          newBadgeId = 'badge-5';
        }
        if (newBadgeId) unlockedBadges.push(newBadgeId);
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            completedQuestIds: updatedQuests,
            unlockedBadgeIds: unlockedBadges
          })
        });
        const userRes = await fetch(`/api/users/${currentUser.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          set({ user: updatedUser });
          saveState(STORAGE_KEYS.USER, updatedUser);
        }
      } catch (error) {
        console.error('Error claiming quest via API:', error);
      }
    } else {
      const currentPoints = currentUser.points ?? 350;
      const currentXp = currentUser.xp ?? 480;
      const nextXp = currentXp + rewardXp;
      const nextLevel = Math.floor(nextXp / 200) + 1;
      const unlockedBadges = [...(currentUser.unlockedBadgeIds ?? ['badge-1', 'badge-3'])];
      let newBadgeId: string | null = null;
      if (questId === 'quest-2' && !unlockedBadges.includes('badge-2')) {
        newBadgeId = 'badge-2';
      } else if (questId === 'quest-3' && !unlockedBadges.includes('badge-4')) {
        newBadgeId = 'badge-4';
      } else if (questId === 'quest-4' && !unlockedBadges.includes('badge-5')) {
        newBadgeId = 'badge-5';
      }
      if (newBadgeId) unlockedBadges.push(newBadgeId);
      const updatedUser: UserProfile = {
        ...currentUser,
        points: currentPoints + rewardPoints,
        xp: nextXp,
        level: nextLevel,
        completedQuestIds: [...completedQuests, questId],
        unlockedBadgeIds: unlockedBadges,
      };
      set({ user: updatedUser });
      saveState(STORAGE_KEYS.USER, updatedUser);
    }
  },
  
  redeemReward: async (rewardId, rewardName, pointsCost) => {
    const currentUser = get().user;
    if (!currentUser) return { success: false };
    const currentPoints = currentUser.points ?? 350;
    if (currentPoints < pointsCost) return { success: false };
    const code = 'HERO-' + Math.random().toString(36).substring(3, 9).toUpperCase();
    if (get().isFirebaseSession) {
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('No auth token');
        const res = await fetch('/api/users/rewards/points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ points: -pointsCost, xp: 0 })
        });
        if (!res.ok) throw new Error(await res.text());
        const redeemed = currentUser.redeemedRewards ?? [];
        const updatedRedeemed = [
          ...redeemed,
          { id: rewardId + '-' + Date.now(), rewardName, code, date: Date.now(), pointsUsed: pointsCost }
        ];
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ redeemedRewards: updatedRedeemed })
        });
        const userRes = await fetch(`/api/users/${currentUser.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          set({ user: updatedUser });
          saveState(STORAGE_KEYS.USER, updatedUser);
        }
        return { success: true, code };
      } catch (error) {
        console.error('Error redeeming reward via API:', error);
        return { success: false };
      }
    } else {
      const redeemed = currentUser.redeemedRewards ?? [];
      const updatedUser: UserProfile = {
        ...currentUser,
        points: currentPoints - pointsCost,
        redeemedRewards: [
          ...redeemed,
          { id: rewardId + '-' + Date.now(), rewardName, code, date: Date.now(), pointsUsed: pointsCost }
        ],
      };
      set({ user: updatedUser });
      saveState(STORAGE_KEYS.USER, updatedUser);
      return { success: true, code };
    }
  },
  
  // ==========================================
  // SYNC LOCAL ISSUES TO BACKEND
  // ==========================================
  
  syncLocalIssuesToBackend: async () => {
    const localIssues = get().issues;
    if (!localIssues || localIssues.length === 0) {
      console.log('🔄 No local issues to sync');
      return { syncedCount: 0, errorCount: 0 };
    }
    if (!get().isFirebaseSession) {
      console.warn('⚠️ Not in Firebase session, skipping sync');
      return { syncedCount: 0, errorCount: 0 };
    }
    console.log(`🔄 Syncing ${localIssues.length} local issues to backend...`);
    const token = await getAuthToken();
    if (!token) {
      console.warn('⚠️ No auth token, skipping sync');
      return { syncedCount: 0, errorCount: 0 };
    }
    let syncedCount = 0;
    let errorCount = 0;
    try {
      const checkRes = await fetch('/api/issues', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let backendIssueIds: string[] = [];
      if (checkRes.ok) {
        const backendIssues = await checkRes.json();
        backendIssueIds = backendIssues.map((i: any) => i.id);
        console.log(`📋 Backend has ${backendIssueIds.length} issues`);
      }
      for (const issue of localIssues) {
        if (backendIssueIds.includes(issue.id)) {
          console.log(`⏭️ Issue ${issue.id} already in backend, skipping`);
          syncedCount++;
          continue;
        }
        if (issue.id.startsWith('seed-')) {
          console.log(`⏭️ Seed issue ${issue.id}, skipping`);
          syncedCount++;
          continue;
        }
        console.log(`📤 Syncing issue ${issue.id} to backend...`);
        const createRes = await fetch('/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: issue.id,
            title: issue.title,
            description: issue.description || 'No description provided',
            category: issue.category || 'Other',
            severity: issue.severity || 'Medium',
            status: issue.status || 'Submitted',
            lat: issue.location?.lat ?? issue.lat ?? 0,
            lng: issue.location?.lng ?? issue.lng ?? 0,
            address: issue.location?.address ?? issue.address ?? null,
            imageUrl: issue.imageUrl ?? null,
            departmentId: issue.departmentId ?? null,
            reporterId: issue.reporterId ?? 'unknown',
            reporterName: issue.reporterName ?? 'Anonymous',
          })
        });
        if (createRes.ok) {
          console.log(`✅ Successfully synced issue: ${issue.id}`);
          syncedCount++;
        } else {
          const errorText = await createRes.text();
          console.error(`❌ Failed to sync issue ${issue.id}. Status: ${createRes.status}, Error: ${errorText}`);
          errorCount++;
        }
      }
    } catch (error) {
      console.error('❌ Error during sync:', error);
      errorCount++;
    }
    console.log(`🔄 Sync complete: ${syncedCount} synced, ${errorCount} failed`);
    if (syncedCount > 0) {
      await get().fetchIssues();
    }
    return { syncedCount, errorCount };
  },
  
  // ==========================================
  // DATA FETCHING
  // ==========================================
  
  fetchIssues: async () => {
    const pendingKey = 'fetchIssues';
    const existing = get()._pendingRequests.get(pendingKey);
    if (existing) return existing;
    
    const promise = (async () => {
      try {
        if (!get().isFirebaseSession) {
          console.log('Skipping API fetch - local mode');
          return;
        }
        const token = await getAuthToken();
        if (!token) {
          console.warn('No auth token available, skipping fetch');
          return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };
        console.log('📡 Fetching issues from /api/issues');
        
        const resIssues = await fetch('/api/issues', { headers });
        if (resIssues.ok) {
          const issuesData = await resIssues.json();
          console.log(`✅ Received ${issuesData.length} issues from server`);
          get().setIssues(issuesData);
        } else if (resIssues.status === 401 || resIssues.status === 403) {
          console.error('Auth token invalid, logging out');
          get().logout();
          throw new Error('Session expired');
        }
        
        const resComments = await fetch('/api/comments', { headers });
        if (resComments.ok) {
          const commentsData = await resComments.json();
          const groupedComments: Record<string, Comment[]> = {};
          for (const c of commentsData) {
            if (!groupedComments[c.issueId]) groupedComments[c.issueId] = [];
            groupedComments[c.issueId].push(c);
          }
          set({ comments: groupedComments });
          saveState(STORAGE_KEYS.COMMENTS, groupedComments);
        }
        
        const resLogs = await fetch('/api/audit-logs', { headers });
        if (resLogs.ok) {
          const logsData = await resLogs.json();
          const groupedLogs: Record<string, AuditLog[]> = {};
          for (const l of logsData) {
            if (!groupedLogs[l.issueId]) groupedLogs[l.issueId] = [];
            groupedLogs[l.issueId].push(l);
          }
          set({ auditLogs: groupedLogs });
          saveState(STORAGE_KEYS.AUDIT_LOGS, groupedLogs);
        }
        
        const resNotifs = await fetch('/api/notifications', { headers });
        if (resNotifs.ok) {
          const notifsData = await resNotifs.json();
          set({ notifications: notifsData });
          saveState(STORAGE_KEYS.NOTIFICATIONS, notifsData);
        }
        
        const currentUser = get().user;
        if (currentUser && currentUser.role === 'Admin') {
          const resUsers = await fetch('/api/users', { headers });
          if (resUsers.ok) {
            const usersData = await resUsers.json();
            set({ users: usersData });
            saveState(STORAGE_KEYS.USERS, usersData);
          }
        }
      } catch (error) {
        console.error('Error syncing app data via API:', error);
      } finally {
        get()._pendingRequests.delete(pendingKey);
      }
    })();
    
    get()._pendingRequests.set(pendingKey, promise);
    return promise;
  },
  // ==========================================
  // 🔥 DEPARTMENTS MANAGEMENT
  // ==========================================

  departments: initialDepartments,

  setDepartments: (depts) => {
    set({ departments: depts });
    saveState(STORAGE_KEYS.DEPARTMENTS, depts);
  },

  fetchDepartments: async () => {
    try {
      if (!get().isFirebaseSession) {
        console.log('Skipping fetchDepartments – not in Firebase session');
        return;
      }
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token, skipping fetchDepartments');
        return;
      }
      const res = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to fetch departments');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        set({ departments: data });
        saveState(STORAGE_KEYS.DEPARTMENTS, data);
        console.log(`✅ Fetched ${data.length} departments from server`);
      } else {
        console.error('Unexpected departments response:', data);
        throw new Error('Invalid departments data');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  triggerDepartmentAudit: async (deptId) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`/api/departments/${deptId}/audit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Audit failed');
      }
      const result = await res.json();
      console.log('✅ Audit result:', result);
      // Optionally refresh departments after audit
      await get().fetchDepartments();
      return result;
    } catch (error) {
      console.error('Error triggering audit:', error);
      throw error;
    }
  },

  sendDepartmentWarning: async (deptId) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`/api/departments/${deptId}/warning`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to send warning');
      }
      const result = await res.json();
      console.log('✅ Warning result:', result);
      return result;
    } catch (error) {
      console.error('Error sending warning:', error);
      throw error;
    }
  },


  // ==========================================
  // 🔥 FETCH USERS – ADDED FOR ADMIN
  // ==========================================

  /**
   * fetchUsers - Fetches all users from the backend (Admin only)
   * 
   * WHY: Admin needs an up‑to‑date list of all registered users.
   * This is called on mount and after any role change or deletion.
   */
  fetchUsers: async () => {
    try {
      // Only fetch if authenticated and user is Admin
      if (!get().isFirebaseSession) {
        console.log('Skipping fetchUsers – not in Firebase session');
        return;
      }
      const currentUser = get().user;
      if (!currentUser || currentUser.role !== 'Admin') {
        console.log('Skipping fetchUsers – user is not Admin');
        return;
      }

      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available, skipping fetchUsers');
        return;
      }

      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to fetch users');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        set({ users: data });
        saveState(STORAGE_KEYS.USERS, data);
        console.log(`✅ Fetched ${data.length} users from server`);
      } else {
        console.error('Unexpected users response:', data);
        throw new Error('Invalid users data received');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  refreshAllData: async () => {
    await get().fetchIssues();
    await get().fetchNotifications();
  },
  
  forceReload: async () => {
    get()._pendingRequests.clear();
    await get().fetchIssues();
    await get().fetchNotifications();
  },
}));

// ============================================
// REHYDRATION HOOK
// ============================================

import { useEffect } from 'react';

export const useRehydrateStore = () => {
  const store = useStore();
  const { 
    user, 
    isFirebaseSession, 
    isInitialized, 
    setIsInitialized, 
    setUser, 
    setIsFirebaseSession,
    issues,
    fetchIssues
  } = store;
  
  useEffect(() => {
    if (!isInitialized) {
      const savedUser = loadState<UserProfile | null>(STORAGE_KEYS.USER, null);
      
      if (savedUser && savedUser.role !== 'Guest') {
        setUser(savedUser, true);
        setIsFirebaseSession(true);
        const savedIssues = loadState<Issue[]>(STORAGE_KEYS.ISSUES, []);
        if (savedIssues.length > 0) {
          store.setIssues(savedIssues);
        }
        fetchIssues().catch(console.error);
      } else if (savedUser && savedUser.role === 'Guest') {
        setUser(savedUser, false);
        setIsFirebaseSession(false);
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, setIsInitialized, setUser, setIsFirebaseSession, fetchIssues, store]);
  
  return store;
};