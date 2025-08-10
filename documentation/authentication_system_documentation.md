# ORCID Authentication System Documentation

## Overview

This application implements a complete ORCID OAuth 2.0 authentication flow that allows users to authenticate with their ORCID credentials before accessing the main application. The authentication process includes frontend and backend, and the FastAPI endpoint in main.py

This authentication procedure is still in development and does not work yet. There are many print + logging statements that need
to be removed before production.
As of Aug/10/2025 there are issues with the authentication system. I believe it is an issue with the redirect, logging indicates that
os.getenv() is succeeding. Likely an issue with application handling of credentials or issues with orcid.org
To replace Redirect UI go to orcid.org, enter your credentials, got to <> developer and make a new redirect and app authentication 
code.

## Architecture Overview

The authentication system parts:

- **Frontend**: React components that handle user interface and OAuth flow
- **Backend**: FastAPI endpoints that manage ORCID API communication
- **Context**: React Context API for state management across components
- **Services**: Backend service layer for ORCID API interactions

## Complete Authentication Flow

### 1. Initial Application Load

When the application first loads, the `AuthProvider` component initializes and checks for existing authentication:

```typescript
// From AuthContext.tsx
useEffect(() => {
  checkExistingAuth();
}, []);
```

The `checkExistingAuth()` function:
- Checks localStorage for existing user data (`crucible_user` key)
- If found, restores the user session
- Sets `isLoading` to false

### 2. User Initiates Login

Users can authenticate in two ways:

#### Development Mode (Bypass)
- Users manually enter their ORCID ID
- No actual ORCID validation occurs
- FOR DEVELOPMENT ONLY, REMOVE BEFORE PRODUCTION

#### Production Mode (Full OAuth)
- Users click "Authenticate with ORCID"
- Triggers the complete OAuth 2.0 flow

### 3. OAuth Flow Step 1: Authorization Request

When `loginWithORCID()` is called:

1. **Frontend Request**: Makes a GET request to `/api/auth/orcid/login-url`
2. **Backend Processing**: The `get_orcid_login_url()` endpoint in `main.py`:
   - Constructs the ORCID authorization URL with:
     - Client ID from environment variables
     - Redirect URI (must match ORCID app configuration)
     - Response type: `code`
     - Scope: `/read-limited` (read-only access to public profile)
3. **Redirect**: User's browser is redirected to ORCID.org
4. **User Authentication**: User logs in on ORCID's website

### 4. OAuth Flow Step 2: Authorization Code Exchange

After successful ORCID authentication:

1. **ORCID Redirect**: ORCID redirects back to `/orcid/callback?code=AUTHORIZATION_CODE`
2. **Frontend Handling**: The `ORCIDCallback` component:
   - Extracts the authorization code from URL parameters
   - Calls `handleORCIDCallback(code)` from the auth context
3. **Code Exchange**: Frontend sends POST request to `/api/auth/orcid/exchange` with the code
4. **Backend Processing**: The `exchange_orcid_code()` endpoint:
   - Receives the authorization code
   - Calls `ORCIDService.exchange_code_for_token()`
   - Exchanges the code for an access token using ORCID's token endpoint
   - Retrieves user profile information using the access token
5. **Response**: Backend returns user data including:
   - ORCID ID
   - Access token
   - User's name
   - Token expiration

### 5. User Session Management

Upon successful authentication:

1. **State Update**: User information is stored in React state via `setUser()`
2. **Persistence**: User data is saved to localStorage (`crucible_user` key)
3. **URL Cleanup**: Authorization code is removed from the URL
4. **Access Granted**: User can now access the protected application

## Component Architecture

### AuthProvider (frontend/src/contexts/AuthContext.tsx)

The central authentication context that provides:

- **State Management**: User information, loading states, authentication status
- **Authentication Methods**: Login, logout, ORCID callback handling
- **Persistence**: localStorage integration for session persistence

Key methods:
- `checkExistingAuth()`: Restores sessions from localStorage
- `loginWithCredentials()`: Development mode authentication
- `loginWithORCID()`: Initiates OAuth flow
- `handleORCIDCallback()`: Completes OAuth flow
- `logout()`: Clears user session

### LoginPage (frontend/src/components/Authentication/LoginPage.tsx)

The main authentication interface that:

- Provides login form for development mode
- Shows ORCID authentication button for production
- Handles form submission and validation
- Integrates with the auth context

### ORCIDCallback (frontend/src/components/Authentication/ORCIDCallback.tsx)

Handles the OAuth callback by:

- Extracting authorization code from URL parameters
- Calling the auth context to complete authentication
- Managing the transition from OAuth back to the main app

### AuthGuard (frontend/src/components/Authentication/AuthGuard.tsx)

Protects routes by:

- Checking authentication status
- Redirecting unauthenticated users to login
- Allowing authenticated users to access protected content

## Backend Implementation

