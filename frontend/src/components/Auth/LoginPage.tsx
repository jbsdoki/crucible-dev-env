import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Container,
  Alert
} from '@mui/material';
import type { LoginPageProps } from './types';

/**
 * LoginPage Component
 * 
 * Provides a simple login form for users to enter their credentials.
 * Currently accepts any email and ORCID ID without validation.
 * These credentials will be used for assigning unique user IDs in the backend.
 * 
 * @param onLogin - Callback function when login is submitted
 */
function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState<string>('');
  const [orcidId, setOrcidId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation - just check if fields are not empty
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!orcidId.trim()) {
      setError('Please enter your ORCID ID');
      return;
    }

    // Call the login callback with credentials
    onLogin({
      email: email.trim(),
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
              Please enter your credentials to continue
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Enter Account Name"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              placeholder="your.email@example.com"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Enter ORCID ID"
              value={orcidId}
              onChange={(e) => setOrcidId(e.target.value)}
              margin="normal"
              variant="outlined"
              placeholder="0000-0000-0000-0000"
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
              variant="contained"
              size="large"
              sx={{ 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'medium'
              }}
            >
              Continue to Application
            </Button>
          </Box>

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
              Your credentials are used to create a unique workspace
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                mb: 2
              }}
            >
              No validation is performed at this time
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
                🚨 DEVELOPMENT MODE - TEST CREDENTIALS 🚨
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'warning.contrastText',
                  display: 'block',
                  fontFamily: 'monospace'
                }}
              >
                Email: test.user@example.com<br/>
                ORCID: 0000-0000-0000-1234<br/>
                (Leave fields empty to auto-use these)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;