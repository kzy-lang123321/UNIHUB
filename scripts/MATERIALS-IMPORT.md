# Books and notes staging

Run `python scripts/catalog-materials.py --source "E:\akl project" --output artifacts/materials` to inventory the source collection. Originals are never moved, renamed, or edited. The generated private CSV is ignored by Git.

The staging manifest uses department/folder order and natural filename order (lecture 2 before lecture 10). Its serial numbers are provisional; they are not a verified syllabus sequence. Exact duplicate detection uses SHA-256 across the complete file. Semester/chapter hints come only from filenames and require review.

For each selected row, supply `program_id`, `course_code`, `semester`, `kind` (book or notes), `sequence`, `credit_line`, and `sharing_permission`. Set `approved` to yes only after checking the course mapping and permission. Personal/administrative files and non-documents are excluded from candidates. Duplicate rows identify their matching original rather than being deleted.

Uploading is not part of the inventory command. The approved model now supports an optional ordered `materials` list per course. See [Firebase setup and upload steps](FIREBASE-SETUP.md) for the dry-run-first PDF importer and credential setup. Do not put service-account keys into the CSV, app source, or chat. Keep PDFs outside the APK and download them on demand; this collection is too large to bundle.
