import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

KEY_FILE = r"D:\unihub\playstore-assets\play-service-account.json"
AAB_FILE = r"D:\unihub\artifacts\UniHub-v2-release.aab"
PACKAGE_NAME = "com.megatech.unihub"
TRACK = "internal"  # Options: 'internal', 'alpha', 'beta', 'production'

def upload_bundle():
    print("=" * 60)
    print("  UniHub Automated Google Play Store CLI Uploader")
    print("=" * 60)

    if not os.path.exists(KEY_FILE):
        print(f"Error: Service account key not found at {KEY_FILE}")
        return False

    if not os.path.exists(AAB_FILE):
        print(f"Error: AAB file not found at {AAB_FILE}")
        return False

    print(f"\n[1/4] Loading credentials from: {KEY_FILE}")
    credentials = service_account.Credentials.from_service_account_file(
        KEY_FILE,
        scopes=["https://www.googleapis.com/auth/androidpublisher"]
    )
    service = build("androidpublisher", "v3", credentials=credentials)
    print("      Service account authenticated.")

    print(f"\n[2/4] Creating new edit session for package '{PACKAGE_NAME}'...")
    try:
        edit_request = service.edits().insert(body={}, packageName=PACKAGE_NAME)
        edit = edit_request.execute()
        edit_id = edit["id"]
        print(f"      Edit session created. Edit ID: {edit_id}")
    except Exception as e:
        print(f"\n[!] Failed to create edit session.")
        print(f"    Google Play API returned: {e}")
        print("\n    Why this happens:")
        print("    1. The Service Account (play-publisher@unihub-akl-20261106.iam.gserviceaccount.com)")
        print("       has not yet been granted permission in Google Play Console.")
        print("       Fix: Go to Google Play Console -> Users & Permissions -> Invite User -> add the service account email.")
        print("    2. Developer account identity verification has not been approved yet.")
        print("    3. The app 'app.unihub.mobile' has not been created yet in Google Play Console.")
        return False

    print(f"\n[3/4] Uploading App Bundle ({AAB_FILE})...")
    media = MediaFileUpload(AAB_FILE, mimetype="application/octet-stream", resumable=True)
    bundle_response = service.edits().bundles().upload(
        packageName=PACKAGE_NAME,
        editId=edit_id,
        media_body=media
    ).execute()
    version_code = bundle_response.get("versionCode")
    print(f"      Upload complete! Version Code: {version_code}")

    print(f"\n[4/4] Assigning version {version_code} to track '{TRACK}' and committing...")
    track_body = {
        "track": TRACK,
        "releases": [
            {
                "name": "1.0.0 (UniHub v2)",
                "versionCodes": [str(version_code)],
                "status": "completed",
                "releaseNotes": [
                    {
                        "language": "en-US",
                        "text": "Initial release of UniHub featuring Community Book Library & Student Profiles."
                    }
                ]
            }
        ]
    }
    service.edits().tracks().update(
        packageName=PACKAGE_NAME,
        editId=edit_id,
        track=TRACK,
        body=track_body
    ).execute()

    commit_request = service.edits().commit(packageName=PACKAGE_NAME, editId=edit_id)
    commit_request.execute()
    print("\n" + "=" * 60)
    print("SUCCESS: UniHub v2 AAB successfully published to Google Play!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = upload_bundle()
    sys.exit(0 if success else 1)