### Main Endpoints (backend/main.py)

#### GET `/api/auth/orcid/login-url`
- Constructs ORCID authorization URL
- Includes client ID and redirect URI
- Returns URL for frontend to redirect to

#### POST `/api/auth/orcid/exchange`
- Receives authorization code from frontend
- Exchanges code for access token via ORCID API
- Retrieves user profile information
- Returns complete user data

### ORCID Service (backend/external_services/orcid_service.py)

The `ORCIDService` class handles:

- **Token Exchange**: Converting authorization codes to access tokens
- **Profile Retrieval**: Fetching user information from ORCID
- **URL Construction**: Building proper authorization URLs
- **Error Handling**: Managing ORCID API errors and responses

## Configuration Requirements

### Environment Variables

The backend requires these environment variables:

```bash
ORCID_CLIENT_ID=your_orcid_client_id
ORCID_CLIENT_SECRET=your_orcid_client_secret
ORCID_REDIRECT_URI=your_redirect_uri
```

These are set in Google GCS and are retrieved using os.getenv()

### ORCID App Configuration

The ORCID application must be configured with:

- **Redirect URI**: Must match exactly what's configured in the backend
- **Scopes**: `/read-limited` for basic profile access
- **Response Type**: `code` for authorization code flow

## Data Flow Diagrams

### Authentication Flow
```
User → LoginPage → AuthContext → Backend → ORCID → User Browser
  ↓
ORCID → ORCIDCallback → AuthContext → User Session → Main App
```

### Data Storage Flow
```
ORCID Response → Backend Processing → Frontend State → localStorage
  ↓
App Restart → localStorage → AuthContext → User Session Restored
```

## Error Handling

### Frontend Errors
- Network failures during API calls
- Invalid ORCID responses
- localStorage access issues
- Component rendering errors

### Backend Errors
- Missing environment variables
- ORCID API failures
- Invalid authorization codes
- Network connectivity issues

### Common Error Scenarios
1. **Missing Environment Variables**: Backend fails to start or authenticate
2. **Invalid Redirect URI**: ORCID rejects authorization requests
3. **Expired Authorization Codes**: Codes expire before exchange (usually 10 minutes)
4. **Network Issues**: Frontend can't reach backend or ORCID
5. **CORS Issues**: Cross-origin request failures in development

## Security Considerations

### OAuth 2.0 Security
- Authorization codes are single-use and short-lived
- Access tokens are stored securely and not exposed to frontend
- HTTPS is required for production OAuth flows

### Session Management
- User data is stored in localStorage (consider httpOnly cookies for production)
- Access tokens are stored in memory and localStorage
- Logout properly clears all stored data

### Development vs Production
- Development mode bypasses actual authentication
- Production requires proper HTTPS setup
- Environment variables must be properly configured

## Troubleshooting Guide

### Common Issues

#### 1. "Failed to get ORCID login URL"
- Check backend is running
- Verify environment variables are set
- Check backend logs for errors

#### 2. "Failed to exchange ORCID authorization code"
- Authorization code may have expired
- Check ORCID app configuration
- Verify redirect URI matches exactly

#### 3. Authentication not persisting
- Check localStorage access
- Verify user data structure
- Check for JavaScript errors

#### 4. CORS errors in development
- Ensure backend CORS is configured
- Check frontend base URL configuration
- Verify port numbers match

### Debug Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API calls are being made
3. **Check Backend Logs**: Look for server-side errors
4. **Verify Environment**: Ensure all required variables are set
5. **Check ORCID App**: Verify redirect URI and client ID

## Development vs Production Differences

### Development Mode
- Bypasses actual ORCID authentication
- Manual ORCID ID entry
- No HTTPS requirement
- Faster development iteration

### Production Mode
- Full OAuth 2.0 flow
- Real ORCID authentication
- HTTPS required
- Proper security measures

## Future Enhancements

### Potential Improvements
1. **Token Refresh**: Implement automatic token refresh
2. **Enhanced Security**: Use httpOnly cookies instead of localStorage
3. **Error Recovery**: Better error handling and user feedback
4. **Session Timeout**: Implement automatic session expiration
5. **Multi-Provider**: Support additional authentication providers

### Monitoring and Logging
1. **Authentication Metrics**: Track success/failure rates
2. **User Analytics**: Monitor authentication patterns
3. **Error Tracking**: Log and alert on authentication failures
4. **Performance Monitoring**: Track authentication response times

## Conclusion

This authentication procedure is still in development and does not work yet. There are many print + logging statements that need
to be removed before production.
As of Aug/10/2025 there are issues with the authentication system. I believe it is an issue with the redirect, logging indicates that
os.getenv() is succeeding. Likely an issue with application handling of credentials or issues with orcid.org
To replace Redirect UI go to orcid.org, enter your credentials, got to <> developer and make a new redirect and app authentication 
code.