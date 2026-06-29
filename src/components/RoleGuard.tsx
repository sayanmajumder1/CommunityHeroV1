import React from 'react';
import { useStore } from '../store';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('Citizen' | 'Officer' | 'Admin' | 'Guest')[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const user = useStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
