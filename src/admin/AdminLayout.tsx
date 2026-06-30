import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useStore } from '../store';
import { 
  Home, User, LogOut, ChevronLeft, ChevronRight, Menu, X,
  Shield, Users, Settings, BarChart2, Cpu, Database, Command, Clock, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const location = useLocation();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    logout();
    toast.success('Signed out of Administrator Portal Workspace');
  };

  const adminNav = [
    { name: 'Command Center', href: '/admin/dashboard', icon: Home, badge: 'SYS' },
    { name: 'Issue Registry', href: '/admin/issues', icon: BarChart2, badge: 'GIS' },
    { name: 'User Management', href: '/admin/users', icon: Users, badge: 'AUTH' },
    { name: 'Department Intelligence', href: '/admin/departments', icon: Cpu, badge: 'DEPT' },
    { name: 'Analytics Center', href: '/admin/analytics', icon: BarChart2, badge: 'SLA' },
    { name: 'Officer Message Desk', href: '/admin/messages', icon: MessageSquare, badge: 'COMMS' },
    { name: 'Audit Logs', href: '/admin/profile', icon: Database, badge: 'LOGS' },
    { name: 'System Settings', href: '/admin/settings', icon: Settings, badge: 'CONFIG' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans" id="admin-portal-root">
      
      {/* ================= SIDEBAR ================= */}
      <aside 
        className={`hidden md:flex flex-col border-r shrink-0 transition-all duration-300 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-white border-slate-200`}
      >
        {/* Header Branding block */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-emerald-600 p-2 rounded-xl text-white flex-shrink-0">
              <Shield className="w-5 h-5 font-bold" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-black tracking-widest text-slate-900 uppercase">
                ADMIN <span className="text-emerald-600">CORE</span>
              </span>
            )}
          </div>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* System Health details */}

        {/* Admin Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {adminNav.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold tracking-wide ${
                    isActive ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer block */}
        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Close Session</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>



            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentTime} UTC</span>
            </div>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-3">
            
            {/* Profile widget */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 focus:outline-none cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald-600 border border-emerald-700 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                  {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'A'}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 text-left">
                        <p className="text-xs font-extrabold text-slate-900">{user?.displayName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                          SUPERVISORY SECURITY CLEARANCE
                        </span>
                      </div>

                      <div className="p-1 space-y-0.5 text-left">
                        <Link 
                          to="/admin/profile" 
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Admin Profile</span>
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Close Portal Session</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Slideout Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 p-5 flex flex-col justify-between md:hidden"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-md font-black tracking-widest text-slate-900 uppercase flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span>ADMIN OPS</span>
                  </span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {adminNav.map(item => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                          isActive 
                            ? 'bg-emerald-600 text-white' 
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <item.icon className="w-5 h-5 text-slate-400" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-xs font-bold text-red-600 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
