/**
 * Authentication Types
 * 
 * Type definitions for authentication-related components and functions.
 */

/**
 * User credentials for login
 */
export interface LoginCredentials {
  email: string;
  orcidId: string;
}

/**
 * Props for LoginPage component
 */
export interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => void;
}

/**
 * Props for AuthGuard component
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading?: boolean;
  fallback?: React.ReactNode;
}

/**
 * User information stored in authentication context
 */
export interface UserInfo {
  email: string;
  orcidId: string;
  userId: string;        // Generated unique ID for backend
  sessionToken?: string; // Future: session token from backend
}

/**
 * Authentication context state
 */
export interface AuthContextState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}