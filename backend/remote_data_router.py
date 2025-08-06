"""
Remote Data Router
-----------------
This router handles HTTP client calls to remote FastAPI servers for downloading data.
It uses ORCID authentication to access remote datasets and provides endpoints for:

1. Listing available datasets from remote servers
2. Downloading specific datasets 
3. Checking download status for long-running operations

Architecture:
- Uses httpx as async HTTP client to make calls to remote FastAPI servers
- Leverages existing ORCID session from dataset_access.py for authentication
- Returns remote server responses to the React frontend
- Handles errors and authentication failures gracefully
"""

from fastapi import APIRouter, Request, Query, HTTPException
from fastapi.responses import JSONResponse
import httpx
import os
import asyncio
from typing import Optional
from remote_download import test_rclone_download

# Create router with prefix and tags for API organization
router = APIRouter(prefix="/remote", tags=["remote-data"])

def get_remote_base_url() -> str:
    """
    Get the base URL for the Crucible API server from environment variables.
    
    Returns:
        str: The base URL for Crucible API calls
    """
    return os.getenv("REMOTE_FASTAPI_URL", "https://crucible.lbl.gov/api")

async def discover_api_endpoints(api_key: str) -> dict:
    """
    Attempt to discover available API endpoints using common discovery methods.
    
    Args:
        api_key: API key for authentication
        
    Returns:
        dict: Information about discovered endpoints and capabilities
    """
    print("=== Starting API endpoint discovery ===")
    remote_base_url = get_remote_base_url()
    discovery_info = {
        "base_url": remote_base_url,
        "discovery_methods": {},
        "potential_endpoints": []
    }
    
    # Common API discovery endpoints to try
    discovery_endpoints = [
        "/",                    # Root endpoint (often lists available endpoints)
        "/docs",               # Swagger/OpenAPI docs
        "/api/docs",           # Alternative docs location  
        "/openapi.json",       # OpenAPI specification
        "/api/openapi.json",   # Alternative OpenAPI location
        "/swagger.json",       # Swagger specification
        "/redoc",              # ReDoc documentation
        "/health",             # Health check (often reveals API structure)
        "/version",            # Version info (might include endpoint info)
        "/info",               # General API info
        "/endpoints",          # Some APIs have explicit endpoint lists
        "/help",               # Help endpoint
    ]
    
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json, text/html, */*"
        }
        
        for endpoint in discovery_endpoints:
            try:
                url = f"{remote_base_url}{endpoint}"
                print(f"Trying discovery endpoint: {url}")
                
                response = await client.get(url, headers=headers, timeout=10.0)
                
                if response.status_code == 200:
                    print(f"SUCCESS: {endpoint} returned {response.status_code}")
                    
                    # Try to parse as JSON
                    try:
                        json_data = response.json()
                        discovery_info["discovery_methods"][endpoint] = {
                            "status": "success",
                            "content_type": response.headers.get("content-type", "unknown"),
                            "data": json_data
                        }
                        
                        # Look for endpoint patterns in the response
                        if isinstance(json_data, dict):
                            # Check for common OpenAPI/Swagger patterns
                            if "paths" in json_data:
                                print(f"Found OpenAPI paths in {endpoint}")
                                for path, methods in json_data["paths"].items():
                                    discovery_info["potential_endpoints"].append({
                                        "path": path,
                                        "methods": list(methods.keys()) if isinstance(methods, dict) else ["unknown"],
                                        "source": endpoint
                                    })
                            
                            # Check for endpoint lists
                            elif "endpoints" in json_data or "routes" in json_data:
                                endpoint_list = json_data.get("endpoints", json_data.get("routes", []))
                                for ep in endpoint_list:
                                    if isinstance(ep, str):
                                        discovery_info["potential_endpoints"].append({
                                            "path": ep,
                                            "methods": ["unknown"],
                                            "source": endpoint
                                        })
                                    elif isinstance(ep, dict) and "path" in ep:
                                        discovery_info["potential_endpoints"].append({
                                            "path": ep["path"],
                                            "methods": ep.get("methods", ["unknown"]),
                                            "source": endpoint
                                        })
                        
                    except:
                        # Not JSON, but still successful - might be HTML docs
                        text_content = response.text[:500]  # First 500 chars
                        discovery_info["discovery_methods"][endpoint] = {
                            "status": "success",
                            "content_type": response.headers.get("content-type", "unknown"),
                            "preview": text_content
                        }
                        
                        # Look for endpoint patterns in HTML/text
                        if "download" in text_content.lower():
                            print(f"Found 'download' references in {endpoint}")
                
                else:
                    print(f"INFO: {endpoint} returned {response.status_code}")
                    discovery_info["discovery_methods"][endpoint] = {
                        "status": "failed",
                        "status_code": response.status_code
                    }
                    
            except Exception as e:
                print(f"ERROR with {endpoint}: {e}")
                discovery_info["discovery_methods"][endpoint] = {
                    "status": "error",
                    "error": str(e)
                }
    
    # Try OPTIONS requests on known working endpoints to discover allowed methods
    known_endpoints = ["/list_datasets", "/dataset/{id}"]
    for endpoint in known_endpoints:
        try:
            url = f"{remote_base_url}{endpoint}"
            print(f"Trying OPTIONS request on: {url}")
            
            response = await client.options(url, headers=headers, timeout=10.0)
            if response.status_code in [200, 204]:
                allowed_methods = response.headers.get("Allow", "")
                discovery_info["potential_endpoints"].append({
                    "path": endpoint,
                    "methods": [m.strip() for m in allowed_methods.split(",") if m.strip()],
                    "source": "OPTIONS request"
                })
                print(f"OPTIONS {endpoint}: {allowed_methods}")
                
        except Exception as e:
            print(f"OPTIONS error for {endpoint}: {e}")
    
    print("=== Finished API endpoint discovery ===")
    return discovery_info

def get_crucible_api_key() -> Optional[str]:
    """
    Get the Crucible API key with priority order:
    1. Read directly from .env file using simple file operations (no external dependencies)
    2. Fall back to system environment variables (for cloud deployment)
    
    Returns:
        str: API key if available, None otherwise
    """
    print("=== Starting get_crucible_api_key() ===")
    
    # Primary method: Read .env file directly (no external dependencies needed!)
    env_file_path = ".env"
    
    if os.path.exists(env_file_path):
        print(f"SUCCESS: Found .env file at: {os.path.abspath(env_file_path)}")
        try:
            with open(env_file_path, 'r') as file:
                for line in file:
                    line = line.strip()
                    # Skip empty lines and comments
                    if line and not line.startswith('#'):
                        # Look for CRUCIBLE_APIKEY=value
                        if line.startswith('CRUCIBLE_APIKEY='):
                            api_key = line.split('=', 1)[1].strip()
                            # Remove quotes if present
                            api_key = api_key.strip('"\'')
                            
                            if api_key:
                                masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***masked***"
                                print(f"SUCCESS: Read CRUCIBLE_APIKEY from .env file: {masked_key}")
                                print(f"API key length: {len(api_key)} characters")
                                return api_key
                            
            print("WARNING: .env file found but no CRUCIBLE_APIKEY=value line found")
                            
        except Exception as e:
            print(f"ERROR reading .env file: {e}")
            
    else:
        print(f"INFO: No .env file found at: {os.path.abspath(env_file_path)}")
    
    # Fallback: Check system environment variables (for cloud deployment)
    print("Checking system environment variables for CRUCIBLE_APIKEY...")
    api_key = os.getenv("CRUCIBLE_APIKEY")
    
    if api_key:
        masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***masked***"
        print(f"SUCCESS: Found CRUCIBLE_APIKEY in system environment: {masked_key}")
        print(f"API key length: {len(api_key)} characters")
        return api_key
    else:
        print("No CRUCIBLE_APIKEY found in system environment variables")
    
    print("FAILURE: No CRUCIBLE_APIKEY found in .env file or system environment")
    print("Please ensure your .env file contains: CRUCIBLE_APIKEY=your_api_key_here")
    print("=== Ending get_crucible_api_key() ===")
    return None

def check_authentication(request: Request) -> Optional[str]:
    """
    Check if user is authenticated with ORCID and return ORCID ID.
    For testing purposes, we'll accept ORCID ID from query parameters when no session is available.
    
    Args:
        request: FastAPI request object containing session data
        
    Returns:
        str: ORCID ID if authenticated, None if not authenticated
    """
    # For testing without session middleware, accept ORCID from query parameter
    orcid_from_query = request.query_params.get("orcid_id")
    if orcid_from_query:
        return orcid_from_query
    
    # Try to get from session if available (when session middleware is enabled)
    try:
        # Try Flask-style session format first: session['user_info']['sub']
        user_info = request.session.get("user_info")
        if user_info and isinstance(user_info, dict):
            orcid_id = user_info.get("sub")
            if orcid_id:
                return orcid_id
        
        # Fallback to current FastAPI format: session['user']
        return request.session.get("user")
    except (AttributeError, AssertionError):
        # No session available (middleware not enabled) or session middleware not installed
        return None

@router.get("/datasets")
async def get_remote_datasets(request: Request, keyword: Optional[str] = Query(None)):
    """
    Get list of available datasets from Crucible API.
    Uses authenticated ORCID session to access user's datasets.
    
    Args:
        request: FastAPI request object for accessing session data
        keyword: Optional keyword to search for specific datasets
        
    Returns:
        JSONResponse: List of datasets available to the authenticated user
        
    Raises:
        HTTPException: 401 if user not authenticated with ORCID
        HTTPException: 500 if remote server error occurs
    """
    print("\n=== Starting get_remote_datasets() ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Please login with ORCID first"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    print(f"Keyword search: {keyword}")
    
    try:
        # Get Crucible API base URL
        remote_base_url = get_remote_base_url()
        
        # Build endpoint URL based on whether we're doing keyword search or listing all
        if keyword:
            endpoint_url = f"{remote_base_url}/datasets_by_keyword/{keyword}"
        else:
            endpoint_url = f"{remote_base_url}/list_datasets"
        
        print(f"Making HTTP request to: {endpoint_url}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found in environment variables")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured. Please set CRUCIBLE_API_KEY environment variable."}
            )
        
        print(f"Using API key for authentication (length: {len(api_key)} chars)")
        
        # Make async HTTP call to Crucible API using API key for auth
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                params={"orcid": orcid_id} if orcid_id else None,  # Pass ORCID as parameter for filtering
                timeout=30.0  # 30 second timeout for remote calls
            )
            
            print(f"Crucible API response status: {response.status_code}")
            
            # Handle different response status codes
            if response.status_code == 200:
                datasets = response.json()
                print(f"=== Successfully retrieved {len(datasets)} datasets ===")
                return JSONResponse(content=datasets)
            else:
                print(f"Crucible API error: {response.status_code}")
                
                # Get the actual error message from the remote API
                try:
                    error_details = response.json()
                    print(f"Crucible API error details: {error_details}")
                except:
                    error_details = {"message": response.text}
                    print(f"Crucible API error text: {response.text}")
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Crucible API returned status {response.status_code}",
                        "remote_error": error_details,
                        "endpoint": endpoint_url,
                        "orcid_used": orcid_id
                    }
                )
                
    except httpx.TimeoutException:
        print("ERROR: Timeout connecting to Crucible API")
        return JSONResponse(
            status_code=504,
            content={"error": "Timeout connecting to Crucible API"}
        )
    except Exception as e:
        print(f"ERROR in get_remote_datasets(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve datasets: {str(e)}"}
        )

@router.get("/datasets/{dataset_id}")
async def get_dataset_details(dataset_id: str, request: Request):
    """
    Get detailed information about a specific dataset from Crucible API.
    
    Args:
        dataset_id: Unique identifier for the dataset
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Detailed dataset information
        
    Raises:
        HTTPException: 401 if user not authenticated with ORCID
        HTTPException: 404 if dataset not found
        HTTPException: 500 if remote server error occurs
    """
    print(f"\n=== Starting get_dataset_details() for ID: {dataset_id} ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    
    try:
        # Get Crucible API base URL and construct dataset detail endpoint
        remote_base_url = get_remote_base_url()
        endpoint_url = f"{remote_base_url}/dataset/{dataset_id}"
        
        print(f"Making HTTP request to: {endpoint_url}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found in environment variables")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured. Please set CRUCIBLE_API_KEY environment variable."}
            )
        
        # Make async HTTP GET call to get dataset details
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                params={"orcid": orcid_id} if orcid_id else None,  # Pass ORCID as parameter for filtering
                timeout=30.0
            )
            
            print(f"Crucible API response status: {response.status_code}")
            
            if response.status_code == 200:
                dataset_info = response.json()
                print("=== Successfully retrieved dataset details ===")
                return JSONResponse(content=dataset_info)
            elif response.status_code == 404:
                print(f"Dataset {dataset_id} not found")
                return JSONResponse(
                    status_code=404,
                    content={"error": f"Dataset {dataset_id} not found"}
                )
            else:
                print(f"Crucible API error: {response.status_code}")
                return JSONResponse(
                    status_code=response.status_code,
                    content={"error": f"Failed to get dataset details with status {response.status_code}"}
                )
                
    except httpx.TimeoutException:
        print("ERROR: Timeout getting dataset details")
        return JSONResponse(
            status_code=504,
            content={"error": "Timeout getting dataset details"}
        )
    except Exception as e:
        print(f"ERROR in get_dataset_details(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get dataset details: {str(e)}"}
        )

def download_dataset_with_rclone(dataset_id: str, orcid_id: str) -> dict:
    """
    Download dataset using rclone (same pattern as dataset_cache.py).
    This works locally and in cloud deployment.
    
    Args:
        dataset_id: Unique identifier for the dataset to download
        orcid_id: User's ORCID ID for directory organization
        
    Returns:
        dict: Success/failure status with file path or error details
    """
    import yaml
    import subprocess
    import json
    
    print(f"\n=== Starting rclone download for dataset: {dataset_id} ===")
    
    try:
        # Load configuration (same pattern as dataset_cache.py)
        config_file = "conf/local_config.yaml"
        if not os.path.exists(config_file):
            return {
                "success": False,
                "error": f"Config file not found: {config_file}. Please ask your team for this file."
            }
            
        with open(config_file, "r") as f:
            config = yaml.safe_load(f)
        
        # Create user directory: user/data/{orcid_id}/{dataset_id}
        local_path = os.path.join("user", "data", orcid_id, dataset_id)
        os.makedirs(local_path, exist_ok=True)
        print(f"Download target: {os.path.abspath(local_path)}")
        
        # Check if already downloaded (same logic as dataset_cache.py)
        metadata_file = os.path.join(local_path, f"{dataset_id}.json")
        if os.path.exists(metadata_file):
            print(f"Dataset {dataset_id} already cached at {local_path}")
            return {
                "success": True,
                "message": "Dataset already downloaded",
                "file_path": os.path.abspath(local_path),
                "cached": True
            }
        
        # Prepare GCS credentials (exact same pattern as dataset_cache.py)
        creds = json.dumps(config['gcs_service_account_credentials']).replace('"', '\\"')
        
        # Build rclone command (exact same pattern as dataset_cache.py)
        cmd_args = [
            "rclone", "sync", "-v",
            f"--gcs-client-id={config['gcs_client_id']}",
            f"--gcs-client-secret={config['gcs_client_secret']}",
            f"--gcs-project-number={config['gcs_project_number']}",
            f'--gcs-service-account-credentials="{creds}"',
            "--gcs-object-acl=projectPrivate",
            "--gcs-bucket-acl=projectPrivate", 
            "--gcs-env-auth=true",
            f":gcs:mf-storage-prod/{dataset_id}",
            local_path
        ]
        
        print(f"Running rclone command...")
        print(f"Source: :gcs:mf-storage-prod/{dataset_id}")
        print(f"Target: {local_path}")
        
        # Execute rclone (same as dataset_cache.py)
        result = subprocess.run(cmd_args, capture_output=True, text=True, check=True)
        
        # Check what was downloaded
        downloaded_files = []
        for root, dirs, files in os.walk(local_path):
            for file in files:
                file_path = os.path.join(root, file)
                file_size = os.path.getsize(file_path)
                downloaded_files.append({
                    "name": file,
                    "path": file_path,
                    "size": file_size
                })
        
        print(f"=== Successfully downloaded {len(downloaded_files)} files ===")
        
        return {
            "success": True,
            "message": f"Dataset {dataset_id} downloaded successfully using rclone",
            "file_path": os.path.abspath(local_path),
            "downloaded_files": downloaded_files,
            "rclone_output": result.stdout
        }
        
    except subprocess.CalledProcessError as e:
        print(f"rclone command failed: {e}")
        return {
            "success": False,
            "error": f"rclone download failed: {e.stdout if e.stdout else e.stderr}",
            "rclone_error": str(e)
        }
    except Exception as e:
        print(f"ERROR in rclone download: {e}")
        return {
            "success": False,
            "error": f"Download failed: {str(e)}"
        }

@router.post("/datasets/{dataset_id}/download")
async def download_dataset(dataset_id: str, request: Request):
    """
    Download a specific dataset using rclone (same method as your team's dataset_cache.py).
    This bypasses the API download limitations and downloads directly from GCS.
    
    Args:
        dataset_id: Unique identifier for the dataset to download
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Success message with file path, or error details
        
    Raises:
        HTTPException: 401 if user not authenticated with ORCID
        HTTPException: 500 if rclone download fails
    """
    print(f"\n=== Starting download_dataset() for ID: {dataset_id} ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    print("Using rclone download method (same as dataset_cache.py)")
    
    # Use the rclone download function (same pattern as your team uses)
    download_result = download_dataset_with_rclone(dataset_id, orcid_id)
    
    if download_result["success"]:
        print("=== rclone download completed successfully ===")
        return JSONResponse(content=download_result)
    else:
        print(f"=== rclone download failed: {download_result['error']} ===")
        
        # Check if it's a config file issue
        if "Config file not found" in download_result["error"]:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "rclone configuration missing",
                    "details": download_result["error"],
                    "solution": "Please ask your team for the conf/local_config.yaml file that contains GCS credentials"
                }
            )
        
        return JSONResponse(
            status_code=500,
            content=download_result
        )

@router.get("/discover")
async def discover_remote_endpoints(request: Request):
    """
    Discover available endpoints on the remote Crucible API.
    Uses common API discovery techniques to find available operations.
    
    Args:
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Information about discovered endpoints and their capabilities
        
    Raises:
        HTTPException: 401 if user not authenticated with ORCID
        HTTPException: 500 if discovery fails
    """
    print("\n=== Starting discover_remote_endpoints() ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    
    try:
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured"}
            )
        
        # Perform API discovery
        discovery_results = await discover_api_endpoints(api_key)
        
        print(f"=== Successfully discovered API information ===")
        print(f"Found {len(discovery_results['potential_endpoints'])} potential endpoints")
        
        return JSONResponse(content={
            "success": True,
            "orcid": orcid_id,
            "discovery_results": discovery_results
        })
        
    except Exception as e:
        print(f"ERROR in discover_remote_endpoints(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to discover endpoints: {str(e)}"}
        )

@router.get("/datasets/{dataset_id}/location")
async def get_dataset_location(dataset_id: str, request: Request):
    """
    Get the storage location/file path for a specific dataset using the discovered API endpoint.
    This might provide download URLs or file access information.
    
    Args:
        dataset_id: Unique identifier for the dataset
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Dataset location information (might include download URLs)
        
    Raises:
        HTTPException: 401 if user not authenticated with ORCID
        HTTPException: 404 if dataset location not found
        HTTPException: 500 if remote server error occurs
    """
    print(f"\n=== Starting get_dataset_location() for ID: {dataset_id} ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    
    try:
        # Get Crucible API base URL and construct location endpoint (discovered from OpenAPI)
        remote_base_url = get_remote_base_url()
        endpoint_url = f"{remote_base_url}/dataset_location/{dataset_id}"
        
        print(f"Making HTTP request to: {endpoint_url}")
        print(f"Note: OpenAPI spec shows parameter as {{pid}}, using dataset_id: {dataset_id}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured"}
            )
        
        # Make async HTTP GET call to get dataset location
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                params={"orcid": orcid_id} if orcid_id else None,
                timeout=30.0
            )
            
            print(f"Crucible API location response status: {response.status_code}")
            
            if response.status_code == 200:
                location_info = response.json()
                print("=== Successfully retrieved dataset location ===")
                print(f"Location info: {location_info}")
                
                # Check if location info contains downloadable URLs
                if isinstance(location_info, dict):
                    possible_urls = []
                    for key, value in location_info.items():
                        if isinstance(value, str) and any(protocol in value.lower() for protocol in ['http', 'gs://', 'gcs://', 's3://', 'file://']):
                            possible_urls.append({"key": key, "url": value})
                    
                    if possible_urls:
                        print(f"Found potential download URLs: {possible_urls}")
                
                return JSONResponse(content={
                    "success": True,
                    "dataset_id": dataset_id,
                    "location_info": location_info,
                    "potential_download_urls": possible_urls if 'possible_urls' in locals() else []
                })
                
            elif response.status_code == 404:
                print(f"Dataset location {dataset_id} not found")
                return JSONResponse(
                    status_code=404,
                    content={"error": f"Dataset location {dataset_id} not found"}
                )
            else:
                print(f"Crucible API location error: {response.status_code}")
                try:
                    error_details = response.json()
                    print(f"Location error details: {error_details}")
                except:
                    error_details = {"message": response.text}
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Failed to get dataset location with status {response.status_code}",
                        "remote_error": error_details
                    }
                )
                
    except httpx.TimeoutException:
        print("ERROR: Timeout getting dataset location")
        return JSONResponse(
            status_code=504,
            content={"error": "Timeout getting dataset location"}
        )
    except Exception as e:
        print(f"ERROR in get_dataset_location(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get dataset location: {str(e)}"}
        )

@router.get("/datasets/{dataset_id}/metadata")
async def get_dataset_with_metadata(dataset_id: str, request: Request):
    """
    Get dataset with full metadata (discovered endpoint) - might contain file URLs.
    
    Args:
        dataset_id: Unique identifier for the dataset
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Dataset with complete metadata (might include download links)
    """
    print(f"\n=== Starting get_dataset_with_metadata() for ID: {dataset_id} ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    
    try:
        # Get Crucible API base URL - using discovered endpoint
        remote_base_url = get_remote_base_url()
        endpoint_url = f"{remote_base_url}/dataset_with_metadata/{dataset_id}"
        
        print(f"Making HTTP request to: {endpoint_url}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured"}
            )
        
        # Make async HTTP GET call
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                params={"orcid": orcid_id} if orcid_id else None,
                timeout=30.0
            )
            
            print(f"Crucible API metadata response status: {response.status_code}")
            
            if response.status_code == 200:
                metadata_info = response.json()
                print("=== Successfully retrieved dataset metadata ===")
                
                # Look for potential file URLs in the metadata
                potential_urls = []
                if isinstance(metadata_info, dict):
                    def find_urls_in_dict(data, path=""):
                        for key, value in data.items():
                            current_path = f"{path}.{key}" if path else key
                            if isinstance(value, str):
                                if any(protocol in value.lower() for protocol in ['http', 'gs://', 'gcs://', 's3://', 'file://', '.emd', '.dm3', '.dm4']):
                                    potential_urls.append({"path": current_path, "value": value})
                            elif isinstance(value, dict):
                                find_urls_in_dict(value, current_path)
                            elif isinstance(value, list):
                                for i, item in enumerate(value):
                                    if isinstance(item, dict):
                                        find_urls_in_dict(item, f"{current_path}[{i}]")
                    
                    find_urls_in_dict(metadata_info)
                
                if potential_urls:
                    print(f"Found potential file URLs in metadata: {potential_urls}")
                
                return JSONResponse(content={
                    "success": True,
                    "dataset_id": dataset_id,
                    "metadata": metadata_info,
                    "potential_file_urls": potential_urls
                })
                
            else:
                print(f"Crucible API metadata error: {response.status_code}")
                try:
                    error_details = response.json()
                except:
                    error_details = {"message": response.text}
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Failed to get dataset metadata with status {response.status_code}",
                        "remote_error": error_details
                    }
                )
                
    except Exception as e:
        print(f"ERROR in get_dataset_with_metadata(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get dataset metadata: {str(e)}"}
        )

@router.get("/user/{orcid_id}/datasets")  
async def get_user_datasets(orcid_id: str, request: Request):
    """
    Get datasets specific to a user using discovered endpoint.
    This might show different permissions or additional dataset info.
    
    Args:
        orcid_id: ORCID ID of the user (can be current user or admin query)
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: User-specific dataset list with potentially different permissions
    """
    print(f"\n=== Starting get_user_datasets() for ORCID: {orcid_id} ===")
    
    # Check ORCID authentication
    authenticated_orcid = check_authentication(request)
    if not authenticated_orcid:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {authenticated_orcid}")
    print(f"Requesting datasets for ORCID: {orcid_id}")
    
    try:
        # Get Crucible API base URL - using discovered endpoint
        remote_base_url = get_remote_base_url()
        endpoint_url = f"{remote_base_url}/user/{orcid_id}/datasets"
        
        print(f"Making HTTP request to: {endpoint_url}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured"}
            )
        
        # Make async HTTP GET call
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            print(f"Crucible API user datasets response status: {response.status_code}")
            
            if response.status_code == 200:
                user_datasets = response.json()
                print(f"=== Successfully retrieved user datasets: {len(user_datasets) if isinstance(user_datasets, list) else 'unknown count'} ===")
                
                return JSONResponse(content={
                    "success": True,
                    "requested_orcid": orcid_id,
                    "authenticated_orcid": authenticated_orcid,
                    "datasets": user_datasets
                })
                
            else:
                print(f"Crucible API user datasets error: {response.status_code}")
                try:
                    error_details = response.json()
                except:
                    error_details = {"message": response.text}
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Failed to get user datasets with status {response.status_code}",
                        "remote_error": error_details
                    }
                )
                
    except Exception as e:
        print(f"ERROR in get_user_datasets(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get user datasets: {str(e)}"}
        )

@router.post("/datasets/{dataset_id}/drive-location")
async def get_dataset_drive_location(dataset_id: str, request: Request):
    """
    Get Google Drive location for a dataset using discovered POST endpoint.
    This might provide actual download URLs or trigger download preparation.
    
    Args:
        dataset_id: Unique identifier for the dataset
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Drive location information (might include download URLs)
    """
    print(f"\n=== Starting get_dataset_drive_location() for ID: {dataset_id} ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    
    try:
        # Get Crucible API base URL - using discovered POST endpoint
        remote_base_url = get_remote_base_url()
        endpoint_url = f"{remote_base_url}/dataset_drive_location/{dataset_id}"
        
        print(f"Making HTTP POST request to: {endpoint_url}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured"}
            )
        
        # Make async HTTP POST call (as discovered in API spec)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={"orcid": orcid_id} if orcid_id else {},  # Send ORCID in body for POST
                timeout=30.0
            )
            
            print(f"Crucible API drive location response status: {response.status_code}")
            
            if response.status_code == 200:
                drive_location_info = response.json()
                print("=== Successfully retrieved dataset drive location ===")
                print(f"Drive location info: {drive_location_info}")
                
                # Look for download URLs in the response
                potential_urls = []
                if isinstance(drive_location_info, dict):
                    for key, value in drive_location_info.items():
                        if isinstance(value, str) and any(protocol in value.lower() for protocol in ['http', 'drive.google.com', 'googleapis.com', 'storage.cloud.google.com']):
                            potential_urls.append({"key": key, "url": value})
                
                return JSONResponse(content={
                    "success": True,
                    "dataset_id": dataset_id,
                    "drive_location_info": drive_location_info,
                    "potential_urls": potential_urls
                })
                
            else:
                print(f"Crucible API drive location error: {response.status_code}")
                try:
                    error_details = response.json()
                except:
                    error_details = {"message": response.text}
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Failed to get dataset drive location with status {response.status_code}",
                        "remote_error": error_details
                    }
                )
                
    except Exception as e:
        print(f"ERROR in get_dataset_drive_location(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get dataset drive location: {str(e)}"}
        )

@router.get("/datasets/{dataset_id}/access/{orcid_id}")
async def get_dataset_access_for_user(dataset_id: str, orcid_id: str, request: Request):
    """
    Check what access a user has to a specific dataset using discovered endpoint.
    This might explain why location data is empty.
    
    Args:
        dataset_id: Unique identifier for the dataset  
        orcid_id: ORCID ID to check access for
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Access information for the user/dataset combination
    """
    print(f"\n=== Starting get_dataset_access_for_user() for dataset: {dataset_id}, orcid: {orcid_id} ===")
    
    # Check ORCID authentication
    authenticated_orcid = check_authentication(request)
    if not authenticated_orcid:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {authenticated_orcid}")
    
    try:
        # Get Crucible API base URL - using discovered endpoint
        remote_base_url = get_remote_base_url()
        endpoint_url = f"{remote_base_url}/dataset_access_for_user/{dataset_id}/{orcid_id}"
        
        print(f"Making HTTP GET request to: {endpoint_url}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured"}
            )
        
        # Make async HTTP GET call
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            print(f"Crucible API access response status: {response.status_code}")
            
            if response.status_code == 200:
                access_info = response.json()
                print("=== Successfully retrieved dataset access info ===")
                print(f"Access info: {access_info}")
                
                return JSONResponse(content={
                    "success": True,
                    "dataset_id": dataset_id,
                    "orcid_id": orcid_id,
                    "authenticated_orcid": authenticated_orcid,
                    "access_info": access_info
                })
                
            else:
                print(f"Crucible API access error: {response.status_code}")
                try:
                    error_details = response.json()
                except:
                    error_details = {"message": response.text}
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Failed to get dataset access with status {response.status_code}",
                        "remote_error": error_details
                    }
                )
                
    except Exception as e:
        print(f"ERROR in get_dataset_access_for_user(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get dataset access: {str(e)}"}
        )

@router.get("/user/apikey")
async def get_user_apikey_info(request: Request):
    """
    Get information about the current user's API key permissions using discovered endpoint.
    This might explain what access level we have.
    
    Args:
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: API key information and permissions
    """
    print(f"\n=== Starting get_user_apikey_info() ===")
    
    # Check ORCID authentication
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("ERROR: User not authenticated with ORCID")
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with ORCID"}
        )
    
    print(f"Authenticated user ORCID: {orcid_id}")
    
    try:
        # Get Crucible API base URL - using discovered endpoint
        remote_base_url = get_remote_base_url()
        endpoint_url = f"{remote_base_url}/user_apikey"
        
        print(f"Making HTTP GET request to: {endpoint_url}")
        
        # Get the Crucible API key for authentication
        api_key = get_crucible_api_key()
        if not api_key:
            print("ERROR: No Crucible API key found")
            return JSONResponse(
                status_code=500,
                content={"error": "Crucible API key not configured"}
            )
        
        # Make async HTTP GET call
        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            print(f"Crucible API key info response status: {response.status_code}")
            
            if response.status_code == 200:
                apikey_info = response.json()
                print("=== Successfully retrieved API key info ===")
                print(f"API key info: {apikey_info}")
                
                return JSONResponse(content={
                    "success": True,
                    "orcid_id": orcid_id,
                    "apikey_info": apikey_info
                })
                
            else:
                print(f"Crucible API key info error: {response.status_code}")
                try:
                    error_details = response.json()
                except:
                    error_details = {"message": response.text}
                
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Failed to get API key info with status {response.status_code}",
                        "remote_error": error_details
                    }
                )
                
    except Exception as e:
        print(f"ERROR in get_user_apikey_info(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get API key info: {str(e)}"}
        )

@router.post("/test-rclone-download")
async def test_rclone_download_endpoint(request: Request):
    """
    Test rclone download functionality using hardcoded dataset ID.
    This endpoint tests the direct GCS download using rclone.
    
    Args:
        request: FastAPI request object for accessing session data
        
    Returns:
        JSONResponse: Success/failure status of rclone download test
    """
    print(f"\n=== Starting test_rclone_download_endpoint() ===")
    
    # Check ORCID authentication (optional for testing)
    orcid_id = check_authentication(request)
    if not orcid_id:
        print("WARNING: No ORCID authentication found, proceeding with test anyway")
        orcid_id = "test-user"
    
    print(f"Testing rclone download for user: {orcid_id}")
    
    try:
        # Call the test function from remote_download.py
        print("Calling test_rclone_download() function...")
        success = test_rclone_download()
        
        if success:
            print("=== rclone test completed successfully ===")
            return JSONResponse(content={
                "success": True,
                "message": "rclone download test completed successfully!",
                "details": "Check the backend console for detailed output and ./downloads/ directory for downloaded files",
                "test_dataset": "0t4h5d3xc1tdq00023ew6czsbc",
                "download_location": "./downloads/0t4h5d3xc1tdq00023ew6czsbc/",
                "note": "This test uses hardcoded dataset ID and downloads to backend/downloads/ directory"
            })
        else:
            print("=== rclone test failed ===")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "rclone download test failed",
                    "details": "Check the backend console for error details",
                    "common_issues": [
                        "Missing GCS credentials in .env file",
                        "rclone.exe not found in backend directory", 
                        "Invalid GCS service account credentials",
                        "Network connectivity issues"
                    ],
                    "required_env_vars": [
                        "GCS_CLIENT_ID",
                        "GCS_CLIENT_SECRET", 
                        "GCS_PROJECT_NUMBER",
                        "GCS_SA (JSON service account credentials)"
                    ]
                }
            )
        
    except Exception as e:
        print(f"ERROR in test_rclone_download_endpoint(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Test endpoint error: {str(e)}",
                "details": "Check backend console for full error details"
            }
        )

