"""
Remote Download Module using Google Cloud Storage Python Client
-----------------------------------------------------------
This module handles downloading datasets directly from Google Cloud Storage using the official client library.
"""

import os
import yaml
import json
from google.cloud import storage



def download_dataset_with_gcs(dsid, credentials=None, target_dir="./downloads"):
    """
    Check if a dataset is cached in target_dir
    if not copy from GCP bucket using Google Cloud Storage client
    """
    try:
        download_path = os.path.join(target_dir, dsid)
        os.makedirs(download_path, exist_ok=True)

        if os.path.exists(os.path.join(download_path, f"{dsid}.json")):
            print(f"Dataset {dsid} already cached at {download_path}")
            return True

        print(f"Downloading dataset {dsid} to {download_path}")
        
        print("\nInitializing GCS client...")
        # Create a temporary file with the service account credentials
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_sa:
            json.dump(credentials['gcs_service_account_credentials'], temp_sa)
            temp_sa_path = temp_sa.name
            
        try:
            # Initialize GCS client from the temporary credentials file
            client = storage.Client.from_service_account_json(temp_sa_path)
        finally:
            # Clean up the temporary file
            os.unlink(temp_sa_path)
        print(f"Client initialized with project: {client.project}")
        
        print("\nAccessing bucket...")
        # Get bucket and list all blobs with dataset prefix
        bucket = client.bucket('mf-storage-prod')
        print(f"Looking for files with prefix: {dsid}/")
        blobs = bucket.list_blobs(prefix=f"{dsid}/")
        
        # Convert blobs iterator to list and check if empty
        blob_list = list(blobs)
        if not blob_list:
            print(f"\nERROR: No files found with prefix {dsid}/")
            print("This could mean:")
            print("1. The dataset ID is incorrect")
            print("2. The bucket name is incorrect")
            print("3. The service account doesn't have access to this bucket/path")
            return False
            
        print(f"\nFound {len(blob_list)} files to download:")
        for blob in blob_list:
            print(f"- {blob.name} ({blob.size} bytes)")
            
        # Download each file
        files_downloaded = 0
        for blob in blob_list:
            try:
                # Get the relative path within the dataset
                rel_path = blob.name[len(f"{dsid}/"):]
                if not rel_path:  # Skip the directory itself
                    continue
                    
                # Create subdirectories if needed
                file_path = os.path.join(download_path, rel_path)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                
                # Download the file
                print(f"\nDownloading {blob.name} to {file_path}")
                print(f"Size: {blob.size} bytes")
                print(f"Content type: {blob.content_type}")
                print(f"Created: {blob.time_created}")
                
                blob.download_to_filename(file_path)
                files_downloaded += 1
                print("Download successful")
                
            except Exception as e:
                print(f"\nERROR downloading {blob.name}: {e}")
                continue
            
        if files_downloaded > 0:
            print(f"\nSuccessfully downloaded {files_downloaded} files")
            return True
        else:
            print("\nERROR: No files were downloaded successfully")
            return False
        
    except Exception as e:
        print(f"\nERROR downloading dataset: {str(e)}")
        if hasattr(e, 'response'):
            print("Response details:")
            print(f"Status: {e.response.status_code}")
            print(f"Headers: {e.response.headers}")
            print(f"Content: {e.response.content}")
        return False

def test_rclone_download():
    """
    Test download with hardcoded dataset ID
    """
    # Load config exactly like COPIEDdataset_cache.py does
    env_config_file = "secrets/local_config.yaml"
    with open(env_config_file, "r") as f:
        config = yaml.safe_load(f)    
    
    # Test with hardcoded dataset ID
    test_dsid = "0t4h5de6y9v4h000624j7xaj6w"
    print(f"Testing download for dataset: {test_dsid}")
    
    # Attempt download
    success = download_dataset_with_gcs(test_dsid, config)
    print("Download test completed")
    return success

if __name__ == '__main__':
    """
    Main execution: Test download functionality
    """
    success = test_rclone_download()
    print(f"Test {'succeeded' if success else 'failed'}")
