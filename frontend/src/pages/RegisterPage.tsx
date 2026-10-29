import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiClientError } from '@/lib/apiClient';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, AlertCircle, ArrowLeft, User, Building, CheckCircle2 } from 'lucide-react';

interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department: string;
  roles: string[];
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ROLE_STUDENT' | 'ROLE_FACULTY' | 'ROLE_TECHNICIAN'>('ROLE_STUDENT');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedDept = department.trim();

    if (!trimmedFirst || !trimmedLast) {
      setErrorMessage('First and last names are required.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Institutional email address is required.');
      return;
    }
    if (!trimmedDept) {
      setErrorMessage('Department or research group is required.');
      return;
    }
    if (password.length < 10) {
      setErrorMessage('Password must be at least 10 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Fetch CSRF token first
      await apiClient.get('/auth/csrf');

      // 2. Register user account
      const payload: CreateUserPayload = {
        email: trimmedEmail,
        password,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        department: trimmedDept,
        roles: [role],
      };

      await apiClient.post('/users', payload);
      setIsSuccess(true);

      // Auto login after short delay or proceed immediately
      try {
        await login({ email: trimmedEmail, password });
        navigate('/app/dashboard', { replace: true });
      } catch {
        // If auto-login fails, redirect to login page with message
        setTimeout(() => {
          navigate('/login', { state: { registeredEmail: trimmedEmail } });
        }, 1500);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        const problemObj = err.problem as unknown as Record<string, unknown>;
        if (err.problem.status === 409) {
          setErrorMessage('An account with this institutional email address already exists. Please sign in instead.');
        } else if (err.problem.status === 400 && problemObj['errors']) {
          const errors = problemObj['errors'] as Record<string, string>;
          const firstError = Object.values(errors)[0];
          setErrorMessage(firstError || err.problem.detail || 'Validation failed. Please verify all inputs.');
        } else {
          setErrorMessage(err.problem.detail || err.problem.title || 'Registration failed.');
        }
      } else {
        setErrorMessage('Unable to communicate with the identity service. Please verify that the backend is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background text-foreground transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <Wordmark />
          </Link>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground font-serif">
          Create Institutional Account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Register for laboratory equipment access, reservations, and maintenance reporting.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-card border border-border/80 shadow-subtle rounded-xl p-6 sm:p-8">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent-lime/20 text-accent-lime flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold font-serif">Account Created Successfully</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your institutional user profile has been created. Establishing secure session...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {errorMessage && (
                <div
                  className="p-4 rounded-lg flex items-start gap-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Registration Error</p>
                    <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    First Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="block w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="block w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="department"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    Department
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      id="department"
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Physics / Chem"
                      className="block w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    Role / Position
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as typeof role)}
                    className="block w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="ROLE_STUDENT">Student / Researcher</option>
                    <option value="ROLE_FACULTY">Faculty / PI</option>
                    <option value="ROLE_TECHNICIAN">Laboratory Technician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    Password (min 10 chars)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-medium mt-2"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Create Account
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </span>
              <Link
                to="/"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Landing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
