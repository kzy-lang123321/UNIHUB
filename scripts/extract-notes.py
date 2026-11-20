"""Convert local PDFs to resumable, page-preserving text drafts and notes.js.

Direct text extraction runs before OCR. Drafts are private and never automatically
published into the application. Originals remain unchanged.
"""
import argparse
import csv
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import pymupdf


def compact(text):
    text = text.replace("\x00", "").replace("\r\n", "\n")
    return re.sub(r"\n{3,}", "\n\n", "\n".join(line.rstrip() for line in text.splitlines())).strip()


def atomic_write(destination, data):
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    # Both resolved paths are inside the explicitly selected output directory.
    if temporary.resolve().parent != destination.resolve().parent:
        raise ValueError("Invalid output path")
    temporary.write_bytes(data)
    temporary.replace(destination)


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
    sys.stderr.reconfigure(encoding="utf-8", errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default="artifacts/materials/import-manifest.csv")
    parser.add_argument("--output", default="artifacts/text-notes")
    parser.add_argument("--department")
    parser.add_argument("--filename")
    parser.add_argument("--ocr-limit", type=int, default=0, help="Maximum OCR pages this run; direct text extraction is unlimited")
    parser.add_argument("--tesseract", default=r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    parser.add_argument("--languages", help="Override OCR language, e.g. eng+urd or pus")
    args = parser.parse_args()
    if args.ocr_limit < 0:
        parser.error("OCR limit must be nonnegative")
    os.environ.setdefault("OMP_THREAD_LIMIT", "1")
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    with Path(args.manifest).open(encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.DictReader(stream))
    used_ocr, errors = 0, []
    for row in rows:
        if row["extension"] != ".pdf" or row["duplicate_of"] or "exclude-" in row["review_flags"]:
            continue
        if args.department and row["department"] != args.department:
            continue
        if args.filename and args.filename.casefold() not in row["relative_path"].casefold():
            continue
        if not re.fullmatch(r"[a-f0-9]{64}", row["sha256"]):
            raise ValueError("Invalid source checksum in manifest")
        source = Path(row["source_path"]).resolve()
        if output == source or source in output.parents:
            raise ValueError("Output must not overwrite the source")
        destination = output / (row["sha256"] + ".json")
        try:
            if destination.exists():
                draft = json.loads(destination.read_text(encoding="utf-8"))
            else:
                draft = {"id": row["sha256"], "title": row["title"], "department": row["department"],
                         "filename": source.name, "sourcePath": str(source), "sourceBytes": int(row["bytes"]),
                         "courseCode": row["course_code"], "semester": row["semester"],
                         "creditLine": row["credit_line"], "reviewed": False, "pages": []}
            document = pymupdf.open(source)
            if document.needs_pass:
                raise ValueError("Password-protected PDF requires owner access")
            draft["pageCount"] = len(document)
            # Revalidate the original rather than silently converting changed content.
            checksum = hashlib.sha256()
            with source.open("rb") as stream:
                for block in iter(lambda: stream.read(1048576), b""):
                    checksum.update(block)
            if checksum.hexdigest() != row["sha256"]:
                raise ValueError("Source changed since inventory")
            saved = {page["no"]: page for page in draft["pages"]}
            pages = []
            for index, page in enumerate(document):
                previous = saved.get(index + 1)
                if previous and (previous["method"] == "ocr" or args.ocr_limit == 0):
                    pages.append(previous)
                    continue
                text = compact(page.get_text(sort=True))
                needs_ocr = len(re.findall(r"\w+", text)) < 40
                method = "text"
                language = args.languages or ({"URDU": "urd+eng", "PUSHTO": "pus+eng", "ISLAMIAT": "urd+ara+eng"}.get(row["department"], "eng"))
                if needs_ocr and used_ocr < args.ocr_limit:
                    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
                    result = subprocess.run([args.tesseract, "stdin", "stdout", "-l", language, "--psm", "3"], input=pixmap.tobytes("png"), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=90, check=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
                    candidate = compact(result.stdout.decode("utf-8"))
                    used_ocr += 1
                    if len(candidate) > len(text):
                        text = candidate
                    method = "ocr"
                pages.append({"no": index + 1, "text": text, "method": method,
                              "needsOcr": needs_ocr and method != "ocr", "hasImages": bool(page.get_images()),
                              "needsReview": True})
                if method == "ocr":
                    # Save successful OCR immediately while retaining later native pages.
                    draft["pages"] = pages + [saved[number] for number in range(index + 2, len(document) + 1) if number in saved]
                    atomic_write(destination, json.dumps(draft, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
            document.close()
            draft["pages"] = pages
            atomic_write(destination, json.dumps(draft, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
            print(f"Extracted {row['relative_path']} ({len(pages)} pages)", flush=True)
        except Exception as error:
            errors.append({"file": row["relative_path"], "error": str(error)})
            print(f"Needs attention: {row['relative_path']}: {error}", flush=True)
    drafts = [json.loads(path.read_text(encoding="utf-8")) for path in output.glob("*.json") if re.fullmatch(r"[a-f0-9]{64}", path.stem)]
    drafts.sort(key=lambda d: (d["department"].casefold(), [int(part) if part.isdigit() else part.casefold() for part in re.split(r"(\d+)", d["filename"])]))
    # Exclude machine-local paths from the generated content module.
    content = [{key: value for key, value in draft.items() if key != "sourcePath"} for draft in drafts]
    javascript = "// Generated local drafts. Review accuracy and sharing rights before publishing.\nexport const notes = " + json.dumps(content, ensure_ascii=False, separators=(",", ":")) + ";\n"
    data = javascript.encode("utf-8")
    atomic_write(output / "notes.js", data)
    atomic_write(output / "notes.js.gz", gzip.compress(data, mtime=0))
    index = [{"id": d["id"], "title": d["title"], "department": d["department"], "filename": d["filename"],
              "pages": len(d["pages"]), "pendingOcrPages": sum(p["needsOcr"] for p in d["pages"]),
              "draftFile": d["id"] + ".json"} for d in drafts]
    atomic_write(output / "catalog.json", json.dumps(index, ensure_ascii=False, indent=2).encode("utf-8"))
    summary = {"documents": len(drafts), "pages": sum(len(d["pages"]) for d in drafts), "ocrPagesThisRun": used_ocr,
               "ocrPagesTotal": sum(p["method"] == "ocr" for d in drafts for p in d["pages"]),
               "pendingOcrPages": sum(p["needsOcr"] for d in drafts for p in d["pages"]),
               "sourceBytes": sum(d["sourceBytes"] for d in drafts), "javascriptBytes": len(data),
               "gzipBytes": (output / "notes.js.gz").stat().st_size, "errors": errors, "published": 0}
    (output / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
