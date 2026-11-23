import json
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY_FILE = r"D:\unihub\playstore-assets\play-service-account.json"
PACKAGE_NAME = "com.megatech.unihub"

def main():
    print("Testing Google Play Developer API connection via Service Account...")
    try:
        credentials = service_account.Credentials.from_service_account_file(
            KEY_FILE,
            scopes=["https://www.googleapis.com/auth/androidpublisher"]
        )
        service = build("androidpublisher", "v3", credentials=credentials)
        print("API Client initialized successfully.")
        
        # Test listing or getting app details
        print(f"Checking package: {PACKAGE_NAME}...")
        try:
            edit_request = service.edits().insert(body={}, packageName=PACKAGE_NAME)
            result = edit_request.execute()
            print("Successfully created edit session:", result)
        except Exception as e:
            print("\nResult from Google Play API:")
            print(str(e))
    except Exception as e:
        print("Error initializing credentials:", e)

if __name__ == "__main__":
    main()
