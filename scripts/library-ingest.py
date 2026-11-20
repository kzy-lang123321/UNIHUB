"""Inspect provided originals, build previews and stage unclassified library records.
Never edits originals or publishes resources. Supports safe ZIP expansion and Office previews.
"""
import argparse
import hashlib
import json
import mimetypes
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import pymupdf
from PIL import Image

PROGRAMS = {"COMPUTER SCIENCE": ("Computer Science", "bs-cs"), "BOTANY": ("Botany", "bs-botany"), "ZOOLOGY": ("Zoology", "bs-zoology"), "CHEMISTRY": ("Chemistry", "bs-chemistry"), "PHYSICS": ("Physics", "bs-physics"), "MATHS": ("Mathematics", "bs-mathematics"), "ENGLISH": ("English", "bs-english"), "ISLAMIAT": ("Islamiat", "bs-islamiat"), "PAK-STUDIES": ("Pakistan Studies", "bs-pakistan-studies"), "ECONOMICS": ("Economics", "bs-economics"), "STATISTICS": ("Statistics", "bs-statistics"), "URDU": ("Urdu", "bs-urdu"), "PUSHTO": ("Pashto", "bs-pashto"), "HISTORY": ("History", "bs-history"), "POLOTICAL SCIENCE": ("Political Science", "bs-political-science")}
SUBJECTS = {"ICT": r"\bict\b|applications of computer|ms word", "Programming": r"\bc\+\+|programming|data structures|digital logic", "Computer Networks": r"computer networks?", "Database Systems": r"database", "Biochemistry": r"biochemistry|bio[ -]chemistry|amino acids|proteins", "Genetics": r"genetics|mendelian", "Cell Biology": r"cell biology|cytology|molecular biology", "English Literature": r"literary|literature|fiction|novel|stylistics", "English Language": r"linguistics|grammar|academic writing|acedamic writing|expository|functional english", "Statistics": r"statistics|statistical|biostat|bio stats", "Mathematics": r"calculus|algebra|numerical analysis|graph theory|geometry|laplace|discrete math", "Chemistry": r"organic chemistry|inorganic|coordination chemistry|electrochemistry|spectroscopy|reaction mechanism", "Physics": r"quantum|thermodynamics|nuclear physics|optics|mechanics|electricity|magnetism", "Botany": r"plant|botany|mycology|phycology|palynology|pteridophytes", "Zoology": r"zoology|wildlife|wild life|chordates|invertebrate|animal", "Economics": r"economics|econometrics|public finance|macroeconom|microeconom", "Pakistan Studies": r"pakistan|pak studies", "Islamiat": r"islamiat|islamic|quran|حدیث|فقہ|سیرت|قرآن"}

def atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    temporary.replace(path)

def suggest(relative, text, pages):
    folder = relative.replace("\\", "/").split("/")[0].upper()
    department, program = PROGRAMS.get(folder, ("", ""))
    name = Path(relative).stem
    subjects = [subject for subject, pattern in SUBJECTS.items() if re.search(pattern, name, re.I)]
    if not subjects:
        subjects = [subject for subject, pattern in SUBJECTS.items() if re.search(pattern, text[:700], re.I)]
    subject = subjects[0] if subjects else ""
    reasons = ["Program suggested from source folder"] if program else ["Program needs review"]
    # A folder is not sufficient when the title strongly contradicts it.
    if department in {"Botany", "Zoology", "Chemistry", "Physics", "Mathematics"} and subject in {"English Literature", "English Language", "Economics"}:
        department, program = "", ""
        reasons.append("Title and folder conflict; no program assigned")
    semester = None
    match = re.search(r"(?:semester|semeter|smstr|sem)\s*[-:]?\s*([1-8])\b|\b([1-8])(?:st|nd|rd|th)?\s*(?:semester|semeter|smstr|sem)\b", relative, re.I)
    if match:
        semester = int(match.group(1) or match.group(2))
        reasons.append("Explicit semester in filename/folder")
    lower = name.lower()
    if re.search(r"past.?paper|question.?paper|midterm|mid.term|final.?exam", lower): kind = "past-paper"
    elif re.search(r"assignment|lab.?report", lower): kind = "assignment"
    elif "handout" in lower: kind = "handout"
    elif re.search(r"lecture|lec\b|notes", lower): kind = "notes"
    elif re.search(r"book|edition|textbook|handbook|isbn", lower + " " + text[:900].lower()) or (pages or 0) > 180: kind = "book"
    else: kind = "other"
    return dict(department=department, programId=program, semester=semester, subject=subject, kind=kind, confidence=0.9 if program and subject and semester else 0.55 if program or subject else 0.2, reasons=reasons)

