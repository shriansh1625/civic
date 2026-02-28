/**
 * CivicLens AI — Main Dashboard Layout with Sidebar
 */

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Search, MessageSquare, Bell, Settings,
  LogOut, Menu, X, Shield, ChevronRight, Zap, PanelLeftClose, PanelLeft, Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/app/schemes', icon: Search, label: 'Scheme Explorer' },
  { path: '/app/chat', icon: MessageSquare, label: 'AI Assistant', badge: 'AI' },
  { path: '/app/alerts', icon: Bell, label: 'Alerts Center' },
  { path: '/app/admin', icon: Settings, label: 'Crawl Control' },
];

const pageTitles = {
  '/app': 'Dashboard',
  '/app/schemes': 'Scheme Explorer',
  '/app/chat': 'AI Assistant',
  '/app/alerts': 'Alerts Center',
  '/app/admin': 'Crawl Control',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
    <div className="flex h-screen overflow-hidden bg-navy-700 noise-bg">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? 'w-[4.5rem]' : 'w-72'}
        bg-navy-800/90 backdrop-blur-2xl
        border-r border-white/[0.06] flex flex-col
        transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 ${collapsed ? 'px-4 justify-center' : 'px-6'} py-5 border-b border-white/[0.06]`}>
          <div className="w-10 h-10 rounded-xl saffron-gradient flex items-center justify-center shadow-lg shadow-saffron-500/20 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display font-bold text-lg text-white tracking-tight">CivicLens</h1>
              <p className="text-[10px] text-saffron-400 font-semibold uppercase tracking-widest">AI Intelligence</p>
            </div>
          )}
          <button className="lg:hidden ml-auto text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 py-4 border-b border-white/[0.06] animate-fade-in">
            <div className="glass-card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-500/20 to-saffron-600/10 flex items-center justify-center text-lg flex-shrink-0">
                {userTypeEmoji[user?.user_type] || '🇮🇳'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'User'}</p>
                <p className={`text-xs font-medium capitalize ${userTypeColors[user?.user_type] || 'text-gray-400'}`}>
                  {user?.user_type || 'Citizen'} • {user?.state || 'India'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, end, badge }) => (
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
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-saffron-500/20 text-saffron-400">
                      {badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle (desktop) */}
        <div className="hidden lg:block px-3 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-all duration-200 text-xs"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* AMD Badge */}
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-3 border-t border-white/[0.06]`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-3 py-2 rounded-lg bg-green-500/[0.08] border border-green-500/15`}>
            <Zap className="w-4 h-4 text-green-400 flex-shrink-0" />
            {!collapsed && <span className="text-xs text-green-400 font-medium">AMD EPYC Powered</span>}
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 ${collapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/[0.08] transition-all w-full`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-6 py-3.5 border-b border-white/[0.06] bg-navy-800/60 backdrop-blur-xl">
          <button className="lg:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-gray-500">CivicLens</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-white font-medium">{currentPage}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-medium">Live</span>
            </div>

            <span className="hidden sm:block text-xs text-gray-500 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>

            <div className="w-8 h-8 rounded-full saffron-gradient flex items-center justify-center text-sm font-bold text-white shadow-md shadow-saffron-500/20 ring-2 ring-saffron-500/10">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
