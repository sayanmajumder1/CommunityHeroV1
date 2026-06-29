// ============================================
// server.ts - COMPLETE FIXED VERSION
// ============================================
// 
// 🔥 COMBINES: 
// - Fixed middleware order (Vite AFTER API routes)
// - Full seed data (users, issues, comments, notifications, announcements)
// - All endpoints (issues, users, comments, audit-logs, notifications, posts, announcements)
// - Full interfaces (User, Issue, Comment, etc.)
// - Inline auth middleware (no external dependency)
// - Gemini AI routes
// - Error handling
// ============================================

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

// ==========================================
// 🔥 STEP 1: MIDDLEWARE (BEFORE API ROUTES)
// ==========================================

app.use((req, res, next) => {
  console.log(`📡 Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '50mb' }));

// ==========================================
// 🔥 STEP 2: AUTH MIDDLEWARE (INLINE)
// ==========================================

interface AuthRequest extends express.Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

const requireAuth = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  console.log(`🔒 Checking auth for: ${req.method} ${req.url}`);
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`❌ No auth header found`);
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    console.log(`🔑 Token found: ${token.substring(0, 10)}...`);

    // Parse local_bypass token
    if (token.startsWith('local_bypass_')) {
      const parts = token.split(':');
      if (parts.length >= 2) {
        const uid = parts[0].replace('local_bypass_', '');
        const email = parts[2] || '';
        
        req.user = {
          uid,
          email,
          name: email.split('@')[0] || 'Civic Hero',
        };
        return next();
      }
    }

    // Development fallback
    if (process.env.NODE_ENV !== 'production') {
      req.user = {
        uid: token.substring(0, 20) || 'dev-user',
        email: 'dev@communityhero.org',
        name: 'Dev User',
      };
      console.warn('⚠️ Using development auth fallback');
      return next();
    }

    console.log(`❌ Invalid token`);
    res.status(401).json({ error: 'Invalid or expired token' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// ==========================================
// 🔥 STEP 3: IN-MEMORY DATABASE
// ==========================================
interface Department {
  id: string;
  name: string;
  head: string;
  createdAt: number;
  updatedAt: number;
  lastAudit?: number;
}
interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'Citizen' | 'Officer' | 'Admin' | 'Guest';
  points: number;
  xp: number;
  level: number;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bio: string | null;
  departmentId: string | null;
  profilePhoto: string | null;
  isVerified: boolean;
  unlockedBadgeIds: string[];
  completedQuestIds: string[];
  redeemedRewards: any[];
  createdAt: number;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved';
  lat: number;
  lng: number;
  address: string | null;
  imageUrl: string | null;
  createdAt: number;
  updatedAt: number;
  reporterId: string;
  reporterName: string;
  upvotes: number;
  departmentId: string | null;
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
}

interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

interface AuditLog {
  id: string;
  issueId: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  createdAt: number;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  text: string;
  unread: boolean;
  createdAt: number;
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
  authorId: string;
}

interface PostComment {
  id: string;
  postId: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: number;
  authorId: string;
}

interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

interface Upvote {
  id: string;
  issueId: string;
  userId: string;
  createdAt: Date;
}

interface Announcement {
  id: string;
  title: string;
  desc: string;
  date: string;
  createdAt: number;
}

interface OfficialMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  content: string;
  createdAt: number;
  read: boolean;
}

// ==========================================
// THE IN-MEMORY DATABASE
// ==========================================

const DB = {
  users: new Map<string, User>(),
  issues: new Map<string, Issue>(),
  comments: new Map<string, Comment>(),
  auditLogs: new Map<string, AuditLog>(),
  notifications: new Map<string, Notification>(),
  posts: new Map<string, Post>(),
  postComments: new Map<string, PostComment>(),
  postLikes: new Map<string, PostLike>(),
  upvotes: new Map<string, Upvote>(),
  announcements: new Map<string, Announcement>(),
  departments: new Map<string, any>(),
  officialMessages: new Map<string, OfficialMessage>(),
};

// ==========================================
// 🔥 SEED DATA - FULL (MATCHES FRONTEND)
// ==========================================

function seedDatabase() {
  const now = Date.now();
  const yesterday = now - 86400000;
  const twoDaysAgo = now - 172800000;

  console.log('🌱 Seeding database with initial data...');

  // -------- SEED USERS --------
  const users: User[] = [
    {
      uid: 'user-seed-1',
      email: 'kiran@communityhero.org',
      displayName: 'Kiran Kumar',
      role: 'Citizen',
      points: 350,
      xp: 480,
      level: 3,
      phone: null,
      address: 'Main Street, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      bio: 'Active community member',
      departmentId: null,
      profilePhoto: null,
      isVerified: true,
      unlockedBadgeIds: ['badge-1', 'badge-3'],
      completedQuestIds: ['quest-1'],
      redeemedRewards: [],
      createdAt: now - 30 * 86400000,
    },
    {
      uid: 'user-seed-2',
      email: 'sarah@communityhero.org',
      displayName: "Sarah D'Souza",
      role: 'Citizen',
      points: 640,
      xp: 720,
      level: 4,
      phone: null,
      address: 'Sector 4, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      bio: 'Community organizer',
      departmentId: null,
      profilePhoto: null,
      isVerified: true,
      unlockedBadgeIds: ['badge-1', 'badge-2', 'badge-4'],
      completedQuestIds: ['quest-1', 'quest-2'],
      redeemedRewards: [],
      createdAt: now - 15 * 86400000,
    },
    {
      uid: 'user-seed-3',
      email: 'anish@communityhero.org',
      displayName: 'Anish Shah',
      role: 'Citizen',
      points: 210,
      xp: 300,
      level: 2,
      phone: null,
      address: 'Andheri East, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      bio: null,
      departmentId: null,
      profilePhoto: null,
      isVerified: false,
      unlockedBadgeIds: ['badge-1'],
      completedQuestIds: [],
      redeemedRewards: [],
      createdAt: now - 25 * 86400000,
    },
    {
      uid: 'user-seed-4',
      email: 'officer@communityhero.org',
      displayName: 'Municipal Officer Dev',
      role: 'Officer',
      points: 500,
      xp: 2500,
      level: 5,
      phone: null,
      address: 'Municipal Office, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      bio: 'Road Maintenance Department',
      departmentId: 'dept-1',
      profilePhoto: null,
      isVerified: true,
      unlockedBadgeIds: ['badge-1', 'badge-3', 'badge-5'],
      completedQuestIds: ['quest-1', 'quest-2', 'quest-3'],
      redeemedRewards: [],
      createdAt: now - 60 * 86400000,
    },
    {
      uid: 'admin-super-1',
      email: 'admin@communityhero.org',
      displayName: 'Administrator Chief',
      role: 'Admin',
      points: 1000,
      xp: 5000,
      level: 10,
      phone: null,
      address: 'City Hall, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      bio: 'System Administrator',
      departmentId: null,
      profilePhoto: null,
      isVerified: true,
      unlockedBadgeIds: ['badge-1', 'badge-2', 'badge-3', 'badge-4', 'badge-5'],
      completedQuestIds: ['quest-1', 'quest-2', 'quest-3', 'quest-4'],
      redeemedRewards: [],
      createdAt: now - 90 * 86400000,
    },
  ];

  users.forEach(u => DB.users.set(u.uid, u));

  // -------- SEED ISSUES (MATCH FRONTEND IDs) --------
  const issues: Issue[] = [
    {
      id: 'seed-1',
      title: 'Pothole on Main Street',
      description: 'Large pothole near the intersection causing traffic issues and vehicle damage.',
      category: 'Pothole',
      severity: 'High',
      status: 'Submitted',
      lat: 19.0760,
      lng: 72.8777,
      address: 'Main Street, Mumbai',
      imageUrl: null,
      createdAt: yesterday,
      updatedAt: yesterday,
      reporterId: 'user-seed-1',
      reporterName: 'Kiran Kumar',
      upvotes: 5,
      departmentId: 'dept-1',
      assignedOfficerId: null,
      assignedOfficerName: null,
    },
    {
      id: 'seed-2',
      title: 'Water Leakage in Sector 4',
      description: 'Pipeline burst causing water logging and road damage.',
      category: 'Water Leakage',
      severity: 'Critical',
      status: 'In Progress',
      lat: 19.0860,
      lng: 72.8877,
      address: 'Sector 4, Mumbai',
      imageUrl: null,
      createdAt: twoDaysAgo,
      updatedAt: now - 3600000,
      reporterId: 'user-seed-2',
      reporterName: "Sarah D'Souza",
      upvotes: 12,
      departmentId: 'dept-1',
      assignedOfficerId: 'user-seed-4',
      assignedOfficerName: 'Municipal Officer Dev',
    },
    {
      id: 'seed-3',
      title: 'Broken Street Light on Avenue Road',
      description: 'Street light not working for 3 weeks, area is dark at night.',
      category: 'Damaged Light',
      severity: 'Medium',
      status: 'Under Review',
      lat: 19.0960,
      lng: 72.8977,
      address: 'Avenue Road, Mumbai',
      imageUrl: null,
      createdAt: now - 86400000,
      updatedAt: now - 43200000,
      reporterId: 'user-seed-3',
      reporterName: 'Anish Shah',
      upvotes: 3,
      departmentId: 'dept-1',
      assignedOfficerId: null,
      assignedOfficerName: null,
    },
  ];

  issues.forEach(i => DB.issues.set(i.id, i));

  // -------- SEED COMMENTS --------
  const comments: Comment[] = [
    {
      id: 'comment-seed-1',
      issueId: 'seed-1',
      userId: 'user-seed-2',
      userName: "Sarah D'Souza",
      text: 'This pothole has been here for weeks. Please fix it urgently!',
      createdAt: now - 43200000,
    },
    {
      id: 'comment-seed-2',
      issueId: 'seed-2',
      userId: 'user-seed-1',
      userName: 'Kiran Kumar',
      text: 'Water is flowing into the main road now. Emergency!',
      createdAt: now - 21600000,
    },
  ];

  comments.forEach(c => DB.comments.set(c.id, c));

  // -------- SEED NOTIFICATIONS --------
  const notifications: Notification[] = [
    {
      id: 'notif-seed-1',
      userId: 'user-seed-1',
      title: 'Issue Updated',
      text: 'Your report "Pothole on Main Street" is now Under Review.',
      unread: true,
      createdAt: now - 3600000,
    },
    {
      id: 'notif-seed-2',
      userId: 'user-seed-2',
      title: 'Issue Resolved',
      text: 'Great news! "Water Leakage in Sector 4" has been marked as In Progress.',
      unread: false,
      createdAt: now - 7200000,
    },
  ];

  notifications.forEach(n => DB.notifications.set(n.id, n));

  // -------- SEED ANNOUNCEMENTS --------
  const announcements: Announcement[] = [
    {
      id: 'announce-seed-1',
      title: 'Community Cleanup Drive',
      desc: 'Join us this Saturday for a city-wide cleanup initiative. Meet at City Hall at 9 AM.',
      date: 'Saturday, June 28',
      createdAt: now - 86400000,
    },
    {
      id: 'announce-seed-2',
      title: 'New Reporting Feature',
      desc: 'You can now upload videos with your issue reports for better documentation.',
      date: 'Coming Soon',
      createdAt: now - 172800000,
    },
  ];

  announcements.forEach(a => DB.announcements.set(a.id, a));
    // 🔥 ADD: SEED DEPARTMENTS
  const departments: Department[] = [
    {
      id: 'dept-1',
      name: 'Roads & Infrastructure Maintenance',
      head: 'Director Sanjay Varma',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dept-2',
      name: 'Sanitation & Solid Waste Management',
      head: 'Officer Priya Nambiar',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dept-3',
      name: 'Electrical Works & Grid Safety',
      head: 'Engineer David J.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dept-4',
      name: 'Water Board & Sewerage Ops',
      head: 'Director Anand Gowda',
      createdAt: now,
      updatedAt: now,
    },
  ];
  departments.forEach(d => DB.departments.set(d.id, d));

  // Seed messages between Officer and Admin
  const seedMessages: OfficialMessage[] = [
    {
      id: 'msg-1',
      senderId: 'user-seed-4',
      senderName: 'Municipal Officer Dev',
      senderRole: 'Officer',
      receiverId: 'Admin',
      receiverName: 'System Administrators',
      content: 'Hello Admin, we need additional resources allocated for roads repair in Ward 5. The pothole reports are increasing rapidly this week.',
      createdAt: now - 3600000 * 5, // 5 hours ago
      read: true
    },
    {
      id: 'msg-2',
      senderId: 'admin-super-1',
      senderName: 'Administrator Chief',
      senderRole: 'Admin',
      receiverId: 'user-seed-4',
      receiverName: 'Municipal Officer Dev',
      content: 'Hi Officer Dev, I have received your request. We are reviewing the budget reallocation in tomorrow’s core meeting. Keep up the great work logging the updates!',
      createdAt: now - 3600000 * 4, // 4 hours ago
      read: false
    },
    {
      id: 'msg-3',
      senderId: 'user-seed-4',
      senderName: 'Municipal Officer Dev',
      senderRole: 'Officer',
      receiverId: 'Admin',
      receiverName: 'System Administrators',
      content: 'Thank you for the quick update! We will continue monitoring the reports and publish advisories as necessary.',
      createdAt: now - 3600000 * 3, // 3 hours ago
      read: false
    }
  ];
  seedMessages.forEach(m => DB.officialMessages.set(m.id, m));

  console.log('✅ Database seeded successfully!');
  console.log(`   📊 ${DB.users.size} users, ${DB.issues.size} issues, ${DB.comments.size} comments`);
  console.log(`   📍 Available issue IDs: ${Array.from(DB.issues.keys()).join(', ')}`);
}

// ==========================================
// 🔥 STEP 4: API ROUTES (MUST BE BEFORE VITE)
// ==========================================

// -------- ISSUES --------

app.get('/api/issues', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allIssues = Array.from(DB.issues.values()).sort((a: any, b: any) => b.createdAt - a.createdAt);
    console.log(`📋 Returning ${allIssues.length} issues`);
    res.json(allIssues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

app.get('/api/issues/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const issue = DB.issues.get(id);
    if (!issue) {
      console.log(`❌ Issue not found: ${id}`);
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

app.post('/api/issues', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, title, description, category, severity, lat, lng, address, imageUrl, departmentId } = req.body;

    if (!id || !title || !description || !category || !severity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timestamp = Date.now();
    const newIssue: Issue = {
      id,
      title,
      description,
      category,
      severity,
      status: 'Submitted',
      lat: Number(lat || 0),
      lng: Number(lng || 0),
      address: address || null,
      imageUrl: imageUrl || null,
      createdAt: timestamp,
      updatedAt: timestamp,
      reporterId: req.user!.uid,
      reporterName: req.user?.name || 'Anonymous',
      upvotes: 0,
      departmentId: departmentId || null,
      assignedOfficerId: null,
      assignedOfficerName: null,
    };

    DB.issues.set(id, newIssue);
    console.log(`✅ Issue created: ${id} - ${title}`);
    res.json(newIssue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to submit issue' });
  }
});

app.put('/api/issues/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔍 Looking for issue: ${id}`);
    console.log(`📋 Current issues in DB: ${Array.from(DB.issues.keys()).join(', ')}`);

    const issue = DB.issues.get(id);
    if (!issue) {
      console.log(`❌ Issue not found: ${id}`);
      return res.status(404).json({ error: 'Issue not found' });
    }

    console.log(`✅ Found issue: ${issue.id} - ${issue.title}`);
    console.log(`🔄 Updating status from ${issue.status} to ${status}`);

    issue.status = status;
    issue.updatedAt = Date.now();
    DB.issues.set(id, issue);

    console.log(`✅ Status updated successfully for: ${id}`);
    res.json(issue);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/issues/:id/upvote', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const issue = DB.issues.get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    issue.upvotes = (issue.upvotes || 0) + 1;
    DB.issues.set(id, issue);
    res.json({ success: true, upvotes: issue.upvotes });
  } catch (error) {
    console.error('Error toggling upvote:', error);
    res.status(500).json({ error: 'Failed to toggle upvote' });
  }
});

