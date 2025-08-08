/**
 * Authentication Context - ORCID OAuth 2.0 Implementation
 * =======================================================
 * 
 * This context manages the complete ORCID authentication flow:
 * 
 * ORCID FLOW OVERVIEW:
 * 1. User clicks "Authenticate with ORCID" button
 * 2. We redirect them to ORCID.org for login
 * 3. ORCID redirects back to our /orcid/callback route with a code
 * 4. We exchange that code for an access token + ORCID ID
 * 5. User is now authenticated and can access the app
 * 
 * DEVELOPMENT MODE:
 * - Bypasses ORCID (since ORCID requires HTTPS)
 * - User just enters their ORCID ID manually
 * - No actual authentication happens (development only!)
 * 
 * STATE MANAGEMENT:
 * - Stores user info in React state + localStorage
 * - Persists login across browser refreshes
 * - Provides loading states for better UX
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextState, UserInfo, LoginCredentials, ORCIDAuthResponse } from '../components/Authentication/types';

// Create the context
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * 
 * Manages authentication state and provides auth methods to child components.
 * Handles both ORCID OAuth flow and development mode authentication.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    checkExistingAuth();
  }, []);

  /**
   * Check if user is already authenticated (from localStorage)
   */
  const checkExistingAuth = async () => {
    try {
      const storedUser = localStorage.getItem('crucible_user');
      if (storedUser) {
        const userData: UserInfo = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
      // Clear invalid stored data
      localStorage.removeItem('crucible_user');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Development mode login with manual credentials
   * 
   * DEVELOPMENT BYPASS:
   * This method skips the entire ORCID OAuth flow and just stores
   * the ORCID ID the user manually entered. !No validation happens!
   * 
   * IMPORTANT: This should only be used during development
   * when testing the app locally (since ORCID requires HTTPS).
   */
  const loginWithCredentials = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      // Create user info for development mode
      const userInfo: UserInfo = {
        orcidId: credentials.orcidId,        // Just use whatever they typed
        authMethod: 'development'            // Mark as dev mode
      };

      // Store user info (same as real ORCID login)
      setUser(userInfo);
      localStorage.setItem('crucible_user', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Development login error:', error);
      throw new Error('Failed to authenticate with provided credentials');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ORCID OAuth login - Step 1 of 2 in the OAuth flow
   * 
   * OAUTH STEP 1 - GET AUTHORIZATION URL:
   * 1. Ask our backend for the ORCID authorization URL
   * 2. Backend constructs URL with our client_id and redirect_uri
   * 3. Redirect the user's browser to ORCID.org
   * 4. User will log in on ORCID's website
   * 5. ORCID will redirect back to our /orcid/callback route
   * 
   * WHAT HAPPENS NEXT:
   * - User goes to ORCID, logs in, and gets redirected back
   * - ORCIDCallback component will handle the response
   * - handleORCIDCallback() will complete the flow
   */
  const loginWithORCID = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Call our backend to get the ORCID authorization URL
      // This URL includes our client_id and where to redirect back to
      const response = await fetch('/api/auth/orcid/login-url');
      if (!response.ok) {
        throw new Error('Failed to get ORCID login URL');
      }
      
      const data = await response.json();
      
      // REDIRECT TO ORCID:
      // This takes the user away from our app to ORCID.org
      // They'll log in there, then come back to /orcid/callback
      window.location.href = data.authorization_url;
      
      // Note: setIsLoading(false) doesn't run because we're redirecting away!
    } catch (error) {
      console.error('ORCID login error:', error);
      setIsLoading(false);
      throw new Error('Failed to initiate ORCID authentication');
    }
  };

  /**
   * Handle ORCID callback after authentication - Step 2 of 2 in OAuth flow
   * 
   * OAUTH STEP 2 - EXCHANGE CODE FOR TOKEN:
   * This runs when user comes back from ORCID with an authorization code.
   * 
   * 1. ORCID redirected user to: /orcid/callback?code=abc123
   * 2. ORCIDCallback component extracted the 'code' parameter
   * 3. ORCIDCallback calls this function with that code
   * 4. We send the code to our backend
   * 5. Backend exchanges code for access_token + orcid_id
   * 6. We store the user info and they're logged in!
   * 
   * RESULT: User is now authenticated with real ORCID data
   */
  const handleORCIDCallback = async (code: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('=== FRONTEND: Starting ORCID callback handling ===');
      console.log('Authorization code received:', code.substring(0, 20) + '...');
      
      // SEND CODE TO BACKEND:
      // Our backend will use this code + our client_secret 
      // to get an access token from ORCID
      console.log('Sending POST request to /api/auth/orcid/exchange');
      const response = await fetch('/api/auth/orcid/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),  // Send the authorization code
      });

      console.log('Backend response status:', response.status);
      console.log('Backend response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error('Failed to exchange ORCID authorization code');
      }

      // SUCCESS: Backend returns user data from ORCID
      const authData: ORCIDAuthResponse = await response.json();
      console.log('Received auth data from backend:', {
        orcid_id: authData.orcid_id,
        name: authData.name,
        hasAccessToken: !!authData.access_token
      });

      // Create user info from ORCID's real response
      const userInfo: UserInfo = {
        orcidId: authData.orcid_id,        // Their actual ORCID ID
        name: authData.name,               // Their name from ORCID profile
        accessToken: authData.access_token, // Token for future ORCID API calls
        authMethod: 'orcid'                // Mark as real ORCID auth
      };

      // Store user info (same as development mode storage)
      setUser(userInfo);
      localStorage.setItem('crucible_user', JSON.stringify(userInfo));

      // CLEAN UP: Remove the ?code=xyz from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('ORCID callback error:', error);
      throw new Error('Failed to complete ORCID authentication');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user and clear stored data
   */
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('crucible_user');
  };

  // Check if user is authenticated
  const isAuthenticated = user !== null;

  const value: AuthContextState = {
    user,
    isAuthenticated,
    isLoading,
    loginWithCredentials,
    loginWithORCID,
    handleORCIDCallback,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
