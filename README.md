# UniHub

React Native Android application for Akl Postgraduate College. The current build opens directly into Home, Library, Saved and Menu without signing in. The Facebook-inspired campus feed includes a post composer, circular academic shortcuts, note cards, comments, likes, bookmarks, search and local activity. Posts and comments are explicitly device-only while login is paused; they are not shared with other students. Editing, deletion and saved posts persist locally. Study progress also stays on the device.

Institution sign-in is temporarily disabled with `EXPO_PUBLIC_AUTH_ENABLED=false`. Login, password-change, sign-out and biometric entry screens are bypassed in this mode. It creates a local student session; private drafts and administrator operations remain protected. Institutional sign-in needs further Android request validation before being enabled again. The temporary network diagnostics have been removed.

## Initial Academic Library

The actual provided collection is the initial library. There is no fictional fallback content in student screens. Empty sections remain empty until an administrator publishes real materials.

Current source: `E:\projects\in work\akl project\DEPARTMENTS NOTES`.

- 679 original files, 8,517,410,103 bytes, inventoried with SHA-256 checksums.
- 679 document metadata records registered in Firebase Firestore; **zero published**.
- 660 readable source documents or derived reading copies verified. Two presentations have no slides and are reported as failed, with other unsupported or excluded items retained for review.
- 25 exact duplicate originals detected. Duplicates remain visible; no source file is deleted.
- The printer-driver ZIP contains 1,244 members. These are retained in the local audit report as excluded non-academic material, without execution or academic publication.
- Classification suggestions are drafts. No semester is guessed from a chapter number. Uncertain subjects/programs remain unclassified.

Private state, previews, converted Office PDFs, incoming uploads, version backups and verification results are in `E:\UniHubLibrary`. The original source tree has not been modified. Previews and reading copies supplement the original files. Replacements use new immutable file locations; prior original files and metadata backups are retained. Delete archives a record and unpublishes it; administrators can restore it.

When institutional authentication is enabled, administrator sign-in opens **Initial Academic Library** directly. The previous setup landing page has been removed; sign-out is available at the top of the library. Review the original and preview, apply or correct suggestions, choose department/program/semester/subject/type, and explicitly confirm classification and student visibility. Save as unpublished until approved. Publishing and download permission are separate controls. Editing classification clears approval and returns the document to a draft. Bulk categorization also creates drafts rather than publishing automatically.

The screen includes processing totals, classified book/note counts, unclassified materials, failures, duplicate counts, storage usage, search, archived items, metadata editing, replacement and upload progress. Unsupported/corrupted files and archive extraction errors are reported rather than silently skipped. Modern DOCX/PPTX reading copies are generated with LibreOffice. Legacy DOC/PPT and other unsupported formats are retained with an explicit status.

## Free storage arrangement

The owner selected Firebase Spark with no billing. Authentication and Firestore metadata use Firebase; **no original files are uploaded to Firebase Storage**. Documents are served from the local PC by an authenticated Node service. This is a working local storage provider, not internet-hosted file storage. The PC and service must be running and reachable for initial document access.

```powershell
npm install
npm run library:serve
# In another terminal:
npm run web
```

The browser app is at http://localhost:8081. The document service binds to `127.0.0.1:8787` by default. `.env` specifies `LIBRARY_STATE_ROOT` and `EXPO_PUBLIC_LIBRARY_API_URL`; Firebase public configuration is already configured locally. Do not put private keys or passwords in Expo variables.

For an Android device connected by USB, run `adb reverse tcp:8787 tcp:8787` so the bundled loopback URL reaches the PC. A network deployment requires a reachable authenticated HTTPS service and a corresponding app URL configuration; this has not been deployed. No paid storage has been provisioned.

The service verifies Firebase ID tokens and current institution profiles. Student listings and file tickets require a published, approved resource matching the student's institution, program and semester. Two-minute file tickets are checked against current permissions again when opened. Unpublishing blocks further service access. Viewing bytes cannot prevent a user from saving those bytes, and revocation cannot erase a previously permitted offline download.

## Import additional provided materials

Use admin multi-file upload, folder import on web, ZIP import or the local import command. Uploads are processed sequentially with visible progress and per-file errors. The picker accepts files up to 64 MiB each to limit browser/mobile memory; the HTTP service accepts up to 512 MiB. Large collections should use the local import command. ZIP limits are 2 GiB total, 2,000 members and 256 MiB per member; unsafe paths, encrypted entries and unsupported items are reported.

Stop the document service before running the CLI importer so only one process writes its manifest:

```powershell
npm run library:import
python scripts/verify-library.py --state E:/UniHubLibrary
```

The import command uses the current source path and renders Office reading copies. New imports remain unpublished. The CLI stages local records; to register new CLI imports in Firestore, use the trusted `scripts/register-library.py --state E:/UniHubLibrary --project unihub-akl-20261106` with an ephemeral owner access token in `UNIHUB_GOOGLE_ACCESS_TOKEN`. Do not save or print the token. Browser uploads synchronize metadata using the signed-in administrator's token. Restart the service after CLI changes.

Original integrity checks, preview verification and first/last page rendering results are saved in `E:\UniHubLibrary\verification.json`. Integrity and readability checks do not confirm academic subject or semester: those decisions remain with the administrator. Existing OCR drafts and historical `notes.js` content are not published student resources. OCR is optional for search and does not replace originals or preserve every diagram/formula.

## Student reading and offline access

Explore → Books & notes shows only approved materials for the student's program and semester, with subject/category filters and filename search. The hierarchy is displayed with each result. PDFs open in a browser/system viewer; DOCX/PPTX have generated PDF reading copies, while permitted downloads preserve originals. Native offline reading uses downloaded files and a system viewer/share action; web stores permitted original bytes in IndexedDB. Saved files can reopen without the document service. The web application itself must already be loaded; a fully offline-installable web shell is not implemented.

## Verification

```powershell
npm run typecheck
npm test
python -m unittest discover -s tests -p library_ingest_test.py
npm run test:e2e
```

Library tests cover institution/program/semester access, draft visibility, explicit publication approval, revoked download tickets, stale updates, immutable upload replacements and metadata backups. Ingest tests cover ambiguous classification, chapter/semester separation, safe ZIP extraction and corrupt file reporting. Admin browser review tests use an isolated local component harness with actual provided metadata and mocked writes; they never approve or publish the real library. Full Firebase emulator coverage and physical Android/iOS QA remain outstanding.

Browser tests start `scripts/library-ui-harness.mjs` on loopback port 8890 automatically. The admin test requires the private imported manifest and the provided ICT lecture; it deliberately has no fictional fallback. This harness is a development verification tool and is never bundled into the app or deployed as its document service.

## Local Android build

No Expo account or cloud build is required. Use JDK 17 and the existing SDK/Gradle installation:

```powershell
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot'
./scripts/build-android-local.ps1 -SdkRoot 'E:\projects\in work\UniHubBuild\android-sdk' -GradleCache 'E:\projects\in work\UniHubBuild\gradle' -GradleExecutable 'E:\projects\in work\UniHubBuild\tools\gradle-8.14.3\bin\gradle.bat' -Architecture armeabi-v7a
```

Output: `artifacts/UniHub-android-test.apk`. This test APK targets the previously connected 32-bit Samsung; use `arm64-v8a` for other hardware as appropriate. It uses the generated test signing key. Store distribution, release signing, iOS builds and hardware validation are not complete.

The current account-free Android APK is 19.54 MiB. Its signature and native/resource payloads were verified against the existing release build. TypeScript and the guest-access security test pass. Cold startup was verified on TECNO BG6 with Learn, Explore and Me visible without a login prompt. Full device navigation QA remains ongoing.

## Other administration

Firebase project: `unihub-akl-20261106`. Firestore rules include the institution-scoped academicMaterials collection. Account provisioning scripts are trusted-machine tools. Demo seed scripts and fixtures remain for tests and should not be used to populate the actual initial library. Do not deploy paid Storage or run a seed to fill empty sections.

The app also contains course reading, quizzes, local progress, teacher draft editors and study planning. Broader production work remains, including full user/program management, localization, security emulator checks, accessibility/device testing and production file hosting. This implementation does not claim the entire product is production-ready.


