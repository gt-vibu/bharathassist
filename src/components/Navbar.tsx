import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  Home, 
  Search, 
  UserCheck, 
  Bot, 
  FileCheck, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ShieldAlert,
  Info,
  Mail
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export default function Navbar({ activeTab, setActiveTab, onOpenAuth }: NavbarProps) {
  const { user, logout, notifications, markNotificationRead } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, guestOk: true },
    { id: 'schemes', label: 'Schemes', icon: Search, guestOk: true },
    { id: 'eligibility', label: 'Eligibility Checker', icon: UserCheck, guestOk: false },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, guestOk: false },
    { id: 'documents', label: 'Document Verification', icon: FileCheck, guestOk: false },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, guestOk: false },
    { id: 'about', label: 'About', icon: Info, guestOk: true },
    { id: 'contact', label: 'Contact', icon: Mail, guestOk: true },
  ];

  const unreadNotifs = notifications.filter(n => !n.isRead);

  const handleTabClick = (tabId: string, guestOk: boolean) => {
    if (!guestOk && !user) {
      onOpenAuth('login');
    } else {
      setActiveTab(tabId);
    }
    setIsOpen(false);
  };

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div 
          onClick={() => setActiveTab('home')} 
          className="flex cursor-pointer items-center space-x-3"
          id="navbar-logo-container"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md">
            <span className="font-display text-lg font-bold text-slate-950">B</span>
            <div className="absolute -inset-0.5 rounded-xl bg-orange-500 opacity-20 blur-sm animate-pulse-glow"></div>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
              Bharat<span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Assist AI</span>
            </h1>
            <p className="hidden text-[9px] font-mono tracking-widest text-slate-400 uppercase sm:block">National Welfare Gateway</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden lg:flex items-center space-x-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id, item.guestOk)}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div id="navbar-actions" className="flex items-center space-x-3">
          
          {/* Notifications Alerts */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white focus:outline-none"
                id="notif-btn"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-850 bg-slate-900 p-2 shadow-2xl ring-1 ring-black ring-opacity-5"
                  id="notif-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                    <h3 className="font-display text-xs font-semibold text-white">Notifications ({unreadNotifs.length})</h3>
                    {unreadNotifs.length > 0 && (
                      <button 
                        onClick={() => unreadNotifs.forEach(n => markNotificationRead(n.id))}
                        className="text-[10px] text-amber-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">No recent alerts or updates</p>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationRead(n.id)}
                          className={`cursor-pointer rounded-lg px-3 py-2 text-xs transition hover:bg-slate-850 ${!n.isRead ? 'bg-slate-850/50 border-l-2 border-amber-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-200">{n.title}</span>
                            <span className="text-[9px] text-slate-500">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="mt-1 text-slate-400 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center space-x-2">
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="hidden sm:flex items-center space-x-1 rounded-full bg-red-950/40 border border-red-800/40 px-2.5 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-900/30"
                  id="nav-admin-panel-btn"
                >
                  <ShieldAlert className="h-3 w-3" />
                  <span>Admin Panel</span>
                </button>
              )}
              <div 
                onClick={() => setActiveTab('dashboard')}
                className="flex cursor-pointer items-center space-x-2 rounded-lg p-1 hover:bg-slate-900"
                id="nav-profile-summary"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-amber-400 ring-1 ring-slate-700">
                  {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-medium text-white max-w-[100px] truncate">{user.fullName}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
                title="Sign Out"
                id="nav-logout-btn"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white"
                id="nav-login-trigger"
              >
                Login
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-orange-400"
                id="nav-signup-trigger"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            id="mobile-menu-toggle"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-t border-slate-900 bg-slate-950 px-2 pt-2 pb-4 lg:hidden" id="mobile-nav">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id, item.guestOk)}
                  className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {user?.role === 'admin' && (
              <button
                onClick={() => handleTabClick('admin', false)}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition text-red-400 hover:bg-red-950/20`}
              >
                <ShieldAlert className="h-5 w-5" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
