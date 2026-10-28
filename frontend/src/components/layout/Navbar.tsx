import React, { useState } from 'react';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';
import { BackendStatusBadge } from '@/components/common/BackendStatusBadge';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Menu, X, ArrowUpRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Capabilities', href: '#features' },
    { label: 'Product Preview', href: '#preview' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Docs', href: '#docs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
            aria-label="LabLedger Home"
          >
            <Wordmark showTagline={false} size="md" />
          </a>
          <div className="hidden lg:block">
            <BackendStatusBadge />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Actions: Theme Toggle & Entry Buttons */}
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

          {/* Sign In button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const previewEl = document.getElementById('preview');
              previewEl?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Sign In
          </Button>

          {/* Primary CTA */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const previewEl = document.getElementById('preview');
              previewEl?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="gap-1.5"
          >
            <span>Launch Preview</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
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
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center gap-1.5"
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Launch Preview</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
