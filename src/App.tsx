import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';
import SplashScreen from './components/SplashScreen';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingChatbot from './components/FloatingChatbot';
import { useStore, useRehydrateStore } from './store';
import ErrorBoundary from './components/ErrorBoundary';

// Layout imports
import CitizenLayout from './citizen/CitizenLayout';
import OfficerLayout from './officer/OfficerLayout';
import AdminLayout from './admin/AdminLayout';
import LandingPage from './pages/LandingPage';

// Citizen Page imports
import CitizenHome from './citizen/pages/CitizenHome';
import CitizenMapView from './citizen/pages/CitizenMapView';
import CitizenReportsList from './citizen/pages/CitizenReportsList';
import CitizenCommunity from './citizen/pages/CitizenCommunity';
import CitizenProfile from './citizen/pages/CitizenProfile';
import CitizenReportIssue from './citizen/pages/CitizenReportIssue';
import CitizenRewards from './citizen/pages/CitizenRewards';

// Officer Page imports
import OfficerDashboard from './officer/pages/OfficerDashboard';
import OfficerIssuesList from './officer/pages/OfficerIssuesList';
import OfficerMapView from './officer/pages/OfficerMapView';
import OfficerProfile from './officer/pages/OfficerProfile';
import OfficerVerificationQueue from './officer/pages/OfficerVerificationQueue';
import OfficerAnnouncements from './officer/pages/OfficerAnnouncements';
import OfficerMessages from './officer/pages/OfficerMessages';

// Admin Page imports
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminAnalyticsCenter from './admin/pages/AdminAnalyticsCenter';
import AdminDepartmentsList from './admin/pages/AdminDepartmentsList';
import AdminIssuesList from './admin/pages/AdminIssuesList';
import AdminProfile from './admin/pages/AdminProfile';
import AdminSettings from './admin/pages/AdminSettings';
import AdminUsersRegistry from './admin/pages/AdminUsersRegistry';
import AdminMessages from './admin/pages/AdminMessages';

// ============================================
// COMPONENT: Auth Redirect Handler (Prevents loops)
// ============================================
const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isFirebaseSession, isInitialized } = useStore();

  useEffect(() => {
    // Wait for store to initialize
    if (!isInitialized) return;

    // If no user and not on landing page, redirect to landing
    if (!user && location.pathname !== '/') {
      navigate('/', { replace: true });
      return;
    }

    // If user exists but is not authenticated (guest) and trying to access protected routes
    if (user && user.role === 'Guest' && location.pathname !== '/') {
      // Guest can only access citizen routes
      const isCitizenRoute = location.pathname.startsWith('/citizen');
      if (!isCitizenRoute && location.pathname !== '/') {
        navigate('/citizen/home', { replace: true });
      }
      return;
    }

    // If user is authenticated but on landing page, redirect to their dashboard
    if (user && location.pathname === '/' && user.role !== 'Guest') {
      const dashboardPath = getDashboardPath(user.role);
      navigate(dashboardPath, { replace: true });
      return;
    }

    // If user is a guest on landing page, allow it
    if (user && user.role === 'Guest' && location.pathname === '/') {
      // Allow guest to stay on landing page
      return;
    }

    // If user is authenticated but accessing wrong role route, redirect
    if (user && user.role !== 'Guest') {
      const currentPath = location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin');
      const isOfficerRoute = currentPath.startsWith('/officer');
      const isCitizenRoute = currentPath.startsWith('/citizen');

      if (user.role === 'Admin' && !isAdminRoute && currentPath !== '/') {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      if (user.role === 'Officer' && !isOfficerRoute && currentPath !== '/') {
        navigate('/officer/dashboard', { replace: true });
        return;
      }
      if (user.role === 'Citizen' && !isCitizenRoute && currentPath !== '/') {
        navigate('/citizen/home', { replace: true });
        return;
      }
    }
  }, [user, isFirebaseSession, isInitialized, location.pathname, navigate]);

  return <>{children}</>;
};

// ============================================
// HELPER: Get Dashboard Path
// ============================================
const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'Admin': return '/admin/dashboard';
    case 'Officer': return '/officer/dashboard';
    case 'Citizen': return '/citizen/home';
    case 'Guest': return '/citizen/home';
    default: return '/';
  }
};

// ============================================
// COMPONENT: App (The Main Event)
// ============================================
export default function App() {
  // -------- STATE --------
  const [loading, setLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // -------- STORE --------
  const { 
    user, 
    isFirebaseSession, 
    isInitialized,
    setIsInitialized,
    fetchIssues, 
    fetchNotifications,
    refreshAllData,
    logout 
  } = useStore();

  // -------- REHYDRATE STORE ON MOUNT --------
  const rehydrated = useRehydrateStore();

  // -------- SPLASH SCREEN LOGIC (Fixed) --------
  useEffect(() => {
    // Check if we need to show splash
    const splashShown = sessionStorage.getItem('splashShown');
    const splashTimestamp = sessionStorage.getItem('splashTimestamp');
    const now = Date.now();

    // If splash was shown more than 30 minutes ago, show it again
    const shouldShowSplash = !splashShown || 
                            !splashTimestamp || 
                            (now - parseInt(splashTimestamp, 10)) > 30 * 60 * 1000;

    if (shouldShowSplash) {
      // Show splash
      sessionStorage.setItem('splashShown', 'true');
      sessionStorage.setItem('splashTimestamp', now.toString());
      setLoading(true);
    } else {
      // Skip splash
      setLoading(false);
      setSplashComplete(true);
    }
  }, []);

  // -------- AUTH POLLING (Fixed) --------
  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only start polling if user is authenticated (not guest)
    if (user && isFirebaseSession && user.role !== 'Guest') {
      // Initial fetch
      refreshAllData().catch(console.error);

      // Poll every 5 seconds (increased from 4 to reduce server load)
      pollIntervalRef.current = setInterval(() => {
        // Only fetch if we still have a valid session
        const currentUser = useStore.getState().user;
        if (currentUser && useStore.getState().isFirebaseSession) {
          fetchIssues().catch(console.error);
          fetchNotifications().catch(console.error);
        } else {
          // If session is invalid, stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }, 5000);
    } else {
      // Guest or no user - clear polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [user, isFirebaseSession, fetchIssues, fetchNotifications, refreshAllData]);

  // -------- START POLLING ON AUTH CHANGE --------
  useEffect(() => {
    startPolling();
    
    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [startPolling]);

  // -------- LISTEN FOR LOGOUT EVENTS (Cross-tab sync) --------
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If user was removed from localStorage in another tab
      if (e.key === 'community_hero_user' && e.newValue === null) {
        // Logout locally
        logout();
        // Force a hard redirect to landing
        window.location.href = '/';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logout]);

  // -------- SET INITIALIZED FLAG --------
  useEffect(() => {
    if (!isInitialized && !loading) {
      setIsInitialized(true);
    }
  }, [isInitialized, loading, setIsInitialized]);

  // -------- SPLASH SCREEN HANDLER --------
  const handleSplashComplete = useCallback(() => {
    setLoading(false);
    setSplashComplete(true);
    // After splash, ensure store is rehydrated
    if (rehydrated) {
      setIsInitialized(true);
    }
  }, [rehydrated, setIsInitialized]);

  // -------- LOADING STATE --------
  if (loading) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // -------- RENDER --------
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* Auth Redirect Handler prevents infinite loops */}
        <AuthRedirectHandler>
          {user && user.role !== 'Guest' && <FloatingChatbot />}
          <div id="app-container">
            <Routes>
              {/* LANDING PAGE (Public) */}
              <Route 
                path="/" 
                element={
                  user && user.role !== 'Guest' ? 
                    <Navigate to={getDashboardPath(user.role)} replace /> : 
                    <LandingPage />
                } 
              />

              {/* CITIZEN ROUTES (Allows Guest) */}
              <Route element={<ProtectedRoute allowedRoles={['Citizen', 'Officer', 'Admin', 'Guest']} />}>
                <Route path="/citizen" element={<CitizenLayout />}>
                  <Route path="home" element={<CitizenHome />} />
                  <Route path="map" element={<CitizenMapView />} />
                  <Route path="reports" element={<CitizenReportsList />} />
                  <Route path="community" element={<CitizenCommunity />} />
                  <Route path="profile" element={<CitizenProfile />} />
                  <Route path="report" element={<CitizenReportIssue />} />
                  <Route path="rewards" element={<CitizenRewards />} />
                  <Route path="" element={<Navigate to="/citizen/home" replace />} />
                </Route>
              </Route>

              {/* OFFICER ROUTES */}
              <Route element={<ProtectedRoute allowedRoles={['Officer', 'Admin']} />}>
                <Route path="/officer" element={<OfficerLayout />}>
                  <Route path="dashboard" element={<OfficerDashboard />} />
                  <Route path="issues" element={<OfficerIssuesList />} />
                  <Route path="map" element={<OfficerMapView />} />
                  <Route path="profile" element={<OfficerProfile />} />
                  <Route path="verification" element={<OfficerVerificationQueue />} />
                  <Route path="announcements" element={<OfficerAnnouncements />} />
                  <Route path="messages" element={<OfficerMessages />} />
                  <Route path="" element={<Navigate to="/officer/dashboard" replace />} />
                </Route>
              </Route>

              {/* ADMIN ROUTES */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalyticsCenter />} />
                  <Route path="departments" element={<AdminDepartmentsList />} />
                  <Route path="issues" element={<AdminIssuesList />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="users" element={<AdminUsersRegistry />} />
                  <Route path="messages" element={<AdminMessages />} />
                  <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
              </Route>

              {/* CATCH-ALL: Redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthRedirectHandler>
      </BrowserRouter>
    </ErrorBoundary>
  );
}