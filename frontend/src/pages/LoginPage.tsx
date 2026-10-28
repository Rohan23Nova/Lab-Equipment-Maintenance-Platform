import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/lib/apiClient';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // If already authenticated, redirect to app profile or requested path
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/profile';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorStatus(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Institutional email address is required.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: trimmedEmail, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorStatus(err.problem.status);
        if (err.problem.status === 423) {
          setErrorMessage(
            err.problem.detail || 'Your account is temporarily locked due to consecutive failed attempts. Please retry after 15 minutes.'
          );
        } else if (err.problem.status === 403) {
          setErrorMessage(
            err.problem.detail || 'Your user account is suspended or disabled. Please contact your laboratory administrator.'
          );
        } else if (err.problem.status === 401) {
          setErrorMessage(
            err.problem.detail || 'Invalid email or password. Please verify your credentials and try again.'
          );
        } else {
          setErrorMessage(err.problem.detail || err.problem.title || 'Authentication request failed.');
        }
      } else {
        setErrorMessage('Unable to connect to university identity service. Please verify server status.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-background text-foreground transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <Wordmark />
          </Link>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground font-serif">
          Institutional Laboratory Access
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Single session sign-in for university students, technicians, and laboratory staff.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-card border border-border/80 shadow-subtle rounded-xl p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 text-sm ${
                  errorStatus === 423
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300'
                    : 'bg-destructive/10 border border-destructive/20 text-destructive'
                }`}
                role="alert"
                data-testid="login-error-alert"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">
                    {errorStatus === 423
                      ? 'Account Temporarily Locked'
                      : errorStatus === 403
                      ? 'Account Inactive'
                      : 'Authentication Failed'}
                  </p>
                  <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Institutional Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="netid@university.edu"
                  className="block w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-medium"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In to LabLedger
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                Stateful session protected
              </span>
              <Link
                to="/"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to landing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
