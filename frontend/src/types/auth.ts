export type UserRole =
  | 'ROLE_ADMIN'
  | 'ROLE_LAB_ASSISTANT'
  | 'ROLE_TECHNICIAN'
  | 'ROLE_STUDENT'
  | 'ROLE_FACULTY';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  status: UserStatus;
  roles: UserRole[];
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