def inspect(path, relative, root, source="provided", render_office=False):
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1048576), b""): sha.update(block)
    checksum = sha.hexdigest()
    rid = hashlib.sha256((relative + "\0" + checksum).encode("utf8")).hexdigest()
    preview = root / "previews" / (rid + ".webp")
    text, pages, status, issue = "", None, "unsupported", "Unsupported format; original retained for administrator review."
    extension = path.suffix.lower()
    personal = bool(re.search(r"certificate|equalency|equivalency|nadra|esaholat|pending for accounts|final bill|AJMAL IQBAL SEB|KXDrv|Kx630909|printer.driver", relative, re.I))
    try:
        with path.open("rb") as stream: magic = stream.read(8)
        if magic.startswith(b"%PDF"):
            doc = pymupdf.open(path)
            if doc.needs_pass: raise ValueError("Encrypted PDF requires an owner password")
            pages = len(doc)
            if not pages: raise ValueError("PDF has no pages")
            text = "\n".join(doc[i].get_text(sort=True) for i in range(min(2, pages)))
            status, issue = ("ready", "") if len(text.strip()) >= 80 else ("needs-ocr", "Readable PDF; text extraction/OCR needs review.")
            preview.parent.mkdir(parents=True, exist_ok=True)
            pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(0.7, 0.7), alpha=False)
            image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            image.thumbnail((700, 900)); image.save(preview, "WEBP", quality=70)
            doc.close()
        elif extension in {".docx", ".pptx"}:
            with zipfile.ZipFile(path) as archive:
                members = [n for n in archive.namelist() if n == "word/document.xml" or re.fullmatch(r"ppt/slides/slide\d+\.xml", n)]
                if not members: raise ValueError("Office document has no document body/slides")
                for member in sorted(members, key=lambda n: int(re.search(r"(\d+)\.xml", n).group(1)) if re.search(r"(\d+)\.xml", n) else 0):
                    if archive.getinfo(member).file_size > 20 * 1024 * 1024: raise ValueError("Office XML exceeds safety limit")
                    tree = ET.fromstring(archive.read(member))
                    text += "\n" + " ".join(node.text or "" for node in tree.iter() if node.tag.rsplit("}", 1)[-1] == "t")
                    if len(text) > 15000: break
                pages = len(members) if extension == ".pptx" else None
            status, issue = "needs-conversion", "Content inspected; PDF rendering needed for student readability."
            if render_office:
                converted = root / "converted" / rid
                converted.mkdir(parents=True, exist_ok=True)
                office = Path(r"C:\Program Files\LibreOffice\program\soffice.exe")
                result = subprocess.run([str(office), "-env:UserInstallation=" + (root / "lo-profile").resolve().as_uri(), "--headless", "--convert-to", "pdf", "--outdir", str(converted), str(path)], capture_output=True, timeout=90, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
                pdf = converted / (path.stem + ".pdf")
                if result.returncode or not pdf.exists(): raise ValueError("Office preview conversion failed; original retained")
                doc = pymupdf.open(pdf); pages = len(doc)
                pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(0.7, 0.7), alpha=False)
                preview.parent.mkdir(parents=True, exist_ok=True)
                image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples); image.thumbnail((700, 900)); image.save(preview, "WEBP", quality=70)
                doc.close(); status, issue = "ready", ""
        elif extension in {".jpg", ".jpeg", ".png", ".webp"}:
            with Image.open(path) as image:
                image.verify()
            with Image.open(path) as image:
                image = image.convert("RGB"); image.thumbnail((700, 900)); preview.parent.mkdir(parents=True, exist_ok=True); image.save(preview, "WEBP", quality=70)
            status, issue = "ready", "Image resource; classification needs review."
        elif extension == ".txt":
            raw = path.read_bytes()
            try: text = raw.decode("utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig")
            except UnicodeDecodeError: text = raw.decode("cp1252")
            status, issue = "ready", ""
        elif extension == ".zip": status, issue = "archive", "Archive retained; extracted members have separate review records."
        elif extension in {".doc", ".ppt"}: issue = "Legacy Office format; convert a copy to DOCX/PPTX or PDF. Original retained."
    except Exception as error:
        status, issue = "corrupt", str(error)
    if personal: status, issue = "excluded", "Possible personal/administrative material; excluded from student publication."
    suggestions = suggest(relative, text, pages)
    now = datetime.now(timezone.utc).isoformat()
    record = dict(id=rid, institutionId="akl", institutionName="Akl Postgraduate College", originalName=path.name, relativePath=relative,
        title=re.sub(r"[_\s]+", " ", path.stem).strip(), description="", department="", programId="", semester=None, subject="", kind="other",
        suggestions=suggestions, classificationConfirmed=False, visibilityConfirmed=False, published=False, downloadAllowed=False, deleted=False,
        status=status, issue=issue, bytes=path.stat().st_size, sha256=checksum, mimeType="application/pdf" if magic.startswith(b"%PDF") else (mimetypes.guess_type(path.name)[0] or "application/octet-stream"),
        pages=pages, previewText=text[:1800].strip(), hasPreview=preview.exists(), duplicateOf=None, source=source, storageProvider="local", cloudFileUploaded=False,
        databaseRegistered=False, version=1, updatedAt=now)
    # Paths never leave the local service's private manifest.
    private = dict(sourcePath=str(path.resolve()), sourceMtimeNs=str(path.stat().st_mtime_ns), previewPath=str(preview.resolve()) if preview.exists() else "", readablePath=str(pdf.resolve()) if extension in {".docx", ".pptx"} and status == "ready" else str(path.resolve()))
    return record, private

