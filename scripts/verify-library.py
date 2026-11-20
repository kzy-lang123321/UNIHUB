"""Verify every retained original and readable preview without changing files."""
import argparse
import hashlib
import json
from pathlib import Path
import pymupdf
from PIL import Image
parser=argparse.ArgumentParser();parser.add_argument('--state',default='E:/UniHubLibrary');args=parser.parse_args()
root=Path(args.state);state=json.loads((root/'manifest.json').read_text(encoding='utf8'))
verified,failures,readable=0,[],0
for rid,record in state['resources'].items():
    if record['source']=='archive' and record['status']=='excluded':continue
    private=state['privateFiles'][rid]
    try:
        path=Path(private['sourcePath']);checksum=hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda:stream.read(1048576),b''):checksum.update(block)
        if checksum.hexdigest()!=record['sha256'] or path.stat().st_size!=record['bytes']:raise ValueError('Original integrity mismatch')
        verified+=1
        if record['hasPreview']:
            with Image.open(private['previewPath']) as image:image.verify()
        target=Path(private['readablePath'])
        if record['status'] in ['ready','needs-ocr']:
            if record['mimeType']=='application/pdf' or target.suffix.lower()=='.pdf':
                doc=pymupdf.open(target)
                if doc.needs_pass or len(doc)==0:raise ValueError('Unreadable PDF')
                doc[0].get_pixmap(matrix=pymupdf.Matrix(.2,.2));doc[-1].get_pixmap(matrix=pymupdf.Matrix(.2,.2));doc.close()
            readable+=1
    except Exception as error:failures.append({'id':rid,'file':record['relativePath'],'error':str(error)})
result={'verifiedOriginals':verified,'readableDocuments':readable,'failures':failures,'processingFailures':[{'file':r['relativePath'],'reason':r['issue']} for r in state['resources'].values() if r['status']=='corrupt'],'published':sum(r['published'] for r in state['resources'].values()),'databaseRegistered':sum(r['databaseRegistered'] for r in state['resources'].values())}
(root/'verification.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf8');print(json.dumps(result,indent=2,ensure_ascii=True))
if failures:raise SystemExit(1)
