import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LoginCredentials, UserInfo, AuthContextState } from '../components/Auth/types';

/**
 * Authentication Context
 * 
 * Manages user authentication state across the application.
 * Provides login/logout functionality and user information storage.
 * Currently uses localStorage for persistence (no backend integration yet).
 */

// Create the context with default values
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// =============================================================================
// ========================= REMOVE BEFORE DEPLOYMENT =========================
// =============================================================================
/**
 * TEST CREDENTIALS - FOR DEVELOPMENT ONLY
 * THESE MUST BE REMOVED BEFORE PRODUCTION DEPLOYMENT
 */
const TEST_CREDENTIALS = {
  email: 'test.user@example.com',
  orcidId: '0000-0000-0000-1234'
};
// =============================================================================
// ========================= REMOVE BEFORE DEPLOYMENT =========================
// =============================================================================

/**
 * Generate a simple hash for privacy
 * This creates a consistent hash that doesn't store the actual credentials
 */
async function generateHash(input: string): Promise<string> {
  // Use browser's built-in crypto API for consistent hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique user ID from email and ORCID ID
 * This creates a consistent, unique identifier for each user
 * that can be used for backend file isolation
 */
async function generateUserId(email: string, orcidId: string): Promise<string> {
  // Create hash from combined credentials for privacy
  const combined = `${email.toLowerCase()}_${orcidId}`;
  const hash = await generateHash(combined);
  
  // Take first 16 characters of hash for shorter, filesystem-safe ID
  return `user_${hash.substring(0, 16)}`;
}

/**
 * AuthProvider Component
 * 
 * Wraps the application to provide authentication context.
 * Handles login state persistence and user session management.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const savedUser = localStorage.getItem('crucible_user');
        if (savedUser) {
          const userInfo: UserInfo = JSON.parse(savedUser);
          setUser(userInfo);
          console.log('Restored user session:', userInfo.email);
        }
      } catch (error) {
        console.error('Error restoring user session:', error);
        // Clear corrupted session data
        localStorage.removeItem('crucible_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  /**
   * Login function - authenticates user and stores session
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      // ===================================================================
      // =================== REMOVE BEFORE DEPLOYMENT ====================
      // ===================================================================
      // Auto-fill test credentials for development
      const effectiveCredentials = {
        email: credentials.email || TEST_CREDENTIALS.email,
        orcidId: credentials.orcidId || TEST_CREDENTIALS.orcidId
      };
      console.log('Using credentials (DEV MODE):', effectiveCredentials);
      // ===================================================================
      // =================== REMOVE BEFORE DEPLOYMENT ====================
      // ===================================================================
      
      // Generate unique user ID from hashed credentials
      const userId = await generateUserId(effectiveCredentials.email, effectiveCredentials.orcidId);
      
      // Generate hashes for storage (for privacy)
      const emailHash = await generateHash(effectiveCredentials.email);
      const orcidHash = await generateHash(effectiveCredentials.orcidId);
      
      // Create user info object with hashed data
      const userInfo: UserInfo = {
        email: emailHash,  // Store hash instead of actual email
        orcidId: orcidHash,  // Store hash instead of actual ORCID
        userId: userId,
        // sessionToken will be added later when backend integration is complete
      };

      // Store user info in state and localStorage
      setUser(userInfo);
      localStorage.setItem('crucible_user', JSON.stringify(userInfo));
      
      console.log('User logged in successfully with ID:', userId);
      
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout function - clears user session
   */
  const logout = (): void => {
    try {
      setUser(null);
      localStorage.removeItem('crucible_user');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Context value object
  const contextValue: AuthContextState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 * 
 * @returns AuthContextState with user info and auth functions
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}