import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  CheckCheck,
  Sparkles,
  Flame,
  RotateCcw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export interface NavbarProps {
  onOpenMobileSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'challenge' | 'streak' | 'revision';
  path: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'daily-challenge',
    title: 'Daily Challenge Ready',
    description: "Today's medium graph problem is live. Solve it to keep climbing.",
    time: 'Just now',
    read: false,
    type: 'challenge',
    path: '/daily-challenge',
  },
  {
    id: 'revision-reminder',
    title: 'Spaced Repetition Due',
    description: 'Review your bookmarked Dynamic Programming problems today.',
    time: '2h ago',
    read: false,
    type: 'revision',
    path: '/revision',
  },
  {
    id: 'streak-tip',
    title: 'Stay Consistent',
    description: 'Complete at least one problem daily to build your streak.',
    time: '1d ago',
    read: true,
    type: 'streak',
    path: '/practice',
  },
];

function getInitials(name?: string): string {
  if (!name) return 'CC';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Navbar({ onOpenMobileSidebar }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const isDark = theme === 'dark';

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === 'Escape') {
        setIsNotifOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      navigate('/practice');
      return;
    }
    navigate(`/practice?search=${encodeURIComponent(trimmed)}`);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setIsNotifOpen(false);
    navigate(item.path);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch {
      toast.error('Unable to log out right now');
    }
  };

  const renderNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'challenge':
        return <Sparkles className="h-4 w-4 text-[#22C55E]" />;
      case 'revision':
        return <RotateCcw className="h-4 w-4 text-[#38BDF8]" />;
      case 'streak':
        return <Flame className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-[#30363D] dark:bg-[#161B22]/90 sm:px-6">
      {/* Left: Mobile Hamburger + Search Bar */}
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-[#30363D] dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-[#F0F6FC] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems, topics, patterns..."
            aria-label="Search problems and topics"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-16 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#22C55E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E] dark:focus:border-[#22C55E] dark:focus:bg-[#0D1117]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:text-[#8B949E] dark:hover:text-[#F0F6FC]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#8B949E] sm:inline-block">
              Ctrl K
            </kbd>
          )}
        </form>
      </div>

      {/* Right: Theme Toggle, Notifications, User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-[#22C55E]/50 hover:text-[#22C55E] dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#8B949E] dark:hover:border-[#22C55E]/50 dark:hover:text-[#22C55E]"
        >
          <motion.span
            key={theme}
            initial={{ rotate: -20, opacity: 0, scale: 0.85 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </motion.span>
        </button>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen((prev) => !prev);
              setIsUserMenuOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={isNotifOpen}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-[#38BDF8]/50 hover:text-[#38BDF8] dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#8B949E] dark:hover:border-[#38BDF8]/50 dark:hover:text-[#38BDF8]"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#22C55E] px-1 text-[10px] font-bold text-[#0D1117]">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-[#30363D] dark:bg-[#1C2128]"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-[#30363D]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[11px] font-semibold text-[#22C55E]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#38BDF8] hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-[#30363D]/70">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-[#161B22]/80 ${
                        !item.read ? 'bg-[#22C55E]/[0.04]' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#0D1117]">
                        {renderNotifIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-[#F0F6FC]">
                            {item.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-slate-400 dark:text-[#8B949E]">
                            {item.time}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-[#8B949E]">
                          {item.description}
                        </p>
                      </div>
                      {!item.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#22C55E]" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen((prev) => !prev);
              setIsNotifOpen(false);
            }}
            aria-label="User account menu"
            aria-expanded={isUserMenuOpen}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-2.5 transition-colors hover:border-[#22C55E]/50 dark:border-[#30363D] dark:bg-[#1C2128] dark:hover:border-[#22C55E]/50"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-7 w-7 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#22C55E] to-[#38BDF8] text-xs font-bold text-[#0D1117]">
                {getInitials(user?.name)}
              </div>
            )}
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-800 dark:text-[#F0F6FC] sm:inline">
              {user?.name || 'Climber'}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 dark:text-[#8B949E] ${
                isUserMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-[#30363D] dark:bg-[#1C2128]"
              >
                <div className="border-b border-slate-200 px-4 py-3 dark:border-[#30363D]">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                    {user?.name || 'CodeClimb User'}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-[#8B949E]">
                    {user?.email || 'user@codeclimb.dev'}
                  </p>
                </div>

                <div className="p-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-[#F0F6FC] dark:hover:bg-[#161B22]"
                  >
                    <User className="h-4 w-4 text-slate-500 dark:text-[#8B949E]" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-[#F0F6FC] dark:hover:bg-[#161B22]"
                  >
                    <Settings className="h-4 w-4 text-slate-500 dark:text-[#8B949E]" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-slate-200 p-1.5 dark:border-[#30363D]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
