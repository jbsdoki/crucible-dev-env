"""
Simple User Manager

Handles multi-user sessions and file operations with minimal complexity.
Designed for easy expansion when additional features are needed.

Core Features:
- User directory management
- Remote file listing via ORCID ID
- File downloads from remote server
- Basic session cleanup (3-hour timeout)
- User limit enforcement (max 10 users)
"""

import os
import time
import shutil
import requests
from typing import List, Optional, Dict, Any


class UserManager:
    """
    Simple user session and file management.
    
    Handles user workspaces, remote file operations, and basic cleanup.
    Designed to be minimal but easily expandable.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the user manager.
        
        Args:
            config: Optional configuration dict for easy expansion
        """
        # Core settings (easily configurable for expansion)
        self.base_dir = config.get('base_dir', 'user_data') if config else 'user_data'
        self.max_users = config.get('max_users', 10) if config else 10
        self.session_hours = config.get('session_hours', 3) if config else 3
        self.remote_server = config.get('remote_server') if config else None
        
        # Supported file extensions
        self.supported_extensions = ('.emd', '.tif', '.dm3', '.dm4', '.ser', '.emi')
        
        # Ensure base directory exists
        os.makedirs(self.base_dir, exist_ok=True)
        
        print(f"[UserManager] Initialized - Max users: {self.max_users}, Session timeout: {self.session_hours}h")
    
    def get_user_directory(self, user_id: str) -> str:
        """
        Get or create user directory.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            str: Path to user's directory
        """
        # Ensure we don't exceed user limits before creating new directories
        self._enforce_user_limit()
        
        # Create user directory (sanitize user_id for filesystem safety)
        safe_user_id = self._sanitize_user_id(user_id)
        user_dir = os.path.join(self.base_dir, safe_user_id)
        os.makedirs(user_dir, exist_ok=True)
        
        return user_dir
    
    def get_user_file_list(self, user_id: str, orcid_id: str) -> List[str]:
        """
        Get list of files for user from remote server.
        
        Args:
            user_id: Unique user identifier
            orcid_id: User's ORCID ID for remote server
            
        Returns:
            List[str]: List of available filenames
        """
        print(f"[UserManager] Getting file list for user {user_id} with ORCID {orcid_id}")
        
        # Ensure user directory exists
        self.get_user_directory(user_id)
        
        # If no remote server configured, return empty list for development
        if not self.remote_server:
            print("[UserManager] No remote server configured - development mode")
            return []
        
        try:
            # Call remote FastAPI server with ORCID ID
            response = requests.get(
                f"{self.remote_server}/user-files",
                headers={"ORCID-ID": orcid_id},
                timeout=10
            )
            
            if response.status_code == 200:
                file_data = response.json()
                files = file_data.get('files', [])
                print(f"[UserManager] Retrieved {len(files)} files from remote server")
                return files
            else:
                print(f"[UserManager] Remote server returned status {response.status_code}")
                return []
                
        except Exception as e:
            print(f"[UserManager] Error fetching files from remote server: {str(e)}")
            return []
    
    def download_user_file(self, user_id: str, orcid_id: str, filename: str) -> Optional[str]:
        """
        Download a specific file for user from remote server.
        
        Args:
            user_id: Unique user identifier
            orcid_id: User's ORCID ID for remote server
            filename: Name of file to download
            
        Returns:
            Optional[str]: Local path to downloaded file, or None if failed
        """
        print(f"[UserManager] Downloading file {filename} for user {user_id}")
        
        # Get user directory
        user_dir = self.get_user_directory(user_id)
        local_path = os.path.join(user_dir, filename)
        
        # Check if file already exists locally
        if os.path.exists(local_path):
            print(f"[UserManager] File {filename} already exists locally")
            return local_path
        
        # If no remote server configured, return None
        if not self.remote_server:
            print("[UserManager] No remote server configured - cannot download")
            return None
        
        try:
            # Download file from remote server
            response = requests.get(
                f"{self.remote_server}/download-file/{filename}",
                headers={"ORCID-ID": orcid_id},
                timeout=60  # Longer timeout for file downloads
            )
            
            if response.status_code == 200:
                # Save file to user directory
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                
                print(f"[UserManager] Successfully downloaded {filename} to {local_path}")
                return local_path
            else:
                print(f"[UserManager] Failed to download {filename}: status {response.status_code}")
                return None
                
        except Exception as e:
            print(f"[UserManager] Error downloading file {filename}: {str(e)}")
            return None
    
    def get_local_file_path(self, user_id: str, filename: str) -> Optional[str]:
        """
        Get path to locally stored file for user.
        
        Args:
            user_id: Unique user identifier
            filename: Name of file
            
        Returns:
            Optional[str]: Path to file if it exists locally, None otherwise
        """
        user_dir = self.get_user_directory(user_id)
        file_path = os.path.join(user_dir, filename)
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return file_path
        
        return None
    
    def get_user_local_files(self, user_id: str) -> List[str]:
        """
        Get list of files currently stored locally for user.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            List[str]: List of local filenames
        """
        user_dir = self.get_user_directory(user_id)
        
        try:
            files = [
                f for f in os.listdir(user_dir)
                if (os.path.isfile(os.path.join(user_dir, f)) and
                    f.lower().endswith(self.supported_extensions))
            ]
            return sorted(files)
        except Exception as e:
            print(f"[UserManager] Error listing local files for user {user_id}: {str(e)}")
            return []
    
    def cleanup_old_sessions(self) -> int:
        """
        Remove user directories older than session timeout.
        
        Returns:
            int: Number of sessions cleaned up
        """
        print("[UserManager] Starting session cleanup...")
        
        if not os.path.exists(self.base_dir):
            return 0
        
        cleanup_count = 0
        cutoff_time = time.time() - (self.session_hours * 3600)
        
        try:
            for item in os.listdir(self.base_dir):
                item_path = os.path.join(self.base_dir, item)
                
                if os.path.isdir(item_path):
                    # Use directory creation time as session age
                    dir_age = os.path.getctime(item_path)
                    
                    if dir_age < cutoff_time:
                        print(f"[UserManager] Removing expired session: {item}")
                        shutil.rmtree(item_path, ignore_errors=True)
                        cleanup_count += 1
            
            print(f"[UserManager] Cleanup complete - removed {cleanup_count} expired sessions")
            return cleanup_count
            
        except Exception as e:
            print(f"[UserManager] Error during cleanup: {str(e)}")
            return cleanup_count
    
    def get_active_user_count(self) -> int:
        """
        Get current number of active users.
        
        Returns:
            int: Number of user directories
        """
        if not os.path.exists(self.base_dir):
            return 0
        
        try:
            user_dirs = [
                item for item in os.listdir(self.base_dir)
                if os.path.isdir(os.path.join(self.base_dir, item))
            ]
            return len(user_dirs)
        except Exception as e:
            print(f"[UserManager] Error counting users: {str(e)}")
            return 0
    
    def get_files_for_user(self, user_id: str, orcid_id: str = None) -> List[str]:
        """
        Development bridge method: Get files for user from local or remote sources.
        
        This method provides a bridge between the new multi-user system and existing
        sample_data directory until full remote integration is complete.
        
        Args:
            user_id: Unique user identifier
            orcid_id: User's ORCID ID (for future remote server calls)
            
        Returns:
            List[str]: List of available filenames for the user
        """
        print(f"[UserManager] Getting files for user {user_id}")
        
        # First, check if user already has local files
        local_files = self.get_user_local_files(user_id)
        if local_files:
            print(f"[UserManager] User {user_id} has {len(local_files)} local files")
            return local_files
        
        # If remote server is configured and orcid_id provided, try remote
        if self.remote_server and orcid_id:
            remote_files = self.get_user_file_list(user_id, orcid_id)
            if remote_files:
                return remote_files
        
        # Development fallback: Copy from sample_data
        print(f"[UserManager] No local/remote files found, copying from sample_data for user {user_id}")
        copied_files = self._copy_sample_files_to_user(user_id)
        return copied_files
    
    def _copy_sample_files_to_user(self, user_id: str, sample_dir: str = "sample_data") -> List[str]:
        """
        Internal method: Copy files from sample_data directory to user directory.
        
        Args:
            user_id: Unique user identifier
            sample_dir: Directory containing sample files
            
        Returns:
            List[str]: List of files copied
        """
        if not os.path.exists(sample_dir):
            print(f"[UserManager] Sample directory {sample_dir} does not exist")
            return []
        
        user_dir = self.get_user_directory(user_id)
        copied_files = []
        
        try:
            sample_files = [
                f for f in os.listdir(sample_dir)
                if f.lower().endswith(self.supported_extensions)
            ]
            
            # Copy first file only (respecting 1 file per user limit)
            if sample_files:
                filename = sample_files[0]
                source_path = os.path.join(sample_dir, filename)
                dest_path = os.path.join(user_dir, filename)
                
                # Only copy if not already exists
                if not os.path.exists(dest_path):
                    shutil.copy2(source_path, dest_path)
                    print(f"[UserManager] Copied {filename} to user {user_id} directory")
                
                copied_files.append(filename)
            
            return copied_files
            
        except Exception as e:
            print(f"[UserManager] Error copying sample files: {str(e)}")
            return []
    
    def copy_sample_files_for_testing(self, user_id: str, sample_dir: str = "sample_data") -> List[str]:
        """
        Copy files from sample_data directory for development/testing.
        
        Args:
            user_id: Unique user identifier
            sample_dir: Directory containing sample files
            
        Returns:
            List[str]: List of files copied
        """
        print(f"[UserManager] Copying sample files for testing user {user_id}")
        return self._copy_sample_files_to_user(user_id, sample_dir)
    
    def _enforce_user_limit(self) -> None:
        """
        Ensure we don't exceed maximum user limit.
        Remove oldest user directory if limit would be exceeded.
        """
        current_count = self.get_active_user_count()
        
        if current_count >= self.max_users:
            print(f"[UserManager] User limit ({self.max_users}) reached, removing oldest user")
            self._remove_oldest_user()
    
    def _remove_oldest_user(self) -> bool:
        """
        Remove the oldest user directory.
        
        Returns:
            bool: True if a user was removed
        """
        if not os.path.exists(self.base_dir):
            return False
        
        try:
            user_dirs = [
                item for item in os.listdir(self.base_dir)
                if os.path.isdir(os.path.join(self.base_dir, item))
            ]
            
            if not user_dirs:
                return False
            
            # Find oldest directory by creation time
            oldest_dir = min(user_dirs, 
                           key=lambda d: os.path.getctime(os.path.join(self.base_dir, d)))
            
            oldest_path = os.path.join(self.base_dir, oldest_dir)
            shutil.rmtree(oldest_path, ignore_errors=True)
            
            print(f"[UserManager] Removed oldest user directory: {oldest_dir}")
            return True
            
        except Exception as e:
            print(f"[UserManager] Error removing oldest user: {str(e)}")
            return False
    
    def _sanitize_user_id(self, user_id: str) -> str:
        """
        Sanitize user ID for filesystem and SQL safety.
        
        Provides protection against:
        - Directory traversal attacks (../, /, \)
        - SQL injection attempts
        - Command injection
        - Path manipulation
        - Special character attacks
        
        Args:
            user_id: Raw user identifier
            
        Returns:
            str: Sanitized user identifier safe for filesystem and database use
            
        Raises:
            ValueError: If user_id is invalid or results in empty string after sanitization
        """
        if not user_id or not isinstance(user_id, str):
            raise ValueError("User ID must be a non-empty string")
        
        # Convert to lowercase for consistency
        user_id = user_id.lower().strip()
        
        # Check for common SQL injection patterns
        sql_injection_patterns = [
            'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter',
            'union', 'where', 'from', 'join', 'exec', 'execute', 'sp_',
            'xp_', 'cmdshell', 'script', '/*', '*/', '--', ';', 'waitfor',
            'delay', 'benchmark', 'sleep', 'pg_sleep', 'information_schema',
            'sys.', 'master.', 'msdb.', 'tempdb.', '@@', 'char(', 'nchar(',
            'varchar(', 'nvarchar(', 'cast(', 'convert(', 'substring(',
            'ascii(', 'len(', 'reverse(', 'replace('
        ]
        
        # Check for SQL injection attempts
        user_id_check = user_id.replace(' ', '').replace('_', '').replace('-', '')
        for pattern in sql_injection_patterns:
            if pattern in user_id_check:
                print(f"[UserManager] WARNING: Potential SQL injection attempt detected in user_id: {pattern}")
                # Don't include the actual user_id in logs for security
                raise ValueError("Invalid user ID format detected")
        
        # Remove path traversal attempts
        dangerous_patterns = ['..', '/', '\\', '~', '$', '`', '|', '&', ';', 
                            '(', ')', '[', ']', '{', '}', '<', '>', '*', '?',
                            '%', '#', '@', '!', '^', '+', '=', '"', "'",
                            '\x00', '\r', '\n', '\t']
        
        for pattern in dangerous_patterns:
            user_id = user_id.replace(pattern, '')
        
        # Only allow alphanumeric characters, underscores, and hyphens
        safe_id = ''.join(c for c in user_id if c.isalnum() or c in '_-')
        
        # Remove leading/trailing underscores and hyphens
        safe_id = safe_id.strip('_-')
        
        # Ensure it doesn't start with reserved prefixes
        reserved_prefixes = ['con', 'prn', 'aux', 'nul', 'com', 'lpt', 'admin', 'root', 'system', 'user']
        if any(safe_id.startswith(prefix) for prefix in reserved_prefixes):
            safe_id = f"usr_{safe_id}"
        
        # Length validation
        if len(safe_id) < 3:
            raise ValueError("User ID too short after sanitization (minimum 3 characters)")
        
        if len(safe_id) > 50:
            # Truncate but ensure uniqueness
            safe_id = safe_id[:47] + "_tr"  # "_tr" indicates truncated
        
        # Final validation - ensure result is safe
        if not safe_id or not safe_id.replace('_', '').replace('-', '').isalnum():
            raise ValueError("User ID resulted in invalid format after sanitization")
        
        return safe_id


# Global instance for easy import
user_manager = UserManager()