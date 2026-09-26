import React from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  LayoutDashboard,
  Inbox,
  Package,
  Layers,
  Sliders,
  ArrowDownLeft,
  Truck,
  ArrowLeftRight,
  History,
  Building2,
  Tags,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Globe
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed: externalCollapsed,
  setCollapsed: externalSetCollapsed,
  mobileOpen: externalMobileOpen,
  setMobileOpen: externalSetMobileOpen
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = React.useState(false);

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = externalSetCollapsed || setInternalCollapsed;
  const mobileOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const setMobileOpen = externalSetMobileOpen || setInternalMobileOpen;

  const { activeView, setActiveView, getKPIs, currentUser, logout, notifications } = useStockSense();
  const kpis = getKPIs();
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const navItems = [
    {
      section: 'Overview',
      items: [
        { id: 'landing', label: 'Landing Page', icon: Globe },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'inbox',
          label: 'Inbox & Alerts',
          icon: Inbox,
          badge: unreadNotifs > 0 ? `${unreadNotifs}` : undefined,
          badgeColor: 'bg-rose-100 text-rose-700 font-bold'
        }
      ]
    },
    {
      section: 'Products & Stock',
      items: [
        { id: 'products', label: 'Products Master', icon: Package, badge: kpis.totalProducts },
        { id: 'stock', label: 'Stock Matrix', icon: Layers },
        { id: 'categories', label: 'Categories', icon: Tags }
      ]
    },
    {
      section: 'Operations',
      items: [
        {
          id: 'receipts',
          label: 'Receipts (Inbound)',
          icon: ArrowDownLeft,
          badge: kpis.pendingReceipts > 0 ? `${kpis.pendingReceipts}` : undefined,
          badgeColor: 'bg-blue-100 text-blue-700'
        },
        {
          id: 'deliveries',
          label: 'Delivery Orders (Out)',
          icon: Truck,
          badge: kpis.pendingDeliveries > 0 ? `${kpis.pendingDeliveries}` : undefined,
          badgeColor: 'bg-indigo-100 text-indigo-700'
        },
        {
          id: 'transfers',
          label: 'Transfers & Adjustments',
          icon: ArrowLeftRight
        }
      ]
    },
    {
      section: 'Audit & Network',
      items: [
        { id: 'history', label: 'Move History & Ledger', icon: History },
        { id: 'warehouses', label: 'Warehouses & Locations', icon: Building2 }
      ]
    }
  ];

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white select-none">
      {/* Brand Header */}
      <div className={`h-20 border-b border-slate-100 flex items-center shrink-0 ${
        collapsed ? 'flex-col justify-center px-2' : 'justify-between px-4'
      }`}>
        {collapsed ? (
          /* Collapsed Brand Header */
          <div className="flex flex-col items-center justify-center gap-1 w-full">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-sm p-1 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-center shrink-0"
              title="INVEXA — Go to Dashboard"
            >
              <img
                src="/invexa_logo.png"
                alt="INVEXA"
                className="w-full h-full object-contain"
              />
            </button>
            <button
              onClick={() => setCollapsed(false)}
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mt-0.5"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Expanded Brand Header */
          <>
            <div
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-3 cursor-pointer group min-w-0"
            >
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-sm p-1 group-hover:border-blue-400 group-hover:shadow-md transition-all flex items-center justify-center shrink-0">
                <img
                  src="/invexa_logo.png"
                  alt="INVEXA Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-display font-black text-lg text-slate-900 tracking-tight leading-none block">
                  INVEXA
                </span>
                <span className="text-[10px] font-extrabold text-blue-600 tracking-wider uppercase block mt-1">
                  Smart Inventory
                </span>
              </div>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.section}
              </div>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl text-xs font-semibold transition-all group ${
                    collapsed
                      ? 'justify-center p-3'
                      : 'px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                  }`} />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between text-left truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : (item.badgeColor || 'bg-slate-100 text-slate-600')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer User Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
        <div
          onClick={() => handleNavClick('profile')}
          className={`flex items-center gap-3 p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs ${
            collapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.fullName}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-100 shrink-0"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate block">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-slate-400 truncate block font-medium">
                {currentUser.role}
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer (Slide-over) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 animate-fade-in">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar (Naturally adjacent flex item, NEVER overlaps main content) */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen bg-white border-r border-slate-200/90 shrink-0 transition-all duration-300 z-30 shadow-xs ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
