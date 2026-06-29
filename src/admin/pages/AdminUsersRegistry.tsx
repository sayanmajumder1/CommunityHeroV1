import React, { useState, useEffect, useCallback } from 'react';
import { useStore, UserProfile } from '../../store';
import { Users, Award, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminUsersRegistry() {
  // -------- STORE --------
  const user = useStore((state) => state.user);
  const users = useStore((state) => state.users);
  const updateUserRole = useStore((state) => state.updateUserRole);
  const deleteUser = useStore((state) => state.deleteUser);
  const fetchUsers = useStore((state) => state.fetchUsers); // ✅ Added
  const isFirebaseSession = useStore((state) => state.isFirebaseSession);

  // -------- LOCAL STATE --------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // -------- FETCH USERS ON MOUNT --------
  const loadUsers = useCallback(async (showToast = false) => {
    if (!isFirebaseSession) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await fetchUsers();
      if (showToast) toast.success('User list refreshed');
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err?.message || 'Could not load user data');
      if (showToast) toast.error('Failed to refresh user list');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, isFirebaseSession]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // -------- ROLE UPDATE --------
  const handleUpdateRole = async (uid: string, newRole: 'Citizen' | 'Officer' | 'Admin') => {
    const targetUser = users.find(u => u.uid === uid);
    if (!targetUser) {
      toast.error('User not found');
      return;
    }
    if (updatingId) return; // prevent concurrent updates

    setUpdatingId(uid);
    try {
      const departmentId = newRole === 'Officer' ? 'dept-1' : undefined;
      await updateUserRole(uid, newRole, departmentId);
      toast.success(`${targetUser.displayName} is now ${newRole}`);
      // Refresh the list after update
      await loadUsers(true);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error?.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  // -------- DELETE USER --------
  const handleDeleteUser = async (uid: string) => {
    const targetUser = users.find(u => u.uid === uid);
    if (!targetUser) {
      toast.error('User not found');
      return;
    }
    if (deletingId) return;

    if (!window.confirm(`Are you sure you want to delete ${targetUser.displayName}? This cannot be undone.`)) return;

    setDeletingId(uid);
    try {
      await deleteUser(uid);
      toast.success(`User deleted: ${targetUser.displayName}`);
      // Refresh the list after deletion
      await loadUsers(true);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  // -------- GUARD: Only Admins --------
  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
        <div className="text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Access restricted to Administrators</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6 text-left font-sans" id="admin-users-registry">
      
      {/* HEADER & REFRESH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">User Directory & IAM Core</h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Configure Identity and Access Management (IAM) controls, roles, and authorization keys.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-200">
            IAM Records: <span className="text-emerald-600 font-extrabold">{users.length} active roles</span>
          </div>
          <button
            onClick={() => loadUsers(true)}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs text-red-600 font-bold">{error}</span>
          <button
            onClick={() => loadUsers(true)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-xl transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Loading user registry...</p>
        </div>
      ) : (
        /* USER TABLE */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-medium">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-slate-500 uppercase font-black tracking-widest text-[10px]">User Details</th>
                  <th className="px-6 py-4 text-slate-500 uppercase font-black tracking-widest text-[10px]">Role Status</th>
                  <th className="px-6 py-4 text-slate-500 uppercase font-black tracking-widest text-[10px]">Contributions</th>
                  <th className="px-6 py-4 text-slate-500 uppercase font-black tracking-widest text-[10px]">Permissions Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((rUser) => {
                  const isUpdating = updatingId === rUser.uid;
                  const isDeleting = deletingId === rUser.uid;

                  return (
                    <tr key={rUser.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-900 text-sm">
                            {(rUser.displayName || rUser.email || 'Civic Hero').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{rUser.displayName || rUser.email || 'Civic Hero'}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rUser.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase
                          ${rUser.role === 'Admin' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                            rUser.role === 'Officer' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 
                            'bg-slate-50 text-slate-600'}`}>
                          {rUser.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rUser.role === 'Citizen' ? (
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className="text-slate-700 font-bold">{rUser.points ?? 0} XP</span>
                            <span className="text-[10px] text-slate-400 font-bold">(Lv.{rUser.level ?? 1})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold">Internal Staff</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 flex-wrap">
                          {rUser.role !== 'Citizen' && (
                            <button
                              onClick={() => handleUpdateRole(rUser.uid, 'Citizen')}
                              disabled={isUpdating || isDeleting}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wide rounded cursor-pointer disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Make Citizen'}
                            </button>
                          )}
                          {rUser.role !== 'Officer' && (
                            <button
                              onClick={() => handleUpdateRole(rUser.uid, 'Officer')}
                              disabled={isUpdating || isDeleting}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold text-[10px] uppercase tracking-wide rounded cursor-pointer disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Make Officer'}
                            </button>
                          )}
                          {rUser.role !== 'Admin' && (
                            <button
                              onClick={() => handleUpdateRole(rUser.uid, 'Admin')}
                              disabled={isUpdating || isDeleting}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wide rounded cursor-pointer disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Make Admin'}
                            </button>
                          )}
                          {rUser.uid !== user?.uid && (
                            <button
                              onClick={() => handleDeleteUser(rUser.uid)}
                              disabled={isDeleting || isUpdating}
                              className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer disabled:opacity-50"
                              title="Delete Account"
                            >
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}