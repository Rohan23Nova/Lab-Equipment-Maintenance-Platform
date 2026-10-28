import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background text-foreground transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Link to="/">
            <Wordmark />
          </Link>
        </div>

        <div className="bg-card border border-border/80 shadow-subtle rounded-xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-5">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            403 - Access Denied
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Your university identity account does not possess the authorized role permissions required to access this resource or administrative operation.
          </p>

          {user && (
            <div className="bg-muted/40 rounded-lg p-3 text-left border border-border/60 mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Current Account Privileges:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <Badge key={role} variant="neutral">
                    {role.replace('ROLE_', '')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/app/profile">
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Go to Profile
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-1.5" />
                Landing Page
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
