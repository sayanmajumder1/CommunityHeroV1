import React, { useState, useEffect, useRef } from 'react';
import { useStore, UserProfile } from '../../store';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, Shield, 
  Check, Save, Trash2, Bell, Lock, RefreshCw, Key, ShieldAlert, Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OfficerProfile() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
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
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    departmentId: 'Roads & Infrastructure'
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.displayName || '',
        phone: user.phone || '98765 43210',
        address: user.address || 'Civil Lines Operations Building',
        city: user.city || 'Bengaluru',
        state: user.state || 'Karnataka',
        country: user.country || 'India',
        dateOfBirth: user.dateOfBirth || '1988-03-24',
        gender: user.gender || 'Male',
        bio: user.bio || 'Assigned Officer for Municipal Ward 4. Roadways, potholes and structural maintenance dispatch supervisor.',
        profilePhoto: user.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        departmentId: user.departmentId || 'Roads & Infrastructure'
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      const updatedUser: UserProfile = {
        ...user,
        displayName: profileForm.fullName,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country,
        dateOfBirth: profileForm.dateOfBirth,
        gender: profileForm.gender,
        bio: profileForm.bio,
        profilePhoto: profileForm.profilePhoto,
        departmentId: profileForm.departmentId
      };

      setUser(updatedUser);
      setIsSaving(false);
      setIsEditMode(false);
      toast.success('Officer credentials saved successfully!');
    }, 1000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword) {
      toast.error('All credential fields are required');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    toast.success('Officer system passcode updated');
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 text-left font-sans" id="officer-profile-view">
      
      {/* Identity block */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-4 text-left">
          <div 
            className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition relative"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src={profileForm.profilePhoto} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
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
            <h2 className="text-md font-bold text-slate-900 leading-tight">{profileForm.fullName}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                {user.role} Console
              </span>
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                {profileForm.departmentId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-sm">
          <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Active SLA Metric</span>
          <h3 className="text-xl font-black text-emerald-600">98.4%</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Resolutions within SLA</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-sm">
          <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Average Rating</span>
          <h3 className="text-xl font-black text-emerald-600">4.8 / 5.0</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Citizen feedback scores</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-left shadow-sm">
          <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Assigned Cases</span>
          <h3 className="text-xl font-black text-slate-900">Zone 4</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Roadways & Sanitation</p>
        </div>
      </div>

      {/* Details settings form */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Operations Profile Details</h3>
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="text-[11px] font-black text-emerald-600 hover:underline cursor-pointer"
            >
              Modify Details
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditMode(false)} className="text-[11px] font-semibold text-slate-500 cursor-pointer">Cancel</button>
              <button onClick={handleSaveProfile} className="text-[11px] font-black text-emerald-600 cursor-pointer">Save</button>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={profileForm.fullName}
                onChange={handleInputChange}
                disabled={!isEditMode}
                className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-900 disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Department</label>
                <input
                  type="text"
                  name="departmentId"
                  value={profileForm.departmentId}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Supervisor Bio</label>
              <textarea
                name="bio"
                rows={2}
                value={profileForm.bio}
                onChange={handleInputChange}
                disabled={!isEditMode}
                className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-900 disabled:opacity-60 resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Security settings form */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>System Passcode</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Current Passcode</label>
            <input
              type="password"
              value={passwordState.currentPassword}
              onChange={e => setPasswordState(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">New Passcode</label>
            <input
              type="password"
              value={passwordState.newPassword}
              onChange={e => setPasswordState(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Confirm New Passcode</label>
            <input
              type="password"
              value={passwordState.confirmPassword}
              onChange={e => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full text-xs font-semibold border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-wider uppercase rounded-xl transition cursor-pointer"
          >
            Modify System Passcode
          </button>
        </form>
      </div>

    </div>
  );
}
