"""
ORCID Authentication Service
---------------------------
This service handles ORCID OAuth 2.0 authentication flow.

Purpose:
- Exchange authorization codes for access tokens
- Validate ORCID credentials
- Extract user ORCID iD and profile information

Dependencies:
- httpx: For making HTTP requests to ORCID API
- python-dotenv: For loading environment variables

Environment Variables Required:
- ORCID_CLIENT_ID: Your ORCID application client ID
- ORCID_CLIENT_SECRET: Your ORCID application client secret
- ORCID_REDIRECT_URI: The redirect URI registered with ORCID
- ORCID_TOKEN_URL: ORCID token endpoint (https://orcid.org/oauth/token)
"""

import httpx
import os
from typing import Dict, Optional
from dotenv import load_dotenv
import logging
from pathlib import Path

# Configure logging first
logger = logging.getLogger(__name__)

# Environment variable loading strategy:
# - Production (Google Cloud): Environment variables are injected by Cloud Run
# - Development: .env file can be used but is not required for basic functionality
# - ORCID authentication requires HTTPS, so local testing must use development mode

# Check if we're running in Google Cloud (has GOOGLE_CLOUD_PROJECT env var)
is_cloud_environment = os.getenv("GOOGLE_CLOUD_PROJECT") is not None

if is_cloud_environment:
    logger.info("Production: Using Google Cloud environment variables")
else:
    logger.info("Development: Local environment detected")
    
    # Try to load .env file if it exists (optional for development)
    current_dir = Path(__file__).parent
    project_root = current_dir.parent.parent
    
    env_locations = [
        project_root / ".env",  # Project root (most common)
        current_dir.parent / ".env",  # backend directory
        current_dir / ".env",  # Same directory as this file
    ]
    
    env_loaded = False
    for env_path in env_locations:
        if env_path.exists():
            load_dotenv(env_path)
            logger.info(f"Loaded environment variables from: {env_path}")
            env_loaded = True
            break
    
    if not env_loaded:
        logger.info("No .env file found - ORCID authentication will not work locally")
        logger.info("This is normal: ORCID requires HTTPS, use development mode for local testing")

