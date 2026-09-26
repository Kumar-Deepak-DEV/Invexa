import React, { useState, useRef } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  Truck,
  Package,
  Layers,
  ArrowDownLeft
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface SwipeableNotificationItemProps {
  notification: NotificationItem;
  onClick?: () => void;
  onDelete: (id: string) => void;
  onToggleRead?: (id: string) => void;
  onToggleSave?: (id: string) => void;
  compact?: boolean;
  showSaveOption?: boolean;
}

export const SwipeableNotificationItem: React.FC<SwipeableNotificationItemProps> = ({
  notification,
  onClick,
  onDelete,
  onToggleRead,
  onToggleSave,
  compact = false,
  showSaveOption = true
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const startXRef = useRef(0);

  const MAX_REVEAL = 85; // px to reveal delete button
  const DELETE_SNAP_THRESHOLD = 35; // px threshold to snap open

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) {
      // Swiping left
      const clamped = Math.max(diff, -MAX_REVEAL - 25);
      setOffsetX(clamped);
    } else if (offsetX < 0) {
      // Swiping back right
      const clamped = Math.min(0, offsetX + diff);
      setOffsetX(clamped);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX < -DELETE_SNAP_THRESHOLD) {
      setOffsetX(-MAX_REVEAL);
    } else {
      setOffsetX(0);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startXRef.current;
    if (diff < 0) {
      const clamped = Math.max(diff, -MAX_REVEAL - 25);
      setOffsetX(clamped);
    } else if (offsetX < 0) {
      const clamped = Math.min(0, offsetX + diff);
      setOffsetX(clamped);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offsetX < -DELETE_SNAP_THRESHOLD) {
      setOffsetX(-MAX_REVEAL);
    } else {
      setOffsetX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (offsetX < -DELETE_SNAP_THRESHOLD) {
        setOffsetX(-MAX_REVEAL);
      } else {
        setOffsetX(0);
      }
    }
  };

  const triggerDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleted(true);
    setTimeout(() => {
      onDelete(notification.id);
    }, 200);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'danger':
        return <AlertOctagon className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'info':
      default:
        if (notification.icon === 'Truck') return <Truck className="w-4 h-4" />;
        if (notification.icon === 'Package') return <Package className="w-4 h-4" />;
        if (notification.icon === 'Layers') return <Layers className="w-4 h-4" />;
        if (notification.icon === 'ArrowDownLeft') return <ArrowDownLeft className="w-4 h-4" />;
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeStyle = () => {
    switch (notification.type) {
      case 'danger':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          iconBg: 'bg-rose-100 text-rose-600',
          dot: 'bg-rose-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          iconBg: 'bg-amber-100 text-amber-600',
          dot: 'bg-amber-500'
        };
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          iconBg: 'bg-emerald-100 text-emerald-600',
          dot: 'bg-emerald-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          iconBg: 'bg-blue-100 text-blue-600',
          dot: 'bg-blue-500'
        };
    }
  };

  const styles = getTypeStyle();

  if (isDeleted) {
    return (
      <div className="h-0 opacity-0 overflow-hidden transition-all duration-200" />
    );
  }

  return (
    <div className="relative overflow-hidden group select-none rounded-xl bg-slate-100">
      {/* Background Revealed Actions on Swipe Left (Only visible when user swipes left) */}
      <div
        style={{
          opacity: offsetX < -5 ? 1 : 0,
          pointerEvents: offsetX < -20 ? 'auto' : 'none',
          transition: isDragging ? 'none' : 'opacity 0.2s ease'
        }}
        className="absolute inset-y-0 right-0 w-[85px] bg-rose-600 flex items-center justify-center z-0 rounded-r-xl"
      >
        <button
          onClick={triggerDelete}
          className="w-full h-full flex flex-col items-center justify-center text-white hover:bg-rose-700 active:bg-rose-800 transition-colors gap-1 px-2 cursor-pointer"
          title="Delete Notification"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
        </button>
      </div>

      {/* Foreground Swipeable Card - 100% Solid Opaque Background */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: notification.read ? '#FAFAFA' : '#FFFFFF'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (offsetX < -10) {
            setOffsetX(0);
          } else if (onClick) {
            onClick();
          }
        }}
        className={`relative z-10 hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-start gap-3 cursor-pointer ${
          compact ? 'p-3' : 'p-4'
        }`}
      >
        {/* Severity Icon Badge */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${styles.iconBg}`}>
          {getIcon()}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {!notification.read && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 shadow-2xs" />
              )}
              <h4 className={`text-xs truncate font-bold ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                {notification.title}
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
              {notification.time}
            </span>
          </div>

          <p className={`text-xs text-slate-600 mt-1 leading-snug ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {notification.message}
          </p>

          {/* Card footer / quick tags */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${styles.bg}`}>
                {notification.type}
              </span>
              {notification.saved && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <BookmarkCheck className="w-2.5 h-2.5" />
                  Saved
                </span>
              )}
            </div>

            {/* Quick Action Tools on Hover / Desktop */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              {showSaveOption && onToggleSave && (
                <button
                  onClick={() => onToggleSave(notification.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                  title={notification.saved ? 'Remove from Saved' : 'Save for later in Inbox'}
                >
                  {notification.saved ? (
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {onToggleRead && (
                <button
                  onClick={() => onToggleRead(notification.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title={notification.read ? 'Mark as unread' : 'Mark as read'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={triggerDelete}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete notification (or swipe left)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Swipe Left Hint indicator on right edge */}
        <div className="hidden sm:flex flex-col items-center justify-center text-slate-300 group-hover:text-slate-400 pl-1 shrink-0 self-center">
          <ChevronLeft className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
