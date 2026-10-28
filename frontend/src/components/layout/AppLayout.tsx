import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { LogoMark } from '@/components/brand/LogoMark';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { BackendStatusBadge } from '@/components/common/BackendStatusBadge';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  FlaskConical,
  Building2,
  CalendarCheck,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Bell,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  maxWidth?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  maxWidth = 'max-w-7xl',
}) => {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar collapse state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('labledger_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('labledger_sidebar_collapsed', String(isCollapsed));
    } catch {
      // Ignore storage errors
    }
  }, [isCollapsed]);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const highestRole = user?.roles[0]?.replace('ROLE_', '') || 'USER';
  const isStaff = user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT');
  const isTechOrStaff = user?.roles.some(
    (r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT' || r === 'ROLE_TECHNICIAN'
  );

  // Grouped Navigation Items
  interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: 'lime' | 'amber' | 'neutral';
  }

  interface NavSection {
    section: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      section: 'Inventory',
      items: [
        { label: 'Equipment', href: '/app/equipment', icon: FlaskConical },
        { label: 'Laboratories', href: '/app/laboratories', icon: Building2 },
      ],
    },
    {
      section: 'Operations',
      items: [
        { label: 'Reservations', href: '/app/reservations', icon: CalendarCheck },
        { label: 'Faults', href: '/app/faults', icon: AlertTriangle },
        ...(isTechOrStaff
          ? [{ label: 'Work Orders', href: '/app/work-orders', icon: Wrench }]
          : []),
        ...(isStaff
          ? [
              {
                label: 'Approvals Queue',
                href: '/app/approvals',
                icon: ClipboardCheck,
                badge: 'Staff',
                badgeVariant: 'lime' as const,
              },
            ]
          : []),
      ],
    },
    {
      section: 'Analytics & Audit',
      items: [
        ...(isTechOrStaff
          ? [{ label: 'Reports', href: '/app/reports', icon: BarChart3 }]
          : []),
        ...(isStaff
          ? [{ label: 'Audit Trail', href: '/app/audit-logs', icon: ShieldCheck }]
          : []),
        { label: 'Notifications', href: '/app/notifications', icon: Bell },
      ],
    },
    {
      section: 'Account',
      items: [
        { label: 'Workspace', href: '/app/profile', icon: UserIcon },
      ],
    },
  ];

  const isRouteActive = (href: string) => {
    if (href === '/app/equipment' && location.pathname.startsWith('/app/equipment/')) {
      return true;
    }
    if (href === '/app/faults' && location.pathname.startsWith('/app/faults/')) {
      return true;
    }
    if (href === '/app/work-orders' && location.pathname.startsWith('/app/work-orders/')) {
      return true;
    }
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Accessibility skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md shadow-lg"
      >
        Skip to main content
      </a>

      <div className="flex-1 flex w-full">
        {/* DESKTOP SIDEBAR */}
        <aside
          aria-label="Sidebar Navigation"
          className={`hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-sm transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-30 ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Sidebar Header & Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link
              to="/app/dashboard"
              className="flex items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md py-1"
              aria-label="LabLedger Home"
            >
              <LogoMark size={28} />
              {!isCollapsed && (
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-base tracking-tight text-foreground">
                    LabLedger
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                    Instrument OS
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-accent-lime" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navSections.map((group) => (
              <div key={group.section} className="space-y-1">
                {!isCollapsed && (
                  <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1">
                    {group.section}
                  </h4>
                )}
                {group.items.map((item) => {
                  const active = isRouteActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? 'bg-accent/80 text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent-lime rounded-r"
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? 'text-accent-lime' : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-accent-lime text-ink-950 uppercase">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer User Card */}
          {user && (
            <div className="p-3 border-t border-border bg-muted/20">
              <div
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Link
                  to="/app/profile"
                  className="flex items-center gap-2.5 min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  title="View user profile"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-lime/20 border border-accent-lime/40 text-accent-lime font-bold text-xs flex items-center justify-center shrink-0">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate leading-tight">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">
                        {highestRole}
                      </p>
                    </div>
                  )}
                </Link>

                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* MAIN APPLICATION SHELL */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* TOP APP HEADER */}
          <header className="sticky top-0 z-20 w-full h-16 bg-background/90 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left Header: Mobile Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-2 rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <Breadcrumbs items={breadcrumbs} />
              ) : (
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>LabLedger</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-foreground">{title || 'Portal'}</span>
                </div>
              )}
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:block">
                <BackendStatusBadge />
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Toggle theme (currently ${resolvedTheme})`}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-accent-lime" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Notifications */}
              <NotificationBell />

              {/* Desktop User Avatar */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                  <Link
                    to="/app/profile"
                    className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    title="User profile"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent/80 border border-border flex items-center justify-center text-xs font-semibold text-foreground">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main
            id="main-content"
            tabIndex={-1}
            className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none ${maxWidth}`}
          >
            {/* Optional Unified Page Header */}
            {(title || actions) && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
                <div>
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
              </div>
            )}

            {children}
          </main>

          {/* COMPACT APP FOOTER */}
          <footer className="w-full border-t border-border/80 bg-card/40 py-4 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
            <div className={`mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 ${maxWidth}`}>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-foreground">LabLedger</span>
                <span>•</span>
                <span>University Laboratory Platform</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/app/profile" className="hover:text-foreground transition-colors">
                  Workspace Settings
                </Link>
                <Link to="/#architecture" className="hover:text-foreground transition-colors">
                  System Architecture
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* MOBILE RESPONSIVE DRAWER OVERLAY */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-ink-950/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-card border-r border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <Wordmark size="sm" showTagline={false} />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-6">
                {navSections.map((group) => (
                  <div key={group.section} className="space-y-1">
                    <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {group.section}
                    </h4>
                    {group.items.map((item) => {
                      const active = isRouteActive(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            active
                              ? 'bg-accent text-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                active ? 'text-accent-lime' : 'text-muted-foreground'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <Badge variant="lime" className="text-[10px] py-0 px-1.5">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            {user && (
              <div className="pt-6 border-t border-border mt-6">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="lime">{highestRole}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