def expand_zip(path, root):
    extracted, errors = [], []
    with zipfile.ZipFile(path) as archive:
        members = archive.infolist()
        if len(members) > 2000 or sum(m.file_size for m in members) > 2 * 1024**3: raise ValueError("Archive exceeds 2,000 members or 2 GiB expanded size")
        destination = (root / "archive-members" / hashlib.sha256(path.read_bytes()).hexdigest()).resolve()
        for member in members:
            if member.is_dir(): continue
            name = member.filename.replace("\\", "/")
            parts = PurePosixPath(name)
            if parts.is_absolute() or ".." in parts.parts or ":" in name or member.flag_bits & 1 or ((member.external_attr >> 16) & 0o170000) == 0o120000 or member.file_size > 256 * 1024**2:
                errors.append({"name": name, "error": "Unsafe, encrypted, symbolic-link or oversized archive member"}); continue
            target = (destination / Path(*parts.parts)).resolve()
            if destination not in target.parents: raise ValueError("Archive traversal rejected")
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                with archive.open(member) as source, target.open("xb") as output:
                    total = 0
                    while block := source.read(1048576):
                        total += len(block)
                        if total > 256 * 1024**2: raise ValueError("Expanded member exceeds limit")
                        output.write(block)
            extracted.append((target, name))
    return extracted, errors

def main():
    sys.stdout.reconfigure(encoding="utf8", errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=r"E:\projects\in work\akl project\DEPARTMENTS NOTES")
    parser.add_argument("--state", default=".library")
    parser.add_argument("--single")
    parser.add_argument("--name")
    parser.add_argument("--render-office", action="store_true")
    args = parser.parse_args(); root = Path(args.state).resolve(); root.mkdir(parents=True, exist_ok=True)
    manifest = root / "manifest.json"
    state = json.loads(manifest.read_text(encoding="utf8")) if manifest.exists() else {"resources": {}, "privateFiles": {}, "importIssues": []}
    source = Path(args.source).resolve()
    if not args.single and not source.is_dir():
        raise FileNotFoundError(f"Source folder is unavailable: {source}. Nothing was imported or published.")
    items = [(Path(args.single).resolve(), args.name or Path(args.single).name)] if args.single else [(p, p.relative_to(source).as_posix()) for p in sorted(source.rglob("*")) if p.is_file() and not p.is_symlink()]
    imported = []
    for path, relative in items:
        known = next((r for r in state["resources"].values() if r["relativePath"] == relative and state["privateFiles"].get(r["id"], {}).get("sourcePath") == str(path.resolve())), None)
        if known and known["bytes"] == path.stat().st_size and state["privateFiles"].get(known["id"],{}).get("sourceMtimeNs") == str(path.stat().st_mtime_ns):
            imported.append(known["id"]); continue
        record, private = inspect(path, relative, root, "upload" if args.single else "provided", args.render_office)
        if record['id'] in state['resources']:
            state['privateFiles'][record['id']]['sourceMtimeNs']=private['sourceMtimeNs']
            imported.append(record['id']); atomic(manifest,state); continue
        identical = next((r for r in state["resources"].values() if r["sha256"] == record["sha256"] and r["id"] != record["id"]), None)
        if identical: record["duplicateOf"] = identical["id"]
        state["resources"][record["id"]] = record; state["privateFiles"][record["id"]] = private; imported.append(record["id"])
        if path.suffix.lower() == ".zip":
            try:
                members, errors = expand_zip(path, root)
                state["importIssues"].extend({"archive": relative, **error} for error in errors)
                for member, name in members:
                    child, child_private = inspect(member, relative + "!/" + name, root, "archive", args.render_office)
                    same = next((r for r in state["resources"].values() if r["sha256"] == child["sha256"]), None)
                    if same: child["duplicateOf"] = same["id"]
                    state["resources"][child["id"]] = child; state["privateFiles"][child["id"]] = child_private; imported.append(child["id"])
            except Exception as error:
                record["status"], record["issue"] = "corrupt", str(error)
        atomic(manifest, state)
        print(json.dumps({"file": relative, "status": record["status"], "id": record["id"]}), flush=True)
    atomic(root / "last-import.json", {"ids": imported, "total": len(state["resources"]), "issues": state["importIssues"]})
    print(json.dumps({"total": len(state["resources"]), "imported": len(imported), "published": sum(r["published"] for r in state["resources"].values())}), flush=True)

if __name__ == "__main__": main()
