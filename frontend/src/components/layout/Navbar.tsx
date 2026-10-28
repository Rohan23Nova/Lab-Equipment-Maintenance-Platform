import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BackendStatusBadge } from '@/components/common/BackendStatusBadge';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, Menu, X, ArrowUpRight, User, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Capabilities', href: '/#features' },
    { label: 'Product Preview', href: '/#preview' },
    { label: 'Workflow', href: '/#workflow' },
    { label: 'Architecture', href: '/#architecture' },
  ];

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const highestRole = user?.roles[0]?.replace('ROLE_', '') || 'USER';
  const canApprove = user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT');

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
            aria-label="LabLedger Home"
          >
            <Wordmark showTagline={false} size="md" />
          </Link>
          <div className="hidden lg:block">
            <BackendStatusBadge />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground" aria-label="Main Navigation">
          {isAuthenticated ? (
            <>
              <Link
                to="/app/equipment"
                className="text-foreground hover:text-primary transition-colors py-1 font-medium"
              >
                Equipment
              </Link>
              <Link
                to="/app/laboratories"
                className="text-foreground hover:text-primary transition-colors py-1 font-medium"
              >
                Laboratories
              </Link>
              <Link
                to="/app/reservations"
                className="text-foreground hover:text-primary transition-colors py-1 font-medium"
              >
                Reservations
              </Link>
              {canApprove && (
                <Link
                  to="/app/approvals"
                  className="text-foreground hover:text-primary transition-colors py-1 font-medium flex items-center gap-1.5"
                >
                  <span>Approvals</span>
                  <span className="w-2 h-2 rounded-full bg-accent-lime"></span>
                </Link>
              )}
              <Link
                to="/app/profile"
                className="text-foreground hover:text-primary transition-colors py-1 font-medium"
              >
                Workspace
              </Link>
            </>
          ) : (
            navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {link.label}
              </a>
            ))
          )}
        </nav>

        {/* Right Actions: Theme Toggle & Auth State */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme switcher */}
          <button
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

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link to="/app/profile" className="flex items-center gap-2 group">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {user.department || user.email}
                  </span>
                </div>
                <Badge variant="lime" className="text-[10px] py-0 px-1.5 uppercase">
                  {highestRole}
                </Badge>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Sign In link */}
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>

              {/* Primary CTA */}
              <Link to="/login">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <span>Enter Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-accent-lime" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <Link
                  to="/app/equipment"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors font-semibold"
                >
                  Equipment Inventory
                </Link>
                <Link
                  to="/app/laboratories"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors font-semibold"
                >
                  Laboratory Facilities
                </Link>
                <Link
                  to="/app/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors font-semibold"
                >
                  My Reservations
                </Link>
                {canApprove && (
                  <Link
                    to="/app/approvals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors font-semibold flex items-center justify-between"
                  >
                    <span>Approvals Queue</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-lime text-ink-950 font-bold">
                      Staff
                    </span>
                  </Link>
                )}
                <Link
                  to="/app/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted text-foreground font-semibold"
                >
                  My Account Profile
                </Link>
              </>
            ) : (
              navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))
            )}
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <Badge variant="lime">{highestRole}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-destructive"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full justify-center gap-1.5">
                    <span>Enter Portal</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
