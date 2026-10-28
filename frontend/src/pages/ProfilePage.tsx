import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Mail,
  Building,
  Shield,
  Clock,
  LogOut,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-border/80 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
                Account & Security Profile
              </h1>
              <Badge
                variant={user.status === 'ACTIVE' ? 'available' : 'maintenance'}
                withDot
              >
                {user.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Institutional credentials and role permissions for LabLedger platform operations.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Information */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border border-border/80 shadow-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-accent" />
                Personal & Institutional Identity
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Full Name
                  </span>
                  <span className="font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    University Email
                  </span>
                  <span className="font-mono text-foreground text-xs sm:text-sm">
                    {user.email}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    Department / Division
                  </span>
                  <span className="font-medium text-foreground">
                    {user.department || 'General Science Faculty'}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Account Enrolled
                  </span>
                  <span className="font-medium text-foreground text-xs sm:text-sm">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Permissions Matrix */}
            <div className="bg-card border border-border/80 shadow-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-accent" />
                Assigned Platform Roles
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Operations in LabLedger are guarded on the backend by strict role-based access control.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {user.roles.map((role) => (
                  <Badge key={role} variant="lime" className="text-xs py-1 px-3">
                    {role.replace('ROLE_', '')}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                {user.roles.includes('ROLE_ADMIN') && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Full institutional administration: manage users, laboratory facilities, equipment taxonomy, and audit ledgers.</span>
                  </div>
                )}
                {user.roles.includes('ROLE_LAB_ASSISTANT') && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Laboratory operations: manage equipment reservation schedules, triage reported faults, and approve maintenance work.</span>
                  </div>
                )}
                {user.roles.includes('ROLE_TECHNICIAN') && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Maintenance execution: view assigned work orders, perform repairs, update maintenance progress, and record repair metrics.</span>
                  </div>
                )}
                {user.roles.includes('ROLE_STUDENT') && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Equipment access: browse qualified laboratory instruments, schedule reservations, and submit defect/fault reports.</span>
                  </div>
                )}
                {user.roles.includes('ROLE_FACULTY') && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Faculty privileges: reserve specialized departmental hardware, supervise student reservations, and access utilization summaries.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session & Security Summary */}
          <div className="space-y-6">
            <div className="bg-card border border-border/80 shadow-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-accent" />
                Session Security
              </h2>

              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Stateful Session:</strong> Bound to secure HTTP-only <code className="font-mono bg-muted px-1 py-0.5 rounded">JSESSIONID</code> cookie.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">CSRF Protection:</strong> Enforced on all mutating operations with double-submit cookie exchange.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Brute-Force Throttling:</strong> Consecutive failed attempts trigger a 15-minute temporary lockout.
                  </span>
                </li>
              </ul>

              <div className="mt-6 pt-4 border-t border-border/60">
                <Link to="/">
                  <Button variant="outline" size="sm" className="w-full">
                    Return to Public Landing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
