/**
 * ORCID Callback Component - OAuth 2.0 Return Handler
 * ==================================================
 * 
 * THIS IS WHERE USERS LAND AFTER ORCID LOGIN:
 * 
 * FLOW:
 * 1. User clicked "Authenticate with ORCID" button
 * 2. They got redirected to ORCID.org and logged in
 * 3. ORCID redirected them back to: /orcid/callback?code=abc123
 * 4. This component handles that redirect!
 * 
 * WHAT IT DOES:
 * - Extracts the 'code' parameter from the URL
 * - Calls AuthContext.handleORCIDCallback(code) 
 * - AuthContext sends code to backend for token exchange
 * - Shows loading/success/error states to user
 * - Redirects to main app on success
 * 
 * END RESULT: User is logged in with real ORCID data
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ORCIDCallback Component
 * 
 * This component is rendered when ORCID redirects back to /orcid/callback
 * It extracts the authorization code from the URL and exchanges it for tokens.
 */
function ORCIDCallback() {
  const [searchParams] = useSearchParams();
  const { handleORCIDCallback } = useAuth();
  const [error, setError] = useState<string>('');
  const [, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // EXTRACT DATA FROM URL:
        // ORCID redirected user back with URL like:
        // /orcid/callback?code=abc123 (success)
        // /orcid/callback?error=access_denied (user cancelled)
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        // HANDLE ORCID ERRORS:
        // User cancelled login or ORCID had an issue
        if (errorParam) {
          throw new Error(`ORCID authentication failed: ${errorParam}`);
        }

        // NO CODE = SOMETHING WENT WRONG:
        // Should always have either 'code' or 'error' parameter
        if (!code) {
          throw new Error('No authorization code received from ORCID');
        }

        // SUCCESS! PROCESS THE CODE:
        // Call AuthContext to exchange code for token
        // This will: send code to backend → get user data → store user → login complete
        await handleORCIDCallback(code);

        // AuthContext handles redirect to main app after success
      } catch (err) {
        console.error('ORCID callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, handleORCIDCallback]);

  // Show error state
  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          gap: 3,
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Authentication Failed
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            textAlign: 'center'
          }}
        >
          Please try again or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  // Show loading state while processing
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
      <CircularProgress size={50} />
      <Typography 
        variant="h6" 
        sx={{ color: 'text.primary' }}
      >
        Completing ORCID Authentication
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'text.secondary',
          textAlign: 'center'
        }}
      >
        Please wait while we verify your credentials...
      </Typography>
    </Box>
  );
}

export default ORCIDCallback;
