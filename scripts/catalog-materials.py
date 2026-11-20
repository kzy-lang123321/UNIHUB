"""Inventory teaching files without changing originals or publishing content.

Usage: python scripts/catalog-materials.py --source "E:\\akl project" --output artifacts/materials
The CSV is an editable staging manifest, not a Firestore schema.
"""

import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

SUPPORTED = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt"}
PERSONAL = re.compile(
    r"certificate|equalency|equivalency|nadra|biom?very|accounts|final bill|esaholat",
    re.I,
)


def natural(value):
    return [int(part) if part.isdigit() else part.casefold()
            for part in re.split(r"(\d+)", value)]


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    root = source / "DEPARTMENTS NOTES"
    if not root.is_dir():
        root = source
    output = args.output.resolve()
    if output == source or source in output.parents:
        parser.error("Output must be outside the source collection.")
    output.mkdir(parents=True, exist_ok=True)
    files = sorted((p for p in root.rglob("*") if p.is_file() and not p.is_symlink()),
                   key=lambda p: natural(p.relative_to(root).as_posix()))
    rows, seen, sequences = [], {}, Counter()
    for path in files:
        relative = path.relative_to(root)
        department = relative.parts[0] if len(relative.parts) > 1 else "UNSORTED"
        folder = relative.parent.as_posix()
        sequences[department] += 1
        flags = []
        extension = path.suffix.lower()
        if extension not in SUPPORTED:
            flags.append("exclude-non-document")
        if PERSONAL.search(relative.as_posix()):
            flags.append("exclude-personal-admin")
        sha = digest(path)
        duplicate = seen.get(sha, "")
        if duplicate:
            flags.append("exact-duplicate")
        else:
            seen[sha] = relative.as_posix()
        semester = re.search(r"\b([1-8])(?:st|nd|rd|th)?[ _-]*(?:semester|semeter|smstr|sem)\b", str(relative), re.I)
        chapter = re.search(r"\b(?:chapter|chap|ch|lecture|lec)[ ._#-]*(\d+)", path.stem, re.I)
        if not chapter:
            chapter = re.match(r"(\d+)[ ._-]", path.stem)
        if extension in SUPPORTED and not duplicate and not PERSONAL.search(str(relative)):
            flags.extend(["verify-course-semester", "verify-sharing-permission"])
        rows.append({
            "department": department, "serial": sequences[department],
            "folder": folder, "title": re.sub(r"[_\s]+", " ", path.stem).strip(),
            "semester_hint": semester.group(1) if semester else "",
            "chapter_hint": chapter.group(1) if chapter else "",
            "program_id": "", "course_code": "", "semester": "",
            "kind": "", "sequence": "", "credit_line": "",
            "sharing_permission": "", "approved": "no",
            "relative_path": relative.as_posix(), "source_path": str(path),
            "extension": extension, "bytes": path.stat().st_size,
            "sha256": sha, "duplicate_of": duplicate,
            "review_flags": ";".join(flags),
        })
    if rows:
        with (output / "import-manifest.csv").open("w", newline="", encoding="utf-8-sig") as stream:
            writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
    summary = {
        "source": str(root), "total_files": len(rows),
        "total_bytes": sum(row["bytes"] for row in rows),
        "departments": dict(Counter(row["department"] for row in rows)),
        "formats": dict(Counter(row["extension"] for row in rows)),
        "exact_duplicates": sum(bool(row["duplicate_of"]) for row in rows),
        "personal_admin_flags": sum("exclude-personal-admin" in row["review_flags"] for row in rows),
        "document_candidates": sum(row["extension"] in SUPPORTED and not row["duplicate_of"] and "exclude-personal-admin" not in row["review_flags"] for row in rows),
        "uploaded": 0,
    }
    (output / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
