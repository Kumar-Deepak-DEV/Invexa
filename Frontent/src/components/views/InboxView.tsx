import React, { useState, useMemo } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  Inbox,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Search,
  CheckCheck,
  Filter,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  Archive,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { SwipeableNotificationItem } from '../notifications/SwipeableNotificationItem';
import { NotificationItem } from '../../types';

export const InboxView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationRead,
    deleteNotification,
    deleteMultipleNotifications,
    clearAllNotifications,
    toggleSaveNotification,
    setActiveView
  } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'critical' | 'saved' | 'success' | 'info'>('all');
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(notifications[0]?.id || null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      if (activeTab === 'unread' && n.read) return false;
      if (activeTab === 'critical' && n.type !== 'danger' && n.type !== 'warning') return false;
      if (activeTab === 'saved' && !n.saved) return false;
      if (activeTab === 'success' && n.type !== 'success') return false;
      if (activeTab === 'info' && n.type !== 'info') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMsg = n.message.toLowerCase().includes(q);
        const matchesType = n.type.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesType) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const activeSelectedNotif = useMemo(() => {
    return notifications.find(n => n.id === selectedNotifId) || filteredNotifications[0] || null;
  }, [notifications, selectedNotifId, filteredNotifications]);

  // Counts
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.type === 'danger' || n.type === 'warning').length;
  const savedCount = notifications.filter(n => n.saved).length;

  // Multi-select handlers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    deleteMultipleNotifications(selectedIds);
    setSelectedIds([]);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    setSelectedNotifId(n.id);
    if (!n.read) {
      markNotificationRead(n.id);
    }
  };

  const handleJumpToModule = (link: string) => {
    if (activeSelectedNotif && !activeSelectedNotif.read) {
      markNotificationRead(activeSelectedNotif.id);
    }
    setActiveView(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notification Inbox</h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized hub for inventory alerts, fulfillment logs, safety reorders, and stock movements.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="btn btn-secondary text-xs flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4 text-blue-600" />
                <span>Mark All Read</span>
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Counter Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div
            onClick={() => setActiveTab('all')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'all'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/10'
                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Alerts</span>
              <Bell className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalCount}</div>
          </div>

          <div
            onClick={() => setActiveTab('unread')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'unread'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/10'
                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700">Unread</span>
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-700 mt-1">{unreadCount}</div>
          </div>

          <div
            onClick={() => setActiveTab('critical')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'critical'
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10'
                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700">Critical & Warnings</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-rose-700 mt-1">{criticalCount}</div>
          </div>

          <div
            onClick={() => setActiveTab('saved')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'saved'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10'
                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">Saved for Later</span>
              <Bookmark className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-700 mt-1">{savedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Inbox Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filters & Swipeable Notification List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Controls Bar: Search & Category Filter Pills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search alerts by keyword, SKU, or type..."
                className="form-control pl-10 text-xs"
                style={{ paddingLeft: '2.5rem' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({totalCount})
              </button>

              <button
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeTab === 'unread'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Unread ({unreadCount})
              </button>

              <button
                onClick={() => setActiveTab('critical')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeTab === 'critical'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Critical ({criticalCount})
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeTab === 'saved'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Saved ({savedCount})
              </button>

              <button
                onClick={() => setActiveTab('success')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeTab === 'success'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed
              </button>

              <button
                onClick={() => setActiveTab('info')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeTab === 'info'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Info
              </button>
            </div>
          </div>

          {/* Swipe Left Instruction Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-100/80 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-medium">
                💡 <span className="font-bold">Swipe gesture enabled:</span> Swipe any notification card <strong className="font-bold underline decoration-rose-400">left</strong> to reveal the delete button.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-bold text-blue-600 font-mono">
              ⟵ Swipe left to delete
            </span>
          </div>

          {/* Notification List Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No notifications matched "${searchQuery}". Try clearing search filters.`
                    : activeTab !== 'all'
                    ? `No notifications currently in the "${activeTab}" category.`
                    : 'Your notification inbox is completely empty. New stock events will appear here automatically.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="btn btn-secondary text-xs mt-2"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map(notification => {
                  const isSelected = activeSelectedNotif?.id === notification.id;
                  const isChecked = selectedIds.includes(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={`relative flex items-center transition-all ${
                        isSelected ? 'ring-2 ring-inset ring-blue-500/20 bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Checkbox for batch select */}
                      <div className="pl-3 py-4 flex items-center shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => handleToggleSelect(notification.id, e as unknown as React.MouseEvent)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                      </div>

                      {/* Main Swipeable Item */}
                      <div className="flex-1 min-w-0">
                        <SwipeableNotificationItem
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                          onDelete={deleteNotification}
                          onToggleRead={toggleNotificationRead}
                          onToggleSave={toggleSaveNotification}
                          showSaveOption={true}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Notification Inspector Detail Pane (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {activeSelectedNotif ? (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Detail Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activeSelectedNotif.type === 'danger' ? 'bg-rose-100 text-rose-600' :
                      activeSelectedNotif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      activeSelectedNotif.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {activeSelectedNotif.type === 'danger' && <AlertOctagon className="w-5 h-5" />}
                      {activeSelectedNotif.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                      {activeSelectedNotif.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                      {activeSelectedNotif.type === 'info' && <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        activeSelectedNotif.type === 'danger' ? 'bg-rose-100 text-rose-700' :
                        activeSelectedNotif.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                        activeSelectedNotif.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {activeSelectedNotif.type}
                      </span>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        Received {activeSelectedNotif.time}
                      </div>
                    </div>
                  </div>

                  {/* Top Action Icons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSaveNotification(activeSelectedNotif.id)}
                      className={`p-2 rounded-xl border transition-all ${
                        activeSelectedNotif.saved
                          ? 'bg-amber-50 border-amber-300 text-amber-600'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                      title={activeSelectedNotif.saved ? 'Saved in Inbox' : 'Save for later'}
                    >
                      {activeSelectedNotif.saved ? (
                        <BookmarkCheck className="w-4 h-4 fill-amber-500" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => toggleNotificationRead(activeSelectedNotif.id)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 transition-all"
                      title={activeSelectedNotif.read ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {activeSelectedNotif.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        deleteNotification(activeSelectedNotif.id);
                        setSelectedNotifId(null);
                      }}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {activeSelectedNotif.title}
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                    {activeSelectedNotif.message}
                  </div>
                </div>

                {/* Context Metadata */}
                <div className="rounded-xl border border-slate-200/80 p-3.5 space-y-2.5 text-xs bg-slate-50/40">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Notification ID:</span>
                    <span className="font-mono font-bold text-slate-800">{activeSelectedNotif.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Status:</span>
                    <span className="font-semibold text-slate-800">
                      {activeSelectedNotif.read ? 'Read / Acknowledged' : 'Unread'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Target Module:</span>
                    <span className="font-semibold text-blue-600 capitalize">{activeSelectedNotif.link}</span>
                  </div>
                </div>

                {/* Primary CTA button to linked module */}
                {activeSelectedNotif.link && (
                  <button
                    onClick={() => handleJumpToModule(activeSelectedNotif.link)}
                    className="w-full btn btn-primary flex items-center justify-center gap-2 py-3 text-xs font-bold shadow-md shadow-blue-500/10"
                  >
                    <span>View in {activeSelectedNotif.link.toUpperCase()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Notification Selected</h4>
                <p className="text-[11px] text-slate-400">
                  Click any notification on the left to inspect its full operational details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Clear All Notifications?</h3>
              <p className="text-xs text-slate-500">
                This will permanently delete all {notifications.length} notification items from your inbox. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllNotifications();
                  setShowClearConfirm(false);
                  setSelectedNotifId(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