app.delete('/api/issues/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    DB.issues.delete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

app.put('/api/issues/:id/assign', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { departmentId, assignedOfficerId, assignedOfficerName } = req.body;
    
    const issue = DB.issues.get(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    issue.departmentId = departmentId || null;
    issue.assignedOfficerId = assignedOfficerId || null;
    issue.assignedOfficerName = assignedOfficerName || null;
    issue.updatedAt = Date.now();
    DB.issues.set(id, issue);
    res.json(issue);
  } catch (error) {
    console.error('Error assigning issue:', error);
    res.status(500).json({ error: 'Failed to assign issue' });
  }
});

// -------- COMMENTS --------

app.get('/api/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allComments = Array.from(DB.comments.values());
    res.json(allComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/issues/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: issueId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment: Comment = {
      id: 'comment-' + Math.random().toString(36).substring(2, 9),
      issueId,
      userId: req.user!.uid,
      userName: req.user?.name || 'Anonymous',
      text,
      createdAt: Date.now(),
    };

    DB.comments.set(comment.id, comment);
    res.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// -------- AUDIT LOGS --------

app.get('/api/audit-logs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = Array.from(DB.auditLogs.values());
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// -------- NOTIFICATIONS --------

app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const userNotifs = Array.from(DB.notifications.values()).filter((n: any) => n.userId === userId);
    res.json(userNotifs);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const notif = DB.notifications.get(id);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    notif.unread = false;
    DB.notifications.set(id, notif);
    res.json(notif);
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.delete('/api/notifications/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    DB.notifications.delete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// -------- USERS --------

app.post('/api/users', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const userData = req.body;
    
    let user = DB.users.get(uid);
    if (!user) {
      user = {
        uid,
        email: userData.email || req.user?.email || '',
        displayName: userData.displayName || req.user?.name || 'User',
        role: userData.role || 'Citizen',
        points: userData.points || 0,
        xp: userData.xp || 0,
        level: userData.level || 1,
        phone: userData.phone || null,
        address: userData.address || null,
        city: userData.city || null,
        state: userData.state || null,
        country: userData.country || null,
        bio: userData.bio || null,
        departmentId: userData.departmentId || null,
        profilePhoto: userData.profilePhoto || null,
        isVerified: userData.isVerified || false,
        unlockedBadgeIds: userData.unlockedBadgeIds || [],
        completedQuestIds: userData.completedQuestIds || [],
        redeemedRewards: userData.redeemedRewards || [],
        createdAt: Date.now(),
      };
    } else {
      Object.assign(user, userData);
    }
    
    DB.users.set(uid, user);
    res.json(user);
  } catch (error) {
    console.error('Error upserting user:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});
// ... (everything before the API routes remains the same) ...

// -------- USERS --------

// (existing user routes: GET /api/users, GET /api/users/:uid, POST /api/users, etc.)

// 🔥 ADDED: GET /api/users/leaderboard
app.get('/api/users/leaderboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allUsers = Array.from(DB.users.values());
    const citizens = allUsers
      .filter((u: any) => u.role === 'Citizen')
      .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
      .map((u: any) => ({
        uid: u.uid,
        displayName: u.displayName || 'Anonymous Hero',
        points: u.points || 0,
        role: u.role,
      }));
    console.log(`📊 Leaderboard: returning ${citizens.length} citizens`);
    res.json(citizens);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
app.get('/api/users', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allUsers = Array.from(DB.users.values());
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:uid', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.params;
    console.log(`🔍 Fetching user profile for UID: ${uid}`);
    
    let user = DB.users.get(uid);
    
    if (!user) {
      console.log(`⚠️ User ${uid} not found in DB`);
      // Fallback for demo: create if not found
      const email = uid.includes('@') ? uid : `${uid}@communityhero.org`;
      const newUser: User = {
        uid,
        email,
        displayName: uid.split('@')[0] || 'Civic Hero',
        role: 'Citizen',
        points: 50,
        xp: 100,
        level: 1,
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        bio: null,
        departmentId: null,
        profilePhoto: null,
        isVerified: false,
        unlockedBadgeIds: [],
        completedQuestIds: [],
        redeemedRewards: [],
        createdAt: Date.now(),
      };
      
      DB.users.set(uid, newUser);
      user = newUser;
      console.log(`✨ Created new user for UID: ${uid}`);
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:uid/role', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.params;
    const { role, departmentId } = req.body;
    
    const user = DB.users.get(uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.role = role;
    user.departmentId = departmentId || null;
    DB.users.set(uid, user);
    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

app.delete('/api/users/:uid', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid } = req.params;
    DB.users.delete(uid);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/users/rewards/points', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { points, xp } = req.body;
    const uid = req.user!.uid;
    
    let user = DB.users.get(uid);
    if (!user) {
      user = {
        uid,
        email: req.user?.email || '',
        displayName: req.user?.name || 'User',
        role: 'Citizen',
        points: 0,
        xp: 0,
        level: 1,
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        bio: null,
        departmentId: null,
        profilePhoto: null,
        isVerified: false,
        unlockedBadgeIds: [],
        completedQuestIds: [],
        redeemedRewards: [],
        createdAt: Date.now(),
      };
      DB.users.set(uid, user);
    }

    user.points = (user.points || 0) + (points || 0);
    user.xp = (user.xp || 0) + (xp || 0);
    user.level = Math.floor((user.xp || 0) / 200) + 1;
    DB.users.set(uid, user);

    res.json(user);
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ error: 'Failed to update points' });
  }
});

// -------- POSTS (Community) --------

app.get('/api/posts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const allPosts = Array.from(DB.posts.values()).sort((a: any, b: any) => b.createdAt - a.createdAt);
    
    const postsWithLikedStatus = allPosts.map(p => {
      const likeKey = `${userId}_${p.id}`;
      const hasLiked = DB.postLikes.has(likeKey);
      return {
        ...p,
        hasLiked
      };
    });
    
    res.json(postsWithLikedStatus);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    const uid = req.user!.uid;
    const dbUser = DB.users.get(uid);
    
    const authorName = dbUser?.displayName || req.user?.name || 'Anonymous';
    const userRole = dbUser?.role || 'Citizen';
    
    const post: Post = {
      id: 'post-' + Math.random().toString(36).substring(2, 9),
      author: authorName,
      role: userRole,
      avatar: authorName[0],
      content,
      likes: 0,
      commentCount: 0,
      createdAt: Date.now(),
      authorId: uid,
    };
    
    DB.posts.set(post.id, post);
    
    // Award Points/XP for engaging in the civic dialogue by posting (+10 Points, +20 XP)
    if (dbUser) {
      dbUser.points = (dbUser.points || 0) + 10;
      dbUser.xp = (dbUser.xp || 0) + 20;
      dbUser.level = Math.floor((dbUser.xp || 0) / 200) + 1;
      DB.users.set(uid, dbUser);
      console.log(`🏆 Awarded +10 Points and +20 XP to ${dbUser.displayName} for creating a post!`);
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 🔥 POST /api/posts/:postId/like
app.post('/api/posts/:postId/like', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user!.uid;
    
    const post = DB.posts.get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const likeKey = `${userId}_${postId}`;
    const existingLike = DB.postLikes.get(likeKey);
    
    let hasLiked = false;
    if (existingLike) {
      // Unlike
      DB.postLikes.delete(likeKey);
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      // Like
      const newLike: PostLike = {
        id: likeKey,
        postId,
        userId,
        createdAt: new Date()
      };
      DB.postLikes.set(likeKey, newLike);
      post.likes = (post.likes || 0) + 1;
      hasLiked = true;
    }
    
    DB.posts.set(postId, post);
    res.json({ success: true, likes: post.likes, hasLiked });
  } catch (error) {
    console.error('Error toggling post like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// 🔥 GET /api/posts/:postId/comments
app.get('/api/posts/:postId/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const post = DB.posts.get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comments = Array.from(DB.postComments.values())
      .filter(c => c.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt); // Chronological order for comment threads
         
    res.json(comments);
  } catch (error) {
    console.error('Error fetching post comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// 🔥 POST /api/posts/:postId/comments
app.post('/api/posts/:postId/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user!.uid;
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const post = DB.posts.get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const dbUser = DB.users.get(userId);
    const authorName = dbUser?.displayName || req.user?.name || 'Anonymous';
    
    const comment: PostComment = {
      id: 'post-comment-' + Math.random().toString(36).substring(2, 9),
      postId,
      author: authorName,
      avatar: authorName[0],
      content,
      createdAt: Date.now(),
      authorId: userId
    };
    
    DB.postComments.set(comment.id, comment);
    
    post.commentCount = (post.commentCount || 0) + 1;
    DB.posts.set(postId, post);
    
    // Award Points/XP for engaging in the civic dialogue by commenting (+5 Points, +10 XP)
    if (dbUser) {
      dbUser.points = (dbUser.points || 0) + 5;
      dbUser.xp = (dbUser.xp || 0) + 10;
      dbUser.level = Math.floor((dbUser.xp || 0) / 200) + 1;
      DB.users.set(userId, dbUser);
      console.log(`🏆 Awarded +5 Points and +10 XP to ${dbUser.displayName} for commenting!`);
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error creating post comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 🔥 DELETE /api/posts/:postId
app.delete('/api/posts/:postId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user!.uid;
    
    const post = DB.posts.get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Verify authorization: only author or Admin can delete
    const dbUser = DB.users.get(userId);
    const isAdmin = dbUser?.role === 'Admin';
    if (post.authorId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }
    
    // Delete comments of this post
    for (const [key, comment] of DB.postComments.entries()) {
      if (comment.postId === postId) {
        DB.postComments.delete(key);
      }
    }
    
    // Delete likes of this post
    for (const [key, like] of DB.postLikes.entries()) {
      if (like.postId === postId) {
        DB.postLikes.delete(key);
      }
    }
    
    DB.posts.delete(postId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// -------- ANNOUNCEMENTS --------

app.get('/api/announcements', requireAuth, async (req: AuthRequest, res) => {
  try {
    const announcements = Array.from(DB.announcements.values());
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.post('/api/announcements', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, desc, date } = req.body;
    const announcement: Announcement = {
      id: 'ann-' + Math.random().toString(36).substring(2, 9),
      title,
      desc,
      date: date || new Date().toLocaleDateString(),
      createdAt: Date.now(),
    };
    DB.announcements.set(announcement.id, announcement);
    res.json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});


// ... (rest of the routes) ...

// ==========================================
// 🔥 STEP 5: GEMINI AI ROUTES
// ==========================================

let geminiClientInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    geminiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClientInstance;
}

/**
 * Robust wrapper to execute generateContent calls with exponential backoff on transient errors
 * and dynamic fallback to alternative models if the primary model is unavailable or overloaded.
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
) {
  const modelsToTry = [
    params.model,
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];

  // Remove duplicates while keeping order
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      try {
        console.log(`🤖 Attempting Gemini call with model: ${model} (attempt ${attempts + 1}/${maxAttempts})`);
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        console.log(`✅ Gemini call successful with model: ${model}`);
        return response;
      } catch (error: any) {
        attempts++;
        lastError = error;
        console.warn(`⚠️ Gemini call failed with model ${model}:`, error.message || error);

        // Treat 503, 429, or UNAVAILABLE/RESOURCE_EXHAUSTED errors as transient
        const isTransient = error.status === 'UNAVAILABLE' ||
                            error.message?.includes('503') ||
                            error.message?.includes('demand') ||
                            error.status === 'RESOURCE_EXHAUSTED' ||
                            error.message?.includes('429');

        if (isTransient && attempts < maxAttempts) {
          const delay = attempts * 1000;
          console.log(`🔄 Transient error. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break; // Fall back to the next model
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

app.post('/api/analyze-issue', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const ai = getGeminiClient();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Analyze this image of a civic issue. Identify the category (Pothole, Water Leakage, Waste Accumulation, Broken Road, Damaged Light, Other) and the severity (Low, Medium, High, Critical). Return a JSON object with "category", "severity", "confidence" (0-1), and a brief "description".' },
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
          ]
        }
      ]
    });

    const text = response.text || '{}';
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
});

app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getGeminiClient();

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: [
        ...(history || []).map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : h.role,
          parts: [{ text: h.content || h.text || '' }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: 'You are HeroBot, the official AI Assistant for Community Hero.',
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in chatbot endpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat message' });
  }
});
/**
 * GET /api/departments - Fetch all departments
 */
app.get('/api/departments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allDepts = Array.from(DB.departments.values());
    console.log(`📋 Returning ${allDepts.length} departments`);
    res.json(allDepts);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});
/**
 * POST /api/departments/:id/audit - Trigger an SLA audit for a department
 * (simulates recalculation and updates lastAudit timestamp)
 */
app.post('/api/departments/:id/audit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const dept = DB.departments.get(id);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }
    // Update lastAudit timestamp
    dept.lastAudit = Date.now();
    dept.updatedAt = Date.now();
    DB.departments.set(id, dept);
    console.log(`✅ Audit completed for department: ${dept.name}`);
    res.json({ success: true, message: `Audit completed for ${dept.name}` });
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({ error: 'Audit failed' });
  }
});
/**
 * POST /api/departments/:id/warning - Send a warning to a department head
 * (could log or email; here we just log and return success)
 */
app.post('/api/departments/:id/warning', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const dept = DB.departments.get(id);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }
    console.log(`⚠️ Warning sent to ${dept.head} (${dept.name})`);
    res.json({ success: true, message: `Warning dispatched to ${dept.head}` });
  } catch (error) {
    console.error('Error sending warning:', error);
    res.status(500).json({ error: 'Failed to send warning' });
  }
});

/**
 * GET /api/official-messages - Retrieve messages between Officers and Admins
 */
app.get('/api/official-messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const dbUser = DB.users.get(userId);
    if (!dbUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const messages = Array.from(DB.officialMessages.values());
    let filtered: OfficialMessage[] = [];

    if (dbUser.role === 'Admin') {
      // Admins see all messages
      filtered = messages;
    } else if (dbUser.role === 'Officer') {
      // Officers see messages they sent, or messages sent to them specifically, or to all officers (if applicable)
      filtered = messages.filter(m => m.senderId === userId || m.receiverId === userId || (m.senderRole === 'Admin' && m.receiverId === 'Officer'));
    } else {
      return res.status(403).json({ error: 'Only Officers and Administrators can access internal messages' });
    }

    // Sort chronologically (oldest first for chat timeline)
    filtered.sort((a, b) => a.createdAt - b.createdAt);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching official messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/official-messages - Send an official message
 */
app.post('/api/official-messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const dbUser = DB.users.get(userId);
    if (!dbUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { content, receiverId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    if (dbUser.role !== 'Admin' && dbUser.role !== 'Officer') {
      return res.status(403).json({ error: 'Only Officers and Administrators can send internal messages' });
    }

    let msgReceiverId = 'Admin';
    let msgReceiverName = 'System Administrators';

    if (dbUser.role === 'Admin') {
      if (!receiverId) {
        return res.status(400).json({ error: 'Recipient receiverId is required for administrator messages' });
      }
      const targetUser = DB.users.get(receiverId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Recipient user not found' });
      }
      msgReceiverId = receiverId;
      msgReceiverName = targetUser.displayName;
    }

    const newMessage: OfficialMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      senderId: userId,
      senderName: dbUser.displayName,
      senderRole: dbUser.role,
      receiverId: msgReceiverId,
      receiverName: msgReceiverName,
      content: content.trim(),
      createdAt: Date.now(),
      read: false
    };

    DB.officialMessages.set(newMessage.id, newMessage);
    console.log(`✉️ Message dispatched from ${dbUser.displayName} (${dbUser.role}) to ${msgReceiverName}`);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending official message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /api/official-messages/read - Mark messages as read
 */
app.post('/api/official-messages/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.uid;
    const dbUser = DB.users.get(userId);
    if (!dbUser) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { senderId } = req.body; // If admin, mark all messages from this sender as read

    let updatedCount = 0;
    for (const [key, msg] of DB.officialMessages.entries()) {
      if (dbUser.role === 'Admin' && msg.senderId === senderId && !msg.read) {
        msg.read = true;
        DB.officialMessages.set(key, msg);
        updatedCount++;
      } else if (dbUser.role === 'Officer' && msg.receiverId === userId && msg.senderRole === 'Admin' && !msg.read) {
        msg.read = true;
        DB.officialMessages.set(key, msg);
        updatedCount++;
      }
    }

    res.json({ success: true, markedRead: updatedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

// ==========================================
// 🔥 STEP 6: VITE MIDDLEWARE (LAST!)
// ==========================================

async function startServer() {
  // Seed database
  seedDatabase();

  // Check if running in production
  if (process.env.NODE_ENV !== 'production') {
    // Development: Use Vite middleware AFTER API routes
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite middleware enabled (development mode)');
  } else {
    // Production: Serve static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 Serving static files from dist');
  }

  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Data store: In-memory with ${DB.users.size} users, ${DB.issues.size} issues`);
    console.log(`📍 Available issue IDs: ${Array.from(DB.issues.keys()).join(', ')}`);
    console.log(`🔑 Auth: Local bypass mode enabled`);
  });
}

startServer();