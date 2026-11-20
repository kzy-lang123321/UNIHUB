> Historical OCR workflow. The live app now uses the administrator-reviewed Initial Academic Library described in ../README.md. Bundled notes.js entries are not exposed to students and this script cannot publish library records.

# Local books and notes without a content database

Firebase remains on the free Spark plan for accounts and optional progress. Book and note text can ship with the app in `src/content/notes.js`; the reader does not fetch it from Firestore or Storage. Updating bundled content requires rebuilding the app. The browser demo needs its web server to load initially; this is not a service-worker/PWA offline implementation.

## Extract first, OCR scanned pages second

Requirements: Python with PyMuPDF, plus Tesseract for OCR. The current Windows machine has Tesseract with English, Urdu and Pashto language data under `C:\Program Files\Tesseract-OCR`.

```powershell
python scripts/extract-notes.py --ocr-limit 0
python scripts/extract-notes.py --department 'COMPUTER SCIENCE' --ocr-limit 100
python scripts/extract-notes.py --department URDU --languages urd+eng --ocr-limit 100
```

The first pass extracts existing text from non-excluded, unique PDFs. Pages with fewer than 40 words are queued for OCR; this is a heuristic, so sparse title pages and blank pages may also be queued. Images embedded beside a longer text layer are flagged but not automatically OCR'd. Selected scans render at approximately 144 DPI and are sent to the local Tesseract executable. The longer of native text and OCR text is retained. An OCR result is not a proof of accuracy. Completed OCR pages are reused on subsequent runs. For mixed language collections, supply the appropriate Tesseract language codes explicitly.

Private output lives in `artifacts/text-notes/`: per-document JSON, a small `catalog.json` index, generated `notes.js`, a deterministic `notes.js.gz` transfer/archive copy, and `summary.json`. Originals are SHA-256 checked and never modified. Gzip size is not runtime memory usage; the app imports normal JavaScript, not the `.gz` archive. This text edition omits source page artwork and layout, so size reduction is not lossless PDF compression. Formulas, code indentation, tables, reading order, Urdu/Pashto accuracy and diagram references must be checked against the source. No AI rewriting, summaries or invented translations are added.

Direct text extraction and scanned-page OCR have different completion states. The summary reports remaining OCR pages and errors; do not call the collection finished while either remains. Non-PDF Office files need conversion before using this pipeline.

## Publish reviewed content into notes.js

Review the extracted pages and the original. In `artifacts/materials/import-manifest.csv`, fill the course/program/semester (0 is allowed only for unassigned local notes), book-or-notes kind, sequence, credit line and sharing permission. Add columns `text_reviewed` and optionally `course_title`. Set both `approved` and `text_reviewed` to `yes` only for checked entries that may be distributed. The publisher rejects unfinished OCR, duplicate lecture sequences and excluded files.

```powershell
npx tsx scripts/publish-local-notes.ts
npx tsx scripts/publish-local-notes.ts --write
```

The first command previews the selected entries. The second merges them into `src/content/notes.js`. It keeps the original UniHub example and replaces matching IDs, without writing to Firebase. Packs currently have a 2 MiB uncompressed text budget to avoid bundling a whole library into one eagerly loaded module on low-memory phones. Larger libraries need separate packs and lazy loading before expanding this limit.

In the app, use Explore → Books & notes → Read offline. The reader preserves source page numbers, supports in-note search, text sizing, saved status and remembered position. Storage objects and uploaded PDF editions remain separate; OCR drafts are never automatically distributed to students.

Current extraction: 593 PDFs / 51,492 pages. Text drafts are generated; 102 pages have been processed with OCR, and 21,221 pages remain in the OCR queue. The six ICT lectures have no pending OCR pages and are now bundled under ICT in lecture order, with author credit. Semester 0 means explicitly unassigned for local content; it is displayed as Semester not assigned and is not a valid Firestore course semester. `artifacts/text-notes/ict-review.csv` proposes their sequence and a local course identifier; The owner instructed inclusion under ICT; the local review manifest records this instruction and the checked text. No commercial textbook drafts have been bundled.

