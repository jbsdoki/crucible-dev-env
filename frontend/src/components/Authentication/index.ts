/**
 * Auth Components Export Index
 * 
 * Centralizes exports for authentication-related components
 * to make imports cleaner throughout the application.
 */

export { default as LoginPage } from './LoginPage';
export { default as AuthGuard } from './AuthGuard';
export { default as ORCIDCallback } from './ORCIDCallback';

// Re-export types for convenience
export type { 
  LoginCredentials, 
  LoginPageProps, 
  AuthGuardProps, 
  UserInfo, 
  AuthContextState,
  ORCIDAuthResponse
} from './types';