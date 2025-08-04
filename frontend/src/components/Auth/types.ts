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
 * Note: email and orcidId are stored as SHA-256 hashes for privacy
 */
export interface UserInfo {
  email: string;         // SHA-256 hash of actual email (for privacy)
  orcidId: string;       // SHA-256 hash of actual ORCID ID (for privacy)
  userId: string;        // Generated unique ID for backend (e.g., "user_a1b2c3d4e5f6")
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