import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  Code2,
  Calendar,
  RotateCcw,
  Trophy,
  BarChart3,
  Bookmark,
  User,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'DSA Roadmap', path: '/roadmap', icon: Map },
  { label: 'Practice Arena', path: '/practice', icon: Code2 },
  { label: 'Daily Challenge', path: '/daily-challenge', icon: Calendar },
  { label: 'Revision Mode', path: '/revision', icon: RotateCcw },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'My Performance', path: '/performance', icon: BarChart3 },
  { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
];

const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function CodeClimbMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="33"
        height="33"
        rx="9"
        className="fill-[#22C55E]/10 stroke-[#22C55E]/35"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 13L6 18L10.5 23"
        stroke="#22C55E"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.5 13L30 18L25.5 23"
        stroke="#22C55E"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 23.5L18 11.5L23.5 23.5"
        stroke="#22C55E"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4 17.2L18 11.5L20.6 17.2"
        stroke="#38BDF8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getInitials(name?: string): string {
  if (!name) return 'CC';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      onCloseMobile();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderNavLink = (item: NavItem, collapsed: boolean, isMobileDrawer: boolean) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onCloseMobile}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          [
            'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            collapsed ? 'justify-center px-2' : '',
            isActive
              ? 'bg-[#22C55E]/15 text-[#22C55E] shadow-sm ring-1 ring-[#22C55E]/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-[#F0F6FC]',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId={isMobileDrawer ? 'sidebar-active-bar-mobile' : 'sidebar-active-bar-desktop'}
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#22C55E]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Icon
              className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                isActive
                  ? 'text-[#22C55E]'
                  : 'text-slate-500 group-hover:text-slate-800 dark:text-[#8B949E] dark:group-hover:text-[#F0F6FC]'
              }`}
            />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.16, ease: 'easeInOut' }}
                  className="truncate whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>
    );
  };

  const renderSidebarContent = (collapsed: boolean, isMobileDrawer: boolean) => (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-[#161B22] dark:text-[#F0F6FC]">
      {/* Brand header */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-slate-200 px-3 dark:border-[#30363D] ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
        >
          <CodeClimbMark className="h-8 w-8" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-col leading-none"
              >
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-[#F0F6FC]">
                  Code<span className="text-[#22C55E]">Climb</span>
                </span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-[#8B949E]">
                  DSA Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-[#F0F6FC]"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          !collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-[#F0F6FC]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {/* Expand button when collapsed on desktop/tablet */}
      {!isMobileDrawer && collapsed && (
        <div className="flex justify-center border-b border-slate-200 py-2 dark:border-[#30363D]">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#22C55E] dark:text-[#8B949E] dark:hover:bg-[#1C2128] dark:hover:text-[#22C55E]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        aria-label="Primary sidebar navigation"
        className="flex-1 space-y-6 overflow-y-auto px-2.5 py-4"
      >
        <div>
          {!collapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#8B949E]">
              Learn &amp; Practice
            </p>
          )}
          <div className="space-y-1">
            {PRIMARY_NAV_ITEMS.map((item) => renderNavLink(item, collapsed, isMobileDrawer))}
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#8B949E]">
              Account
            </p>
          )}
          <div className="space-y-1">
            {ACCOUNT_NAV_ITEMS.map((item) => renderNavLink(item, collapsed, isMobileDrawer))}
            {user?.role === 'admin' &&
              renderNavLink(
                { label: 'Admin Panel', path: '/admin', icon: Shield },
                collapsed,
                isMobileDrawer
              )}
          </div>
        </div>
      </nav>

      {/* Footer / User summary + Logout */}
      <div className="shrink-0 border-t border-slate-200 p-2.5 dark:border-[#30363D]">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-slate-100/80 px-2.5 py-2 dark:bg-[#1C2128]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/20 text-xs font-bold text-[#22C55E] ring-1 ring-[#22C55E]/30">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-[#F0F6FC]">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-[#8B949E]">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={collapsed ? 'Logout' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10 ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & tablet persistent sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 256 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="hidden h-screen shrink-0 border-r border-slate-200 bg-white dark:border-[#30363D] dark:bg-[#161B22] md:sticky md:top-0 md:flex md:flex-col"
      >
        {renderSidebarContent(isCollapsed, false)}
      </motion.aside>

      {/* Mobile overlay drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-[#30363D] dark:bg-[#161B22]"
            >
              {renderSidebarContent(false, true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
