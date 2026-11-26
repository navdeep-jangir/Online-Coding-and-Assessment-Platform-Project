import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import AdminRoute from '@/components/common/AdminRoute';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/utils/helpers';

export interface AdminLayoutProps {
  children?: ReactNode;
}

interface AdminNavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  description: string;
}

const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboard,
    end: true,
    description: 'Platform overview & telemetry',
  },
  {
    label: 'Problems',
    to: '/admin/problems',
    icon: Code2,
    description: 'Manage DSA problems & test cases',
  },
  {
    label: 'Users',
    to: '/admin/users',
    icon: Users,
    description: 'User accounts, roles & XP',
  },
  {
    label: 'Modules',
    to: '/admin/modules',
    icon: Layers,
    description: 'Curriculum modules & topics',
  },
  {
    label: 'Notes',
    to: '/admin/notes',
    icon: BookOpen,
    description: 'Topic notes & code guides',
  },
  {
    label: 'Reports',
    to: '/admin/reports',
    icon: BarChart3,
    description: 'Analytics, exports & audit logs',
  },
] as const;

function resolveSectionTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname === '/admin' || pathname === '/admin/') {
    return {
      title: 'Admin Dashboard',
      subtitle: 'Real-time overview of users, submissions, and problem metrics',
    };
  }
  if (pathname.startsWith('/admin/problems/new')) {
    return {
      title: 'Create Problem',
      subtitle: 'Author problem statement, starter templates, and validated test cases',
    };
  }
  if (pathname.includes('/admin/problems/') && pathname.endsWith('/edit')) {
    return {
      title: 'Edit Problem',
      subtitle: 'Update problem specification, test suite, and publication status',
    };
  }
  const matched = ADMIN_NAV_ITEMS.find((item) => !item.end && pathname.startsWith(item.to));
  if (matched) {
    return { title: matched.label, subtitle: matched.description };
  }
  return {
    title: 'Admin Console',
    subtitle: 'CodeClimb administration workspace',
  };
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const section = resolveSectionTitle(location.pathname);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderSidebarContent = (collapsed: boolean, onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-[#161B22] text-[#F0F6FC]">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-[#30363D] px-4">
        <Link
          to="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-bold tracking-tight text-[#F0F6FC]">
                  CodeClimb
                </span>
                <span className="rounded-md border border-[#22C55E]/30 bg-[#22C55E]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#22C55E]">
                  Admin
                </span>
              </div>
              <p className="truncate text-[11px] text-[#8B949E]">Control Center</p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded-lg p-1.5 text-[#8B949E] transition hover:bg-[#1C2128] hover:text-[#F0F6FC] lg:inline-flex"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-[#8B949E] transition hover:bg-[#1C2128] hover:text-[#F0F6FC] lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        {!collapsed && (
          <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8B949E]">
            Management
          </p>
        )}
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'border border-[#22C55E]/30 bg-[#22C55E]/12 text-[#22C55E] shadow-sm'
                    : 'border border-transparent text-[#8B949E] hover:bg-[#1C2128] hover:text-[#F0F6FC]',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#22C55E]' : 'text-[#8B949E] group-hover:text-[#F0F6FC]'
                    )}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom footer actions */}
      <div className="border-t border-[#30363D] p-3 space-y-2">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          title={collapsed ? 'Back to App' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-xl border border-[#30363D] bg-[#0D1117]/70 px-3 py-2 text-xs font-medium text-[#8B949E] transition hover:border-[#484F58] hover:text-[#F0F6FC]',
            collapsed && 'justify-center px-2'
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Back to Student App</span>}
        </Link>

        <div
          className={cn(
            'flex items-center gap-2.5 rounded-xl border border-[#30363D] bg-[#1C2128] p-2.5',
            collapsed && 'justify-center p-2'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/15 text-xs font-bold text-[#22C55E]">
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#F0F6FC]">
                {user?.name || 'Admin'}
              </p>
              <p className="truncate text-[11px] text-[#8B949E]">{user?.email || ''}</p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-[#8B949E] transition hover:bg-[#0D1117] hover:text-[#EF4444] disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminRoute>
      <div className="flex min-h-screen bg-[#0D1117] text-[#F0F6FC]">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden shrink-0 border-r border-[#30363D] transition-all duration-200 lg:block',
            isSidebarCollapsed ? 'w-[76px]' : 'w-64'
          )}
        >
          <div className="sticky top-0 h-screen">
            {renderSidebarContent(isSidebarCollapsed)}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-[#30363D] shadow-2xl">
              {renderSidebarContent(false, () => setIsMobileMenuOpen(false))}
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#30363D] bg-[#0D1117]/90 px-4 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#30363D] bg-[#1C2128] text-[#F0F6FC] transition hover:border-[#484F58] lg:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight text-[#F0F6FC] sm:text-lg">
                  {section.title}
                </h1>
                <p className="hidden truncate text-xs text-[#8B949E] sm:block">
                  {section.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1 text-xs font-medium text-[#22C55E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
                Admin Mode
              </span>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mx-auto w-full max-w-7xl"
            >
              {children ?? <Outlet />}
            </motion.div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}

export default AdminLayout;
