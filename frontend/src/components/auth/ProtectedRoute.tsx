import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center"
        data-testid="auth-loading"
      >
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = user.roles.some((role) => requiredRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
};
