import yaml
import subprocess as sp
import json
import os

def run_shell(cmd):
    return(sp.run(cmd, stdout=sp.PIPE, stderr=sp.PIPE, shell=True, universal_newlines=True, check=True))

def download_dataset_with_rclone(dsid, config, target_dir="./downloads"):
    """
    Check if a dataset is cached in target_dir
    if not copy from GCP bucket using rclone
    """
    download_path = os.path.join(target_dir, dsid)
    os.makedirs(download_path, exist_ok=True)

    if os.path.exists(os.path.join(download_path, f"{dsid}.json")):
        print(f"Dataset {dsid} already cached at {download_path}")
        return True

    print(f"dataset_cache {repr(dsid)=} ")
    creds = json.dumps(config['gcs_service_account_credentials']).replace('"', '\\"')

    cmd_args = ["rclone sync -v", 
        f"--gcs-client-id={config['gcs_client_id']}" ,
        f"--gcs-client-secret={config['gcs_client_secret']}",
        f"--gcs-project-number={config['gcs_project_number']}",
        f'--gcs-service-account-credentials="{creds}"',
        "--gcs-object-acl=projectPrivate",
        "--gcs-bucket-acl=projectPrivate",
        "--gcs-env-auth=true" ,
        f":gcs:mf-storage-prod/{dsid} {download_path}"
    ]

    try:
        result = run_shell("   ".join(cmd_args))
        print(f"Download completed successfully")
        return True
    except Exception as e:
        print(f"Error downloading dataset: {e}")
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
    test_dsid = "0t4h5d3xc1tdq00023ew6czsbc"
    print(f"Testing download for dataset: {test_dsid}")
    
    # Attempt download
    success = download_dataset_with_rclone(test_dsid, config)
    print("Download test completed")
    return success

if __name__ == '__main__':
    """
    Main execution: Test download functionality
    """
    success = test_rclone_download()
    print(f"Test {'succeeded' if success else 'failed'}")