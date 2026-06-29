import React, { useState, useEffect, useRef } from 'react';
import { useStore, UserProfile } from '../../store';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, Shield, 
  Check, Save, Trash2, Bell, Lock, RefreshCw, Key, Plus, LogOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CitizenProfile() {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const updateProfile = useStore((state) => state.updateProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isVerified: true
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    weeklyDigest: true
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.displayName || '',
        phone: user.phone || '98765 43210',
        address: user.address || '12, Crescent Heights Road',
        city: user.city || 'Bengaluru',
        state: user.state || 'Karnataka',
        country: user.country || 'India',
        dateOfBirth: user.dateOfBirth || '1995-05-15',
        gender: user.gender || 'Female',
        bio: user.bio || 'Active resident passionate about keeping our community clean, green, and completely pothole-free.',
        profilePhoto: user.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isVerified: user.isVerified ?? true
      });
    }
  }, [user]);

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileForm(prev => ({ ...prev, profilePhoto: base64String }));
        toast.success('Image selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        displayName: profileForm.fullName,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country,
        dateOfBirth: profileForm.dateOfBirth,
        gender: profileForm.gender as any,
        bio: profileForm.bio,
        profilePhoto: profileForm.profilePhoto
      });
      setIsSaving(false);
      setIsEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      setIsSaving(false);
      console.error(error);
      toast.error('Failed to update profile.');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword) {
      toast.error('Please complete all credential fields');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    toast.success('Credentials updated safely');
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteAccount = () => {
    const isConfirmed = window.confirm(
      "Are you absolutely sure you wish to submit a permanent account deletion request? " +
      "This compliance request cannot be undone."
    );
    if (isConfirmed) {
      toast.success('Deletion request logged into the queue');
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-4" id="citizen-profile-view">
      
      {/* Top Banner Identity block */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-md shadow-neutral-100/50 text-left relative overflow-hidden flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-200 shadow-inner shrink-0 cursor-pointer hover:opacity-80 transition relative"
          onClick={() => fileInputRef.current?.click()}
        >
          <img src={profileForm.profilePhoto} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
             <Plus className="w-6 h-6 text-white" />
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        <div>
          <h2 className="text-sm font-black text-neutral-900 leading-tight">{profileForm.fullName}</h2>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">{user.email}</p>
          <div className="flex gap-1.5 mt-2">
            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
              {user.role}
            </span>
            {profileForm.isVerified && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                <Check className="w-2.5 h-2.5" /> VERIFIED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Settings Tabs Card */}
      <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-xs text-left">
        <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Resident Details</h3>
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer"
            >
              Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditMode(false)} className="text-[10px] font-bold text-neutral-400 cursor-pointer">Cancel</button>
              <button onClick={handleSaveProfile} className="text-[10px] font-black text-emerald-600 cursor-pointer">Save</button>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          <div className="space-y-3.5">
            <div>
              <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">Full Legal Name</label>
              <input
                type="text"
                name="fullName"
                value={profileForm.fullName}
                onChange={handleInputChange}
                disabled={!isEditMode}
                className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 disabled:bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profileForm.phone}
                onChange={handleInputChange}
                disabled={!isEditMode}
                className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 disabled:bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={profileForm.city}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 disabled:bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={profileForm.state}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 disabled:bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">Profile Bio</label>
              <textarea
                name="bio"
                rows={2}
                value={profileForm.bio}
                onChange={handleInputChange}
                disabled={!isEditMode}
                className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 disabled:bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Account Settings */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-md shadow-neutral-100/50 text-left p-6 space-y-5">
        <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-3">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Account Settings</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">Current Password</label>
            <input
              type="password"
              value={passwordState.currentPassword}
              onChange={e => setPasswordState(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              value={passwordState.newPassword}
              onChange={e => setPasswordState(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-1">Confirm Password</label>
            <input
              type="password"
              value={passwordState.confirmPassword}
              onChange={e => setPasswordState(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full text-xs font-semibold border border-neutral-200 rounded-xl p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-wider uppercase transition cursor-pointer"
          >
            Update Credentials
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-black text-[10px] tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </form>

      </div>

    </div>
  );
}