import React, { useState, useEffect, useRef } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  Menu,
  Search,
  Building2,
  ChevronDown,
  Check,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  QrCode,
  RotateCcw,
  Sparkles,
  MapPin,
  Inbox,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { SwipeableNotificationItem } from '../notifications/SwipeableNotificationItem';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu = () => {} }) => {
  const {
    warehouses,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationRead,
    deleteNotification,
    toggleSaveNotification,
    setActiveView,
    setIsCommandPaletteOpen,
    currentUser,
    resetAllData
  } = useStockSense();

  const [selectedWH, setSelectedWH] = useState(warehouses[0]?.name || 'Main Warehouse');
  const [isWHOpen, setIsWHOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const whDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const currentWarehouseObj = warehouses.find(w => w.name === selectedWH) || warehouses[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (whDropdownRef.current && !whDropdownRef.current.contains(e.target as Node)) {
        setIsWHOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = (id: string, link: string) => {
    markNotificationRead(id);
    setIsNotifOpen(false);
    setActiveView(link);
  };

  const handleOpenInbox = () => {
    setIsNotifOpen(false);
    setActiveView('inbox');
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left Section: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Trigger for Command Palette) */}
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          className="relative flex-1 max-w-md flex items-center bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 rounded-xl px-3.5 py-2 cursor-pointer transition-all text-slate-400 group shadow-2xs"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-2.5 shrink-0 transition-colors" />
          <span className="text-xs text-slate-500 font-medium truncate flex-1">
            Search SKU, batch, product, or order...
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white rounded-md border border-slate-300 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section: Warehouse selector, Quick Action, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Custom Modern Warehouse Switcher Dropdown */}
        <div className="relative hidden md:block" ref={whDropdownRef}>
          <button
            onClick={() => setIsWHOpen(!isWHOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs ${
              isWHOpen
                ? 'bg-blue-50/90 border-blue-300 text-blue-900 ring-2 ring-blue-500/10'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80 text-[10px]">
              {currentWarehouseObj?.code || 'WH-001'}
            </span>
            <span className="truncate max-w-[150px] font-semibold text-slate-800">
              {currentWarehouseObj?.shortName || currentWarehouseObj?.name || 'Main Warehouse'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isWHOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Menu */}
          {isWHOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Select Facility</span>
                <span className="text-blue-600 font-semibold normal-case font-mono">{warehouses.length} Active Hubs</span>
              </div>
              <div className="py-1.5 space-y-1 max-h-64 overflow-y-auto">
                {warehouses.map(w => {
                  const isSelected = w.name === selectedWH;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWH(w.name);
                        setIsWHOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-all ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {w.code}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">{w.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            {w.city} • {w.type}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={resetAllData}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all text-xs font-semibold shadow-2xs"
          title="Reset to Initial Enterprise Seed Data"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demo</span>
        </button>

        {/* Barcode Quick Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/60 text-blue-700 text-xs font-semibold transition-all shadow-2xs"
        >
          <QrCode className="w-4 h-4 text-blue-600" />
          <span>Quick Scan</span>
        </button>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all ${
              isNotifOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100'
            }`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Card */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={handleOpenInbox}
                    className="text-[11px] font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    title="Open Full Inbox"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Inbox</span>
                  </button>
                </div>
              </div>

              {/* Swipe Cue Subheader */}
              <div className="px-3.5 py-1.5 bg-blue-50/60 border-b border-blue-100/60 flex items-center justify-between text-[10px] text-blue-700 font-medium">
                <span>👈 Swipe left on any card to delete</span>
                <span className="text-[9px] font-mono text-blue-500">{notifications.length} alerts</span>
              </div>

              {/* Notification List with Swipe-to-Delete */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">No active notifications</p>
                    <p className="text-[10px] text-slate-400">Your notifications inbox is completely caught up.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <SwipeableNotificationItem
                      key={n.id}
                      notification={n}
                      compact={true}
                      onClick={() => handleNotifClick(n.id, n.link)}
                      onDelete={deleteNotification}
                      onToggleRead={toggleNotificationRead}
                      onToggleSave={toggleSaveNotification}
                      showSaveOption={true}
                    />
                  ))
                )}
              </div>

              {/* Dropdown Footer CTA */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleOpenInbox}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-blue-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Inbox className="w-4 h-4" />
                  <span>View All in Notification Inbox</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Pill */}
        <div
          onClick={() => setActiveView('profile')}
          className="flex items-center gap-2 pl-1 cursor-pointer select-none group"
          title="Open Profile Settings"
        >
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={currentUser?.fullName || currentUser?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100 group-hover:ring-blue-300 shadow-2xs transition-all"
          />
        </div>
      </div>
    </header>
  );
};
