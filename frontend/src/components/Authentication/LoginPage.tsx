import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Container,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import type { LoginPageProps } from './types';

/**
 * LoginPage Component - Two Authentication Methods
 * ===============================================
 * 
 * PRODUCTION (Google Cloud):
 * - User clicks "Authenticate with ORCID" 
 * - Gets redirected to ORCID.org for real authentication
 * - Returns with valid ORCID credentials
 * 
 * DEVELOPMENT (Local):
 * - User can click "Authenticate with ORCID" but it won't work (HTTPS required)
 * - OR user can use "Skip Authentication" and just enter an ORCID ID
 * - Development mode bypasses real authentication for local testing
 * 
 * IMPORTANT: Remove development mode before production deployment!
 * 
 * @param onLogin - Callback for development mode (manual ORCID ID entry)
 * @param onORCIDLogin - Callback for real ORCID authentication  
 * @param isLoading - Whether authentication is in progress
 */
function LoginPage({ onLogin, onORCIDLogin, isLoading = false }: LoginPageProps) {
  const [orcidId, setOrcidId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation - just check if ORCID ID is not empty
    if (!orcidId.trim()) {
      setError('Please enter your ORCID ID');
      return;
    }

    // Call the login callback with credentials
    onLogin({
      orcidId: orcidId.trim()
    });
  };

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            width: '100%',
            maxWidth: 400,
            borderRadius: 2
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'medium',
                color: 'text.primary',
                mb: 1
              }}
            >
              Crucible Data Explorer
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'text.secondary'
              }}
            >
              Choose your authentication method
            </Typography>
          </Box>

          {/* ORCID Authentication (Primary Method) */}
          <Stack spacing={3}>
            {/* REAL ORCID AUTHENTICATION:
                 This button starts the OAuth flow - user goes to ORCID.org */}
            <Button
              onClick={onORCIDLogin}
              disabled={isLoading}
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'medium',
                bgcolor: '#a6ce39',
                '&:hover': {
                  bgcolor: '#8fb82d'
                }
              }}
            >
              {isLoading ? 'Redirecting...' : 'Authenticate with ORCID'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR (Development Mode)
              </Typography>
            </Divider>

            {/* DEVELOPMENT MODE FORM:
                 Bypasses real authentication - just stores whatever ORCID ID user types */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Enter ORCID ID"
                value={orcidId}
                onChange={(e) => setOrcidId(e.target.value)}
                margin="normal"
                variant="outlined"
                placeholder="0000-0000-0000-0000"
                disabled={isLoading}
                sx={{ mb: 3 }}
                helperText="Your ORCID identifier (e.g., 0000-0000-0000-0000)"
              />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="outlined"
                size="large"
                disabled={isLoading}
                sx={{ 
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'medium'
                }}
              >
                {isLoading ? 'Loading...' : 'Skip Authentication (Dev Mode)'}
              </Button>
            </Box>
          </Stack>

          {/* Footer Info */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: 'block',
                mb: 1
              }}
            >
              Your ORCID ID is used to create a unique workspace
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                mb: 2
              }}
            >
              No validation is performed in development mode
            </Typography>
            
            {/* TEST CREDENTIALS BOX - REMOVE BEFORE DEPLOYMENT */}
            <Box 
              sx={{ 
                mt: 3,
                p: 2,
                bgcolor: 'warning.light',
                borderRadius: 1,
                border: '2px solid',
                borderColor: 'warning.main'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'warning.contrastText',
                  fontWeight: 'bold',
                  display: 'block',
                  mb: 1
                }}
              >
                ! DEVELOPMENT MODE !
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'warning.contrastText',
                  display: 'block',
                  fontFamily: 'monospace'
                }}
              >
                Example: 0000-0000-0000-1234<br/>
                (Any ORCID format works for testing)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;