class ORCIDService:
    """
    Service class for handling ORCID OAuth 2.0 authentication.
    
    This class manages the token exchange process with ORCID's API
    and extracts user information from the authentication response.
    """
    
    def __init__(self):
        """
        Initialize the ORCID service with required configuration.
        
        Raises:
            ValueError: If required environment variables are missing
        """
        self.client_id = os.getenv("ORCID_CLIENT_ID")
        self.client_secret = os.getenv("ORCID_CLIENT_SECRET")
        self.redirect_uri = os.getenv("ORCID_REDIRECT_URI")
        self.token_url = os.getenv("ORCID_TOKEN_URL", "https://orcid.org/oauth/token")
        
        # Debug logging to see what values we got
        logger.info(f"ORCID_CLIENT_ID: {'SET' if self.client_id else 'NOT SET'}")
        logger.info(f"ORCID_CLIENT_SECRET: {'SET' if self.client_secret else 'NOT SET'}")
        logger.info(f"ORCID_REDIRECT_URI: {'SET' if self.redirect_uri else 'NOT SET'}")
        
        # Validate that all required configuration is present
        # In development, we'll allow missing credentials but log a warning
        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            missing = []
            if not self.client_id:
                missing.append("ORCID_CLIENT_ID")
            if not self.client_secret:
                missing.append("ORCID_CLIENT_SECRET")
            if not self.redirect_uri:
                missing.append("ORCID_REDIRECT_URI")
            
            # Set a flag to indicate ORCID is not configured
            self.is_configured = False
            logger.warning(f"ORCID service not configured - missing: {', '.join(missing)}. ORCID endpoints will not work.")
        else:
            self.is_configured = True
            logger.info("ORCID service successfully configured")
    
    async def exchange_code_for_token(self, authorization_code: str) -> Dict:
        """
        Exchange an ORCID authorization code for an access token.
        
        OAUTH STEP 2 - TOKEN EXCHANGE (Backend Side):
        This is called by our FastAPI endpoint when the frontend sends us
        the authorization code that ORCID gave them.
        
        WHAT HAPPENS:
        1. User went to ORCID, logged in, got redirected back with a code
        2. Frontend extracted the code and sent it to us
        3. We use the code + our client_secret to get a real access token
        4. ORCID returns: access_token, orcid_id, user name, etc.
        5. We send that data back to the frontend
        
        SECURITY NOTE:
        This happens on the backend because client_secret must stay secret!
        Frontend never sees the client_secret.
        
        Args:
            authorization_code (str): The "code" parameter ORCID sent back
        
        Returns:
            Dict: Real user data from ORCID:
                - orcid_id (str): Their actual ORCID identifier 
                - access_token (str): Token for future ORCID API calls
                - name (str): User's name from their ORCID profile
                - expires_in (int): How long the token is valid (seconds)
        
        Raises:
            ValueError: If ORCID rejects our request or config is wrong
            httpx.HTTPError: If network/HTTP issues occur
        """
        # Check if ORCID service is properly configured
        if not self.is_configured:
            raise ValueError("ORCID service is not configured. Please set ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, and ORCID_REDIRECT_URI environment variables.")
        # PREPARE TOKEN EXCHANGE REQUEST:
        # This is the exact format ORCID expects for OAuth 2.0 token exchange
        token_data = {
            "client_id": self.client_id,          # Our public app identifier
            "client_secret": self.client_secret,  # SECRET! Must stay on backend
            "grant_type": "authorization_code",   # OAuth 2.0 flow type
            "redirect_uri": self.redirect_uri,    # Must match what we registered
            "code": authorization_code            # The code user brought back from ORCID
        }
        
        # HTTP HEADERS:
        # ORCID wants form data, not JSON
        headers = {
            "Accept": "application/json",                    # We want JSON response back
            "Content-Type": "application/x-www-form-urlencoded"  # Send as form data
        }
        
        logger.info(f"Exchanging authorization code for token with ORCID...")
        
        # DETAILED DEBUG LOGGING - what we're sending to ORCID
        logger.error("=" * 80)
        logger.error("DETAILED TOKEN EXCHANGE REQUEST DEBUG - TEST")
        logger.error("=" * 80)
        logger.info(f"Token URL: {self.token_url}")
        logger.info(f"Authorization Code (first 10 chars): {authorization_code[:10]}...")
        logger.info(f"Client ID: {self.client_id}")
        logger.info(f"Client Secret (first 10 chars): {self.client_secret[:10] if self.client_secret else 'NONE'}...")
        logger.info(f"Redirect URI: {self.redirect_uri}")
        logger.info(f"Grant Type: {token_data['grant_type']}")
        logger.info(f"Request Headers: {headers}")
        logger.info("=" * 80)
        
        # Make the HTTP request to exchange the code for a token
        async with httpx.AsyncClient() as client:
            try:
                logger.info("Sending POST request to ORCID token endpoint...")
                response = await client.post(
                    self.token_url,
                    data=token_data,
                    headers=headers
                )
                
                # DETAILED RESPONSE LOGGING
                logger.info("=" * 80)
                logger.info("ORCID TOKEN ENDPOINT RESPONSE")
                logger.info("=" * 80)
                logger.info(f"Response Status Code: {response.status_code}")
                logger.info(f"Response Headers: {dict(response.headers)}")
                logger.info(f"Response Body: {response.text}")
                logger.info("=" * 80)
                
                # Check if the request was successful
                if response.status_code != 200:
                    logger.error(f"ORCID token exchange failed with status {response.status_code}")
                    logger.error(f"Full response text: {response.text}")
                    logger.error(f"Response headers: {dict(response.headers)}")
                    raise ValueError(f"ORCID token exchange failed: {response.text}")
                
                # Parse the JSON response
                token_response = response.json()
                
                # Extract the relevant information
                result = {
                    "orcid_id": token_response.get("orcid"),
                    "access_token": token_response.get("access_token"),
                    "name": token_response.get("name"),
                    "expires_in": token_response.get("expires_in"),
                    "scope": token_response.get("scope"),
                    "token_type": token_response.get("token_type")
                }
                
                logger.info(f"Successfully authenticated user with ORCID iD: {result['orcid_id']}")
                
                # Enhanced logging for debugging
                logger.info("=" * 60)
                logger.info("ORCID AUTHENTICATION SUCCESS!")
                logger.info("=" * 60)
                logger.info(f"ORCID iD: {result['orcid_id']}")
                logger.info(f"User Name: {result.get('name', 'Not provided')}")
                logger.info(f"Access Token: {result['access_token'][:20]}..." if result.get('access_token') else "No access token")
                logger.info(f"Token Expires In: {result.get('expires_in', 'Unknown')} seconds")
                logger.info(f"Token Type: {result.get('token_type', 'Unknown')}")
                logger.info(f"Scope: {result.get('scope', 'Unknown')}")
                logger.info("=" * 60)
                
                return result
                
            except httpx.HTTPError as e:
                logger.error(f"HTTP error during ORCID token exchange: {str(e)}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error during ORCID token exchange: {str(e)}")
                raise
    
    def get_authorization_url(self) -> str:
        """
        Generate the ORCID authorization URL for user authentication.
        
        OAUTH STEP 1 - AUTHORIZATION URL (Backend Side):
        This is called by our FastAPI endpoint when the frontend wants to 
        start the ORCID login process.
        
        WHAT HAPPENS:
        1. Frontend calls our /api/auth/orcid/login-url endpoint
        2. This method builds the URL to send users to ORCID
        3. URL includes our client_id and where to redirect back to
        4. Frontend redirects user's browser to this URL
        5. User logs in on ORCID.org
        6. ORCID redirects back to our app with an authorization code
        
        URL FORMAT:
        https://orcid.org/oauth/authorize?
          client_id=APP-XXXXXXXXX&
          response_type=code&
          scope=/authenticate&
          redirect_uri=https://ourapp.com/orcid/callback
        
        Returns:
            str: Complete ORCID authorization URL for user redirect
            
        Raises:
            ValueError: If ORCID credentials aren't configured
        """
        # Check if ORCID service is properly configured
        if not self.is_configured:
            raise ValueError("ORCID service is not configured. Please set ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, and ORCID_REDIRECT_URI environment variables.")
        authorize_url = os.getenv("ORCID_AUTHORIZE_URL", "https://orcid.org/oauth/authorize")
        
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": "/authenticate",
            "redirect_uri": self.redirect_uri
        }
        
        # Build the query string
        query_params = "&".join([f"{key}={value}" for key, value in params.items()])
        full_url = f"{authorize_url}?{query_params}"
        
        logger.info("=" * 80)
        logger.info("GENERATED ORCID AUTHORIZATION URL - DETAILED DEBUG")
        logger.info("=" * 80)
        logger.info(f"Authorize URL Base: {authorize_url}")
        logger.info(f"Client ID: {self.client_id}")
        logger.info(f"Response Type: {params['response_type']}")
        logger.info(f"Scope: {params['scope']}")
        logger.info(f"Redirect URI: {self.redirect_uri}")
        logger.info(f"Full Generated URL: {full_url}")
        logger.info("=" * 80)
        
        return full_url

# Create a singleton instance for use in the application
orcid_service = ORCIDService()