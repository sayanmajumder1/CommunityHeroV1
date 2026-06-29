import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useStore } from '../store';
import { 
  Home, Map as MapIcon, Plus, User, Bell, 
  Compass, Shield, Award, MapPin, Trophy, LogOut, CheckCircle, Flame, Sparkles, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export default function CitizenLayout() {
  const location = useLocation();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const issues = useStore((state) => state.issues);
  const auditLogs = useStore((state) => state.auditLogs);
  const dbNotifications = useStore((state) => state.notifications);
  const markNotificationRead = useStore((state) => state.markNotificationRead);

  // Compute dynamic notifications based on user's submitted issues
  const userIssues = issues.filter(i => i.reporterId === user?.uid);
  const statusAlerts = userIssues.flatMap(issue => {
    const logs = auditLogs[issue.id] || [];
    return logs.map(log => ({
      id: log.id,
      title: `Status: ${log.action}`,
      text: `Issue "${issue.title}": ${log.details}`,
      time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: !readAlertIds.includes(log.id),
      isDbNotif: false
    }));
  });

  const mappedDbNotifs = (dbNotifications || []).map(n => ({
    id: n.id,
    title: n.title,
    text: n.text,
    time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: n.unread,
    isDbNotif: true
  }));

  const alerts = [
    ...mappedDbNotifs,
    ...statusAlerts,
    { id: 'ca-welcome', title: '+50 XP Awarded!', text: 'You earned +50 XP for joining the Neighborhood Sentinel network.', time: 'System', unread: !readAlertIds.includes('ca-welcome'), isDbNotif: false }
  ];

  const handleLogout = async () => {
    logout();
    toast.success('Signed out of CommunityHero Resident Portal');
  };

  const handleClearAll = async () => {
    setReadAlertIds(alerts.map(a => a.id));
    for (const n of dbNotifications) {
      if (n.unread) {
        await markNotificationRead(n.id);
      }
    }
    toast.success('Cleared citizen notifications');
  };

  const activeAlertsCount = alerts.filter(a => a.unread).length;

  const citizenTabs = [
    { name: 'Home', href: '/citizen/home', icon: Home },
    { name: 'Map', href: '/citizen/map', icon: MapIcon },
    { name: 'Reports', href: '/citizen/reports', icon: FileText },
    { name: 'Community', href: '/citizen/community', icon: Compass },
    { name: 'Profile', href: '/citizen/profile', icon: User },
  ];

  const MobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-100/80 h-18 flex items-center justify-around px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] md:hidden">
      {citizenTabs.slice(0, 2).map((tab) => {
        const isActive = location.pathname === tab.href;
        return (
          <Link 
            key={tab.name} 
            to={tab.href} 
            className={`flex flex-col items-center justify-center w-14 h-full transition ${
              isActive ? 'text-emerald-600 scale-105 font-extrabold' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-black mt-1 uppercase tracking-wider">{tab.name}</span>
          </Link>
        );
      })}
      <Link 
        to="/citizen/report" 
        className="flex flex-col items-center justify-center -top-6 relative h-14 w-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform"
        title="Report a new civic issue"
      >
        <Plus className="w-7 h-7" />
      </Link>
      {citizenTabs.slice(2, 4).map((tab) => {
        const isActive = location.pathname === tab.href;
        return (
          <Link 
            key={tab.name} 
            to={tab.href} 
            className={`flex flex-col items-center justify-center w-14 h-full transition ${
              isActive ? 'text-emerald-600 scale-105 font-extrabold' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-black mt-1 uppercase tracking-wider">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const DesktopNav = () => (
    <nav className="hidden md:flex items-center gap-6 px-6 py-3 border-b border-neutral-100 bg-white">
      {citizenTabs.map((tab) => {
        const isActive = location.pathname === tab.href;
        return (
          <Link 
            key={tab.name} 
            to={tab.href}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition ${
              isActive ? 'bg-emerald-50 text-emerald-700' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] text-neutral-900 font-sans flex flex-col pb-20 md:pb-0" id="citizen-mobile-portal-root">
      
      {/* Friendly social top header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_0_20px_rgba(0,0,0,0.02)] h-18 flex items-center justify-between px-4 sm:px-8">
        <Link to="/citizen/home" className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-tighter text-neutral-900">
            Community<span className="text-emerald-600">Hero</span>
          </span>
        </Link>
        
        {/* DesktopNav (Desktop only) */}
        <div className="hidden md:flex items-center gap-2">
          {citizenTabs.map((tab) => {
            const isActive = location.pathname === tab.href;
            return (
              <Link 
                key={tab.name} 
                to={tab.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.name}
              </Link>
            );
          })}
        </div>

        {/* Hyperlocal location context and XP */}
        <div className="hidden sm:flex items-center gap-4">


        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Notifications dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="p-2.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-full border border-neutral-100 relative"
            >
              <Bell className="w-5 h-5" />
              {activeAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </button>

            <AnimatePresence>
              {isAlertsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white border border-neutral-200 rounded-3xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                      <span className="text-xs font-black text-neutral-800 uppercase tracking-widest">My Feed Notifications</span>
                      <button 
                        onClick={handleClearAll}
                        className="text-[10px] font-bold text-emerald-600 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
                      {alerts.map(item => (
                        <div 
                          key={item.id} 
                          onClick={async () => {
                            if (item.isDbNotif && item.unread) {
                              await markNotificationRead(item.id);
                            } else if (!item.isDbNotif && !readAlertIds.includes(item.id)) {
                              setReadAlertIds(prev => [...prev, item.id]);
                            }
                          }}
                          className={`p-4 text-left transition hover:bg-neutral-50 cursor-pointer ${item.unread ? 'bg-emerald-50/10' : ''}`}
                        >
                          <p className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{item.title}</span>
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">{item.text}</p>
                          <span className="text-[9px] text-neutral-400 font-bold block mt-1">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Link 
            to="/citizen/profile" 
            className="md:hidden p-2.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-full border border-neutral-100"
          >
            <User className="w-5 h-5" />
          </Link>

          {/* Quick Logout option for testing role switching */}
        </div>
      </header>

      {/* Main viewport */}
      <main className="flex-1 max-w-lg md:max-w-4xl mx-auto w-full px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation (Mobile only) */}
      <MobileNav />

      {/* Responsive Footer (Tablet/Desktop only) */}
      <footer className="hidden md:flex bg-white border-t border-neutral-100 py-8 px-6 items-center justify-between text-neutral-500 text-xs mt-12">
        <div className="flex items-center gap-2">
          <span className="font-black text-neutral-900">Community<span className="text-emerald-600">Hero</span></span>
        </div>
        <div className="text-center">© 2026 Community Hero. All rights reserved.</div>
        <div className="flex gap-4 font-bold">
          <Link to="/citizen/privacy" className="hover:text-emerald-600">Privacy Policy</Link>
          <Link to="/citizen/terms" className="hover:text-emerald-600">Terms</Link>
          <Link to="/citizen/support" className="hover:text-emerald-600">Support</Link>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-400">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
