import type { ReactNode } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthGuardProps {
  children: ReactNode;
  isAuthenticated: boolean;
  isLoading?: boolean;
  fallback?: ReactNode;
}

/**
 * AuthGuard Component
 * 
 * Protects routes by checking authentication status.
 * Shows loading state while authentication is being checked.
 * Renders children if authenticated, otherwise shows fallback component.
 * 
 * @param children - The protected content to render when authenticated
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param isLoading - Whether authentication check is in progress
 * @param fallback - Component to show when not authenticated (default: loading spinner)
 */
function AuthGuard({ 
  children, 
  isAuthenticated, 
  isLoading = false, 
  fallback 
}: AuthGuardProps) {
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography 
          variant="body1" 
          sx={{ color: 'text.secondary' }}
        >
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {fallback || (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '100vh',
              gap: 2
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ color: 'text.primary' }}
            >
              Authentication Required
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: 'text.secondary' }}
            >
              Please log in to access the application
            </Typography>
          </Box>
        )}
      </>
    );
  }

  // Render protected content
  return <>{children}</>;
}

export default AuthGuard;