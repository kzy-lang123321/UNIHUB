# Connect UniHub to Firebase

The owner has chosen the free Spark plan. Billing is verified disabled and no billing account is linked. Keep Firebase Authentication and Firestore within their free quotas; do not upgrade or provision paid Storage without a new instruction. The local document collection remains staged, not uploaded.

Current project: `unihub-akl-20261106` (UniHub), created under the authorized owner account. Firebase is active, the shared Web app is registered, `.env` is connected, Firestore is in `asia-south1`, email/password sign-in is enabled, and Firestore rules/indexes are deployed. Cloud Storage/billing is not configured. The user-approved initial admin account is provisioned. It requires a password change on first sign-in; its local credential file is Git-ignored.

The local collection is inventoried, not uploaded. Source files remain unchanged. All import rows begin unapproved; filenames alone do not establish a correct syllabus or permission to distribute a textbook.

## Create the project

1. Open https://console.firebase.google.com/ in your browser and sign in with your own Google account. Create a project called UniHub. Analytics is optional.
2. Under Project settings → General, register a Web app named UniHub. This app uses the shared Firebase JavaScript SDK on Android, iOS and web. Firebase Hosting is not needed.
3. Copy `.env.example` to `.env` and fill its five public Firebase configuration values from that app's configuration object. Never use an admin/service-account key in these fields.
4. Enable Authentication → Email/Password. Create Firestore in production mode. Choose your database location deliberately; use the same region for Storage where available.
5. Enable Cloud Storage. Firebase currently requires the pay-as-you-go Blaze plan and a linked billing account. Review costs and set budget alerts before uploading. Budget alerts are notifications, not a spending cap. Do not enable billing unless you accept the charges.
6. Keep the bucket private. Use this repository's institution-scoped rules, not public/test-mode access. On initial deployment Firebase may ask you to enable the Storage service's access to Firestore for rule lookups.

Official references: https://firebase.google.com/docs/web/setup and https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024 .

## Deploy and provision

Sign in locally with `npx firebase-tools login`, then deploy:

```powershell
npx firebase-tools deploy --project YOUR_PROJECT_ID --only firestore,storage
```

For trusted scripts, configure Google Application Default Credentials locally or point `GOOGLE_APPLICATION_CREDENTIALS` at a private, least-privilege service-account JSON file outside the repository. Never send that file in chat. Run `npm run seed` only for the initial sample; it overwrites CS-101. Use the existing user-import script to provision institution accounts. Real department programs and courses must be created with verified curriculum metadata before material imports; the importer deliberately does not invent them.

## Review the files in order

Open `artifacts/materials/import-manifest.csv` in Excel or another CSV editor. Retain UTF-8 CSV format. Filter by department, then folder; numeric filenames already have natural ordering. Fill the real `program_id`, `course_code`, `semester`, `kind` (book/notes), `sequence` (unique per course), `credit_line`, and `sharing_permission`. Only then set selected rows to `approved=yes`. Semester/chapter hints are suggestions, not verified mappings. Excluded personal/admin files, exact duplicates and non-documents cannot be imported. Convert DOC/DOCX/PPTX files to PDF for this first importer, then inventory the PDF output separately.

## Preview and upload

The default command validates the entire selection, checks original-file hashes and source boundaries, and shows a plan without credentials or writes:

```powershell
npx tsx scripts/import-materials.ts --manifest artifacts/materials/import-manifest.csv --source 'E:\akl project'
```

Create destination courses as drafts (`published=false`) with matching institution `akl`, program and semester. Then import selected PDFs sequentially:

```powershell
npx tsx scripts/import-materials.ts --manifest artifacts/materials/import-manifest.csv --source 'E:\akl project' --commit --project YOUR_PROJECT_ID --bucket YOUR_BUCKET_NAME
```

The importer stores private PDF objects by SHA-256, adds ordered course metadata, and leaves courses in draft. A rerun reuses successful uploads. If uploading succeeds but attaching metadata fails, the object remains private and can be attached by rerunning. Review and publish each course from the existing teacher editor. In the app, Explore → Books & notes combines department/semester/course browsing with filename/lecturer/title search and lecture/filename sorting. Only published course materials appear for students. PDFs open on demand and are not bundled in the APK.

Download links resolved by Firebase are bearer URLs: recipients who obtain a link may share it. Strict per-request document authorization would require a different download service. Large collections may eventually need paginated material documents rather than arrays in course metadata; keep each course below Firestore's document size limit.
