import React, { useState, useEffect } from 'react';
import { useStore, UserProfile } from '../store';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, Shield, 
  Activity, CheckCircle, Clock, Lock, Settings, Camera, 
  Save, FileText, Check, Trash2, Bell, AlertTriangle, 
  TrendingUp, Cpu, Trophy, Sparkles, ShieldAlert, Users,
  RefreshCw, BarChart2, ChevronRight, Eye, UserCheck, CheckSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

// Premium Avatar Options for mock upload
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
];

export default function Profile() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const issues = useStore((state) => state.issues);
  const isFirebaseSession = useStore((state) => state.isFirebaseSession);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'details' | 'badges' | 'reports' | 'preferences' | 'security' | 'performance' | 'department' | 'users' | 'audit' | 'system'>('details');

  // Load detailed profile state (merging database 5-fields limits with extra info cached in localStorage)
  const getProfileStorageKey = () => `community_hero_profile_details_${user?.uid || 'guest'}`;

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    dateOfBirth: '',
    gender: 'Other',
    bio: '',
    departmentId: 'Roads & Infrastructure',
    isVerified: true,
    status: 'Active',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    adminLevel: 'Super Administrator',
    assignedRegion: 'Sector A'
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Security passwords state
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    weeklyDigest: true,
    autoDispatchSms: true
  });

  // Admin User Registry State
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([
    { uid: 'u-1', email: 'citizen.kiran@civic.org', displayName: 'Kiran Kumar', role: 'Citizen', createdAt: Date.now() - 120 * 24 * 3600 * 1000, points: 540, xp: 920, level: 5 },
    { uid: 'u-2', email: 'officer.dev@municipal.gov', displayName: 'Officer Dev', role: 'Officer', createdAt: Date.now() - 90 * 24 * 3600 * 1000, points: 120, xp: 320, level: 2 },
    { uid: 'u-3', email: 'sarah.dsouza@community.in', displayName: "Sarah D'Souza", role: 'Citizen', createdAt: Date.now() - 45 * 24 * 3600 * 1000, points: 310, xp: 540, level: 3 },
    { uid: 'u-4', email: 'admin.super@communityhero.io', displayName: 'System Admin', role: 'Admin', createdAt: Date.now() - 200 * 24 * 3600 * 1000, points: 990, xp: 1980, level: 10 },
    { uid: 'u-5', email: 'anish.shah@cleanstreets.org', displayName: 'Anish Shah', role: 'Citizen', createdAt: Date.now() - 15 * 24 * 3600 * 1000, points: 80, xp: 140, level: 1 }
  ]);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoAssignDispatch: true,
    slaAlertThreshold: '24 Hours',
    geminiVerificationModel: 'Gemini 2.0 Flash',
    rateLimitReports: '10 per Day'
  });

  // Loaded Details Effect
  useEffect(() => {
    if (user) {
      // Default initial sync values
      const initialForm = {
        fullName: user.displayName || '',
        phone: user.phone || '98765 43210',
        address: user.address || '12, Crescent Heights Road',
        city: user.city || 'Bengaluru',
        state: user.state || 'Karnataka',
        country: user.country || 'India',
        dateOfBirth: user.dateOfBirth || '1995-05-15',
        gender: user.gender || 'Female',
        bio: user.bio || 'Active resident passionate about keeping our community clean, green, and completely pothole-free.',
        departmentId: user.departmentId || 'Roads & Infrastructure',
        isVerified: user.isVerified !== undefined ? user.isVerified : true,
        status: user.status || 'Active',
        profilePhoto: user.profilePhoto || AVATAR_PRESETS[0],
        adminLevel: 'Super Administrator',
        assignedRegion: 'Sector A'
      };

      // Load cached extended fields from localStorage
      const cached = localStorage.getItem(getProfileStorageKey());
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfileForm({
            ...initialForm,
            ...parsed,
            // Keep displayName synchronized if updated externally
            fullName: user.displayName || parsed.fullName || ''
          });
        } catch (e) {
          setProfileForm(initialForm);
        }
      } else {
        setProfileForm(initialForm);
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-neutral-400 mb-4" />
        <h2 className="text-xl font-bold text-neutral-800">Authentication Required</h2>
        <p className="text-neutral-500 text-sm mt-1 max-w-xs">Please sign in to access your dashboard and profile management settings.</p>
      </div>
    );
  }

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Profile Save Action
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      // 1. Sync update back to Zustand store (so displayName is globally updated)
      const updatedUser: UserProfile = {
        ...user,
        displayName: profileForm.fullName,
        // Merging extended fields inside the local store user profile
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country,
        dateOfBirth: profileForm.dateOfBirth,
        gender: profileForm.gender,
        bio: profileForm.bio,
        profilePhoto: profileForm.profilePhoto
      };

      setUser(updatedUser);

      // 2. Persist extended fields locally to bypass Firestore's 5-fields limit
      localStorage.setItem(getProfileStorageKey(), JSON.stringify(profileForm));

      setIsSaving(false);
      setIsEditMode(false);
      toast.success('Profile updated successfully!');
    }, 1200);
  };

  // Avatar selector action
  const selectAvatarPreset = (url: string) => {
    setProfileForm(prev => ({ ...prev, profilePhoto: url }));
    setShowAvatarModal(false);
    
    // Auto update in store immediately if not in edit mode
    if (!isEditMode) {
      const updated = { ...user, profilePhoto: url };
      setUser(updated);
      localStorage.setItem(getProfileStorageKey(), JSON.stringify({ ...profileForm, profilePhoto: url }));
      toast.success('Avatar updated instantly!');
    } else {
      toast.success('Selected. Click Save to commit details.');
    }
  };

  // Change Password Action
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword) {
      toast.error('Please fill out all password fields.');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    toast.loading('Validating credentials...', { id: 'pwd-toast' });
    setTimeout(() => {
      toast.success('Password updated successfully!', { id: 'pwd-toast' });
      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1500);
  };

  // Delete Account Action
  const handleDeleteAccountRequest = () => {
    const isConfirmed = window.confirm(
      "WARNING: This will initiate a permanent account deletion request. " +
      "All your reports, rewards ledger, and profile nodes will be completely purged in compliance with civic retention laws. " +
      "Do you wish to proceed?"
    );
    if (isConfirmed) {
      toast.success('Deletion request logged. An officer will email you to verify identity.');
    }
  };

  // Citizen-specific details
  const citizenIssues = issues.filter(i => i.reporterId === user.uid);
  const resolvedIssuesCount = citizenIssues.filter(i => i.status === 'Resolved').length;

  // Officer-specific simulation stats
  const officerStats = {
    slaMet: '96.2%',
    casesAssigned: 14,
    casesResolved: 32,
    casesPending: issues.filter(i => i.status !== 'Resolved').length,
    averageRating: '4.8 / 5.0'
  };

  // Admin users list role modification
  const handleAdminUserRoleChange = (userId: string, newRole: 'Citizen' | 'Officer' | 'Admin') => {
    setAdminUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    toast.success(`User role updated to ${newRole}`);
  };

  return (
    <div className="space-y-8" id="profile-management-module">
      {/* 1. Header Hero Card with user metrics */}
      <div className="relative bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Banner Gradient Background */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 opacity-90" />
        
        {/* Banner Grid Patterns */}
        <div className="absolute top-0 inset-x-0 h-32 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="relative pt-16 px-6 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar block */}
            <div className="relative group w-24 h-24 rounded-2xl bg-neutral-100 border-4 border-white shadow-md overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setShowAvatarModal(true)}>
              <img 
                src={profileForm.profilePhoto} 
                alt="Profile Avatar" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{profileForm.fullName || 'Anonymous Hero'}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                  {user.role}
                </span>
                {profileForm.isVerified && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                    <Check className="w-3 h-3 text-emerald-600" /> Verified Resident
                  </span>
                )}
              </div>
              
              <p className="text-xs text-neutral-400 font-medium mt-1 sm:mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email} 
                <span className="text-neutral-300">•</span> 
                <MapPin className="w-3.5 h-3.5" /> {profileForm.city}, {profileForm.state}
              </p>
            </div>
          </div>

          {/* Core Level Trackers for Citizen */}
          {user.role === 'Citizen' && (
            <div className="w-full md:w-72 bg-neutral-50 border border-neutral-200/60 p-4 rounded-xl flex flex-col justify-between shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">CIVIC LEVEL</span>
                <span className="text-xs font-bold text-blue-600">Level {user.level || 3}</span>
              </div>
              
              {/* Custom interactive progress bar to Level up */}
              <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${((user.xp || 480) % 200) / 2}%` }} 
                />
              </div>

              <div className="flex justify-between items-center mt-2 text-[10px] font-mono font-semibold text-neutral-400">
                <span>{user.xp || 480} XP TOTAL</span>
                <span>{200 - ((user.xp || 480) % 200)} XP TO NEXT LEVEL</span>
              </div>
            </div>
          )}

          {/* Quick Metrics for Officer */}
          {user.role === 'Officer' && (
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
              <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-xl min-w-[80px]">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Assigned</p>
                <h4 className="text-md font-extrabold text-neutral-800">{officerStats.casesAssigned}</h4>
              </div>
              <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-xl min-w-[80px]">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase">Resolved</p>
                <h4 className="text-md font-extrabold text-emerald-600">{officerStats.casesResolved}</h4>
              </div>
              <div className="bg-neutral-50 border border-neutral-100 p-3 rounded-xl min-w-[80px]">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase">SLA Met</p>
                <h4 className="text-md font-extrabold text-blue-600">{officerStats.slaMet}</h4>
              </div>
            </div>
          )}

          {/* Quick Metrics for Admin */}
          {user.role === 'Admin' && (
            <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl flex items-center gap-3 shadow-md max-w-sm">
              <div className="p-2.5 bg-neutral-800 rounded-lg text-emerald-400 border border-neutral-700">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div className="font-mono text-left">
                <span className="text-[8px] block font-bold text-neutral-500 uppercase tracking-widest">ADMIN SECURITY PROTOCOL</span>
                <span className="text-xs font-bold text-neutral-200">CLEARANCE: SUPER_ADMIN_LEVEL_3</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main profile workspace (Tabs layout with Responsive Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3">Profile Workspace</h3>
          
          <nav className="flex flex-col gap-1">
            {/* GENERAL TABS (FOR ALL ROLES) */}
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'details' 
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal Details</span>
            </button>

            {/* CITIZEN EXCLUSIVE TABS */}
            {user.role === 'Citizen' && (
              <>
                <button
                  onClick={() => setActiveTab('badges')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    activeTab === 'badges' 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Unlocked Badges</span>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    activeTab === 'reports' 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>My Reported Issues ({citizenIssues.length})</span>
                </button>
              </>
            )}

            {/* OFFICER EXCLUSIVE TABS */}
            {user.role === 'Officer' && (
              <>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    activeTab === 'performance' 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance Stats</span>
                </button>

                <button
                  onClick={() => setActiveTab('department')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    activeTab === 'department' 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Department Directory</span>
                </button>
              </>
            )}

            {/* ADMIN EXCLUSIVE TABS */}
            {user.role === 'Admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    activeTab === 'users' 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>User Directory Registry</span>
                </button>

                <button
                  onClick={() => setActiveTab('system')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                    activeTab === 'system' 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>System Toggles</span>
                </button>
              </>
            )}

            {/* NOTIFICATIONS & SECURITY (COMMON) */}
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'preferences' 
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notification Config</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'security' 
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Account Security</span>
            </button>
          </nav>
        </div>

        {/* Workspace Panels container */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm min-h-[480px]"
            >
              {/* --- TAB 1: PERSONAL DETAILS (MUTABLE FORM) --- */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Personal Information</h2>
                      <p className="text-xs text-neutral-400 font-medium">Keep your identity parameters updated for verified civil credentials.</p>
                    </div>
                    {!isEditMode ? (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 border border-neutral-200 rounded-lg text-xs font-bold transition"
                      >
                        <Settings className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditMode(false)}
                          className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                        >
                          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Full Legal Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <input 
                            type="text" 
                            name="fullName"
                            value={profileForm.fullName}
                            onChange={handleInputChange}
                            disabled={!isEditMode}
                            className="pl-10 w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <input 
                            type="text" 
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleInputChange}
                            disabled={!isEditMode}
                            className="pl-10 w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* DOB */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Date of Birth</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <input 
                            type="date" 
                            name="dateOfBirth"
                            value={profileForm.dateOfBirth}
                            onChange={handleInputChange}
                            disabled={!isEditMode}
                            className="pl-10 w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Gender Selection</label>
                        <select
                          name="gender"
                          value={profileForm.gender}
                          onChange={handleInputChange}
                          disabled={!isEditMode}
                          className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-Binary">Non-Binary</option>
                          <option value="Other">Other / Prefer not to say</option>
                        </select>
                      </div>

                      {/* Full Address */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Residential Street Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <input 
                            type="text" 
                            name="address"
                            value={profileForm.address}
                            onChange={handleInputChange}
                            disabled={!isEditMode}
                            className="pl-10 w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">City</label>
                        <input 
                          type="text" 
                          name="city"
                          value={profileForm.city}
                          onChange={handleInputChange}
                          disabled={!isEditMode}
                          className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">State / Province</label>
                        <input 
                          type="text" 
                          name="state"
                          value={profileForm.state}
                          onChange={handleInputChange}
                          disabled={!isEditMode}
                          className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
                        />
                      </div>

                      {/* Bio */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Resident Biography / Profile Bio</label>
                        <textarea 
                          rows={3}
                          name="bio"
                          value={profileForm.bio}
                          onChange={handleInputChange}
                          disabled={!isEditMode}
                          className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-50 disabled:text-neutral-500 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* --- TAB 2: UNLOCKED BADGES (CITIZEN EXCLUSIVE) --- */}
              {activeTab === 'badges' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" /> Civic Badges & Accomplishments
                    </h2>
                    <p className="text-xs text-neutral-400 font-medium">Verify reports, earn points, and climb local ranks to unlock unique elite titles.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Badge 1 */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex gap-4 transition hover:shadow-md">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center flex-shrink-0 font-bold">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-neutral-900">First Responder</h4>
                          <span className="text-[8px] bg-blue-50 border border-blue-100 px-1 py-0.5 rounded text-blue-600 font-extrabold font-mono">UNLOCKED</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">Logged your first verified municipal infraction into the ledger system.</p>
                        <span className="text-[9px] font-mono font-bold text-neutral-400 block mt-2">Earned: June 2026</span>
                      </div>
                    </div>

                    {/* Badge 2 */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex gap-4 transition hover:shadow-md">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0 font-bold">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-neutral-900">Eco Guardian</h4>
                          <span className="text-[8px] bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded text-emerald-600 font-extrabold font-mono">UNLOCKED</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">Reported 3 or more high-severity sanitation or waste dump incidents.</p>
                        <span className="text-[9px] font-mono font-bold text-neutral-400 block mt-2">Earned: June 2026</span>
                      </div>
                    </div>

                    {/* Badge 3 */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex gap-4 transition hover:shadow-md opacity-60 relative group">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-400 border border-neutral-200 flex items-center justify-center flex-shrink-0 font-bold">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-neutral-400">Validator Elite</h4>
                          <span className="text-[8px] bg-neutral-200 border border-neutral-300 px-1 py-0.5 rounded text-neutral-500 font-extrabold font-mono">LOCKED</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">Sustain 15 consecutive upvotes or status confirmations from city officers.</p>
                        <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-blue-600 h-full w-[40%]" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-neutral-400 block mt-1">Progress: 6 / 15 validations</span>
                      </div>
                    </div>

                    {/* Badge 4 */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex gap-4 transition hover:shadow-md opacity-60">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-400 border border-neutral-200 flex items-center justify-center flex-shrink-0 font-bold">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-neutral-400">Sustained Watch</h4>
                          <span className="text-[8px] bg-neutral-200 border border-neutral-300 px-1 py-0.5 rounded text-neutral-500 font-extrabold font-mono">LOCKED</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">Maintain daily active civic monitoring streams for 30 consecutive days.</p>
                        <span className="text-[9px] font-mono font-bold text-neutral-400 block mt-2">Requirement: 30 days streak</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 3: MY SUBMISSIONS (CITIZEN REPORTING DATA) --- */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">Your Civic Infraction Submissions</h2>
                    <p className="text-xs text-neutral-400 font-medium">Detailed log of all city safety infraction reports dispatched under your UID.</p>
                  </div>

                  <div className="space-y-4">
                    {citizenIssues.length === 0 ? (
                      <div className="text-center py-12 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
                        <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-neutral-700">No active reports found</h4>
                        <p className="text-[11px] text-neutral-400 max-w-xs mx-auto mt-0.5">Submit municipal hazards, water leakages, or electrical outages via the main portal.</p>
                      </div>
                    ) : (
                      citizenIssues.map((issue) => (
                        <div key={issue.id} className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div className="flex gap-4 items-start sm:items-center">
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0">
                              {issue.imageUrl ? (
                                <img src={issue.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                  <ShieldAlert className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-neutral-900">{issue.title}</h4>
                                <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold ${
                                  issue.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-neutral-200 text-neutral-700'
                                }`}>{issue.severity}</span>
                              </div>
                              <p className="text-[11px] text-neutral-500 max-w-md mt-1">{issue.description}</p>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-semibold font-mono mt-2">
                                <span>ID: {issue.id}</span>
                                <span>•</span>
                                <span className="text-blue-600">UPVOTES: {issue.upvotes}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              issue.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                              issue.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {issue.status}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium font-mono mt-1">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* --- TAB 4: PERFORMANCE METRICS (OFFICER EXCLUSIVE) --- */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Department Performance Analytics</h2>
                      <p className="text-xs text-neutral-400 font-medium">KPI evaluation matrices generated from prompt updates and response SLAs.</p>
                    </div>
                    <button
                      onClick={() => {
                        toast.success('Department Report generated. Check Downloads directory.');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition"
                    >
                      <FileText className="w-3.5 h-3.5" /> Generate Department SLA Report
                    </button>
                  </div>

                  {/* Performance stats grids */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Assigned Workloads</span>
                      <h3 className="text-2xl font-extrabold text-neutral-800">{officerStats.casesAssigned}</h3>
                      <p className="text-[10px] text-neutral-500 mt-1">Pending active dispatches</p>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Total Cleanups Done</span>
                      <h3 className="text-2xl font-extrabold text-emerald-600">{officerStats.casesResolved}</h3>
                      <p className="text-[10px] text-neutral-500 mt-1">Incidents verified & resolved</p>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">SLA Benchmark Met</span>
                      <h3 className="text-2xl font-extrabold text-blue-600">{officerStats.slaMet}</h3>
                      <p className="text-[10px] text-neutral-500 mt-1">Target turnaround within 48h</p>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Resident Feedback Rating</span>
                      <h3 className="text-2xl font-extrabold text-amber-600">{officerStats.averageRating}</h3>
                      <p className="text-[10px] text-neutral-500 mt-1">Score from completed resolutions</p>
                    </div>
                  </div>

                  {/* Activity ledger block */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">Response SLA Audit Timeline</h3>
                    <div className="relative border-l border-neutral-200 pl-4 space-y-4">
                      <div className="relative">
                        <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                        <p className="text-[11px] font-bold text-neutral-800">Pothole Clearance: Sector A-4</p>
                        <p className="text-[10px] text-neutral-400 font-medium">SLA Resolution time: 14 hours (Target 24 hours). Road relaid successfully.</p>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">Resolved June 24, 2026</span>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white" />
                        <p className="text-[11px] font-bold text-neutral-800">Water Leakage Fixed: Malleshwaram 8th Main</p>
                        <p className="text-[10px] text-neutral-400 font-medium">Main valve pipe replaced. Checked pressure metrics.</p>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">Resolved June 22, 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 5: DEPARTMENT DIRECTORY (OFFICER EXCLUSIVE) --- */}
              {activeTab === 'department' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">Roads & Infrastructure Department</h2>
                    <p className="text-xs text-neutral-400 font-medium">Verify credentials and manage shifts of department officer personnel.</p>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    <div className="py-3 flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-8.5 h-8.5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">OD</div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">Officer Dev (You)</p>
                          <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono">SENIOR ROAD ENGINEER</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 rounded">ACTIVE ON DUTY</span>
                    </div>

                    <div className="py-3 flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-8.5 h-8.5 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">KS</div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">Officer Kiran Sen</p>
                          <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono">FIELD INSPECTOR</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 border border-green-200 rounded">ACTIVE ON DUTY</span>
                    </div>

                    <div className="py-3 flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-8.5 h-8.5 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">AM</div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">Officer Alok Mehta</p>
                          <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono">DISPATCH MANAGER</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 border border-neutral-200 rounded">STANDBY</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 6: USER DIRECTORY REGISTRY (ADMIN EXCLUSIVE) --- */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">User Registry Directory</h2>
                    <p className="text-xs text-neutral-400 font-medium">Super Administrator directory of platform operators, officers, and community residents.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200/80 rounded-xl overflow-hidden">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">User Name</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Registered Role</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-100 text-xs font-medium">
                        {adminUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-neutral-50/50">
                            <td className="px-4 py-3 font-semibold text-neutral-900">{u.displayName}</td>
                            <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                u.role === 'Admin' ? 'bg-red-50 text-red-700 border-red-200' :
                                u.role === 'Officer' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {/* Toggle Roles sandbox */}
                              <select
                                value={u.role}
                                onChange={(e) => handleAdminUserRoleChange(u.uid, e.target.value as any)}
                                className="bg-neutral-50 border border-neutral-200 rounded p-1 text-[11px] font-bold text-neutral-700 focus:outline-none cursor-pointer"
                              >
                                <option value="Citizen">Citizen</option>
                                <option value="Officer">Officer</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- TAB 7: SYSTEM TOGGLES (ADMIN EXCLUSIVE) --- */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">System Parameters</h2>
                    <p className="text-xs text-neutral-400 font-medium">Super Administrator dials to control dispatch engines, SLA timelines, and AI models.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Gemini settings */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-blue-600" /> Dispatch Assistant Engine
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Change deep learning neural models for verifying images and categorizing tickets.</p>
                      </div>
                      <select
                        value={systemSettings.geminiVerificationModel}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, geminiVerificationModel: e.target.value }))}
                        className="bg-white border border-neutral-200 rounded-xl p-2 text-xs font-bold text-neutral-800 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Gemini 2.0 Flash">Gemini 2.0 Flash (Default)</option>
                        <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Accuracy Focus)</option>
                        <option value="Gemini Nano">Gemini Nano (Edge Device)</option>
                      </select>
                    </div>

                    {/* Auto assign */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800">Auto-Assign Dispatch Engine</h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">AI automatically routes tickets to correct departments without manual dispatcher checks.</p>
                      </div>
                      <button
                        onClick={() => {
                          setSystemSettings(prev => ({ ...prev, autoAssignDispatch: !prev.autoAssignDispatch }));
                          toast.success('Auto-Assign rules updated.');
                        }}
                        className={`w-12 h-6.5 rounded-full p-1 transition-colors ${systemSettings.autoAssignDispatch ? 'bg-blue-600' : 'bg-neutral-300'}`}
                      >
                        <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transition-transform ${systemSettings.autoAssignDispatch ? 'translate-x-5.5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Maintenance toggle */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800">Platform Maintenance Overrides</h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Toggle maintenance mode to pause civic updates, reporting forms, or telemetry reads.</p>
                      </div>
                      <button
                        onClick={() => {
                          setSystemSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
                          toast.success('Platform state override applied.');
                        }}
                        className={`w-12 h-6.5 rounded-full p-1 transition-colors ${systemSettings.maintenanceMode ? 'bg-red-600' : 'bg-neutral-300'}`}
                      >
                        <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transition-transform ${systemSettings.maintenanceMode ? 'translate-x-5.5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 8: PREFERENCES --- */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">Notification Preferences</h2>
                    <p className="text-xs text-neutral-400 font-medium">Control the frequency and channels of critical civic emergency and report status alerts.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Email */}
                    <label className="flex items-start gap-3 p-4 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl border border-neutral-200/60 cursor-pointer transition">
                      <input 
                        type="checkbox" 
                        checked={notifications.emailAlerts}
                        onChange={(e) => setNotifications(p => ({ ...p, emailAlerts: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">Email Alerts</span>
                        <span className="text-[11px] text-neutral-500 block mt-0.5">Receive immediate notifications on email when your ticket status shifts or comments are appended.</span>
                      </div>
                    </label>

                    {/* SMS */}
                    <label className="flex items-start gap-3 p-4 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl border border-neutral-200/60 cursor-pointer transition">
                      <input 
                        type="checkbox" 
                        checked={notifications.smsAlerts}
                        onChange={(e) => setNotifications(p => ({ ...p, smsAlerts: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">SMS Notification Stream</span>
                        <span className="text-[11px] text-neutral-500 block mt-0.5">SMS text dispatched instantly for critical infrastructure damages or water cutouts in Sector A.</span>
                      </div>
                    </label>

                    {/* Digest */}
                    <label className="flex items-start gap-3 p-4 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl border border-neutral-200/60 cursor-pointer transition">
                      <input 
                        type="checkbox" 
                        checked={notifications.weeklyDigest}
                        onChange={(e) => setNotifications(p => ({ ...p, weeklyDigest: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">Weekly Sector Digest</span>
                        <span className="text-[11px] text-neutral-500 block mt-0.5">Receive a compiled report containing municipal metrics, leaderboard milestones, and reward releases.</span>
                      </div>
                    </label>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          toast.success('Notification preferences updated!');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 9: SECURITY & PASSWORD --- */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">Account Security</h2>
                    <p className="text-xs text-neutral-400 font-medium">Verify credentials, configure strong secrets, and handle deletion parameters.</p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 max-w-md">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Current Secret Password</label>
                        <input 
                          type="password" 
                          value={passwordState.currentPassword}
                          onChange={(e) => setPasswordState(p => ({ ...p, currentPassword: e.target.value }))}
                          className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="••••••••••••"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">New Security Password</label>
                        <input 
                          type="password" 
                          value={passwordState.newPassword}
                          onChange={(e) => setPasswordState(p => ({ ...p, newPassword: e.target.value }))}
                          className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Minimum 8 characters"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                        <input 
                          type="password" 
                          value={passwordState.confirmPassword}
                          onChange={(e) => setPasswordState(p => ({ ...p, confirmPassword: e.target.value }))}
                          className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Re-type new password"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          Update Account Secret
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="pt-6 border-t border-red-100">
                    <div className="bg-red-50/50 border border-red-200 rounded-xl p-5 max-w-2xl">
                      <h4 className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" /> Account Termination Request
                      </h4>
                      <p className="text-[11px] text-red-700 leading-relaxed">
                        Requesting account termination permanently deletes all civic impact rewards, accumulated verification XP, and locks future infraction submissions. This process is fully GDPR/CCPA compliant.
                      </p>
                      <button
                        onClick={handleDeleteAccountRequest}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Request Deletion of All Account Data
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Avatar Upload Modal presets */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAvatarModal(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
            >
              <h3 className="text-sm font-bold text-neutral-900 mb-2">Select Community Avatar Preset</h3>
              <p className="text-xs text-neutral-400 font-medium mb-4">Choose a high-resolution identity photo to display across the city activity feed.</p>
              
              <div className="grid grid-cols-3 gap-4">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectAvatarPreset(preset)}
                    className="relative rounded-xl overflow-hidden aspect-square border-2 border-transparent hover:border-blue-500 focus:outline-none transition group"
                  >
                    <img src={preset} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
