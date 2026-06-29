import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useStore } from '../store';
import { ShieldAlert } from 'lucide-react';
import LoadingState from './LoadingState';

interface ProtectedRouteProps {
  allowedRoles: ('Citizen' | 'Officer' | 'Admin' | 'Guest')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);

  if (!isInitialized) {
    return <LoadingState message="Restoring active session..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-neutral-200 rounded-3xl shadow-sm max-w-lg mx-auto my-12 font-sans" id="access-control-block">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 mb-5 animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">Access Restrictions Enforced</h3>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm leading-relaxed">
          Your current credentials level (<strong>{user.role}</strong>) do not carry the security clearance required for this portal.
        </p>
        <div className="mt-6">
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <Outlet />;
}
