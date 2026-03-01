/**
 * CivicLens AI — Main Dashboard Layout with Premium Sidebar & Header
 * Enhanced with Framer Motion page transitions, glassmorphism, and microinteractions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAIActivity } from '../../hooks/useAIActivity';
import { trackingAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import AgentActivityPanel from '../ui/AgentActivityPanel';
import AgentLogFeed from '../ui/AgentLogFeed';
import {
  LayoutDashboard, Search, MessageSquare, Bell, Settings,
  LogOut, Menu, X, Shield, ChevronRight, Zap, PanelLeftClose, PanelLeft, Sparkles,
  FileUp, BellRing, Check, Brain
} from 'lucide-react';

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/app/schemes', icon: Search, label: 'Scheme Explorer' },
  { path: '/app/chat', icon: MessageSquare, label: 'AI Assistant', badge: 'AI' },
  { path: '/app/validator', icon: FileUp, label: 'Doc Validator', badge: 'NEW' },
  { path: '/app/alerts', icon: Bell, label: 'Alerts Center' },
  { path: '/app/admin', icon: Settings, label: 'Crawl Control' },
];

const pageTitles = {
  '/app': 'Dashboard',
  '/app/schemes': 'Scheme Explorer',
  '/app/chat': 'AI Assistant',
  '/app/validator': 'Document Validator',
  '/app/alerts': 'Alerts Center',
  '/app/admin': 'Crawl Control',
};

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { isProcessing, activeCount } = useAIActivity();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Fetch notification count periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await trackingAPI.getNotificationCount();
        setNotifCount(res.data.unread_count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (notifOpen) {
      (async () => {
        try {
          const res = await trackingAPI.getNotifications(false, 10);
          setNotifications(res.data || []);
        } catch {}
      })();
    }
  }, [notifOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markNotifRead = async (id) => {
    try {
      await trackingAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllNotifsRead = async () => {
    try {
      await trackingAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setNotifCount(0);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userTypeColors = {
    student: 'text-blue-400',
    farmer: 'text-green-400',
    startup: 'text-purple-400',
    msme: 'text-yellow-400',
    ngo: 'text-pink-400',
    citizen: 'text-saffron-400',
  };

  const userTypeEmoji = {
    student: '🎓', farmer: '🌾', startup: '🚀', msme: '🏭', ngo: '💚', citizen: '🇮🇳', admin: '⚡',
  };

  const currentPage = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className={`flex h-screen overflow-hidden bg-navy-700 noise-bg ${isProcessing ? 'neural-aura-active' : ''}`}>
      {/* Animated Background Orbs — 3-orb cinematic system */}
      <div className="animated-bg">
        <div className="animated-bg-orb3" />
      </div>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? 'w-[4.5rem]' : 'w-72'}
        bg-navy-800/80 backdrop-blur-3xl
        border-r border-white/[0.06] flex flex-col
        transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Cinematic sidebar gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-saffron-500/[0.03] via-transparent to-blue-500/[0.02] pointer-events-none rounded-r-2xl" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-saffron-500/20 via-white/[0.04] to-transparent pointer-events-none" />

        {/* Logo */}
        <div className={`relative flex items-center gap-3 ${collapsed ? 'px-4 justify-center' : 'px-6'} py-5 border-b border-white/[0.06]`}>
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl saffron-gradient flex items-center justify-center shadow-lg shadow-saffron-500/30 flex-shrink-0 ring-2 ring-saffron-500/10"
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-display font-bold text-lg text-white tracking-tight">CivicLens</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-saffron-500 animate-pulse" />
                <p className="text-[10px] text-saffron-400 font-semibold uppercase tracking-[0.15em]">AI Intelligence</p>
              </div>
            </motion.div>
          )}
          <button className="lg:hidden ml-auto text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative px-4 py-4 border-b border-white/[0.06]"
          >
            <div className="glass-card-premium p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500/20 to-saffron-600/10 flex items-center justify-center text-lg flex-shrink-0 ring-1 ring-saffron-500/10">
                {userTypeEmoji[user?.user_type] || '🇮🇳'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'User'}</p>
                <p className={`text-xs font-medium capitalize ${userTypeColors[user?.user_type] || 'text-gray-400'}`}>
                  {user?.user_type || 'Citizen'} • {user?.state || 'India'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, end, badge }, index) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 ${collapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${isActive
                  ? 'bg-saffron-500/15 text-saffron-400 border border-saffron-500/20 shadow-sm shadow-saffron-500/5 nav-active'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`relative ${isActive ? '' : 'group-hover:scale-110 transition-transform duration-200'}`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isActive && (
                      <div className="absolute -inset-1 bg-saffron-500/20 rounded-lg blur-sm" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="relative z-10">{label}</span>
                      {badge && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                          badge === 'NEW' 
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' 
                            : 'bg-saffron-500/20 text-saffron-400'
                        }`}>
                          {badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle (desktop) */}
        <div className="relative hidden lg:block px-3 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-all duration-200 text-xs group"
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </motion.div>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* AMD Badge */}
        <div className={`relative ${collapsed ? 'px-2' : 'px-4'} py-3 border-t border-white/[0.06]`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-3 py-2.5 rounded-xl bg-gradient-to-r from-green-500/[0.08] to-emerald-500/[0.04] border border-green-500/15`}>
            <Zap className="w-4 h-4 text-green-400 flex-shrink-0 animate-sparkle" />
            {!collapsed && <span className="text-xs text-green-400 font-medium tracking-wide">AMD EPYC Powered</span>}
          </div>
        </div>

        {/* Logout */}
        <div className="relative px-3 py-4 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 ${collapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/[0.08] transition-all w-full group`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar — cinematic frosted header */}
        <header className="flex items-center gap-4 px-6 py-3.5 border-b border-white/[0.06] bg-navy-800/60 backdrop-blur-2xl relative">
          {/* Subtle bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-saffron-500/10 to-transparent" />
          
          <button className="lg:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-gray-500">CivicLens</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-white font-medium">{currentPage}</span>
          </div>

          {/* AI Powered badge — upgrades to AI Core Active when agents are processing */}
          <div className={`hidden lg:flex ${isProcessing ? 'ai-core-active' : 'ai-indicator'} ml-3`}>
            {isProcessing ? (
              <>
                <Brain className="w-3 h-3 animate-pulse" />
                <span>AI Core Active</span>
                {activeCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-saffron-500/30 text-[9px] flex items-center justify-center font-bold">{activeCount}</span>
                )}
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>AI Powered</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">Live</span>
            </div>

            <span className="hidden sm:block text-xs text-gray-500 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.12] transition-colors"
              >
                {notifCount > 0 ? (
                  <BellRing className="w-4.5 h-4.5 text-saffron-400" />
                ) : (
                  <Bell className="w-4.5 h-4.5 text-gray-400" />
                )}
                {notifCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-saffron-500 text-[10px] text-white font-bold flex items-center justify-center shadow-lg shadow-saffron-500/30"
                  >
                    {notifCount > 9 ? '9+' : notifCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-12 w-80 glass-card border border-white/[0.08] rounded-2xl shadow-elevated overflow-hidden z-[60]"
                  >
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      {notifCount > 0 && (
                        <button onClick={markAllNotifsRead} className="text-[11px] text-saffron-400 hover:text-saffron-300 font-medium transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => !n.read && markNotifRead(n.id)}
                            className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer ${
                              !n.read ? 'bg-saffron-500/[0.03]' : 'opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                !n.read ? 'bg-saffron-500 shadow-sm shadow-saffron-500/50' : 'bg-gray-600'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">{n.title}</p>
                                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-gray-600 mt-1">{new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              {!n.read && (
                                <Check className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
                      <NavLink
                        to="/app/alerts"
                        onClick={() => setNotifOpen(false)}
                        className="text-[11px] text-saffron-400 hover:text-saffron-300 font-medium flex items-center gap-1 transition-colors"
                      >
                        View all alerts <ChevronRight className="w-3 h-3" />
                      </NavLink>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              whileHover={{ scale: 1.08 }}
              className="w-9 h-9 rounded-full saffron-gradient flex items-center justify-center text-sm font-bold text-white shadow-md shadow-saffron-500/25 ring-2 ring-saffron-500/15 cursor-default"
            >
              {user?.full_name?.charAt(0) || 'U'}
            </motion.div>
          </div>
        </header>

        {/* Page Content with Framer Motion cinematic transitions */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={pageTransition.initial}
                animate={pageTransition.animate}
                exit={pageTransition.exit}
                transition={pageTransition.transition}
                className="page-transition"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── AI Intelligence Aura — Floating Panels ── */}
      <AgentActivityPanel />
      <AgentLogFeed />
    </div>
  );
}
