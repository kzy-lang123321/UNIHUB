"""Register local originals' public metadata in Firestore, never publish them.
Use an ephemeral Google access token from the already authorized owner session.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import urllib.request
import urllib.error

def encode(value):
    if value is None: return {"nullValue": None}
    if isinstance(value, bool): return {"booleanValue": value}
    if isinstance(value, str): return {"stringValue": value}
    if isinstance(value, int): return {"integerValue": str(value)}
    if isinstance(value, float): return {"doubleValue": value}
    if isinstance(value, list): return {"arrayValue": {"values": [encode(v) for v in value]}}
    return {"mapValue": {"fields": {k: encode(v) for k,v in value.items()}}}

def decode(value):
    if "mapValue" in value: return {k: decode(v) for k,v in value["mapValue"].get("fields",{}).items()}
    if "arrayValue" in value: return [decode(v) for v in value["arrayValue"].get("values",[])]
    if "integerValue" in value: return int(value["integerValue"])
    if "doubleValue" in value: return value["doubleValue"]
    if "booleanValue" in value: return value["booleanValue"]
    return value.get("stringValue")

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--state',default='E:/UniHubLibrary');parser.add_argument('--project',required=True)
    args=parser.parse_args();token=os.environ.get('UNIHUB_GOOGLE_ACCESS_TOKEN')
    if not token: raise ValueError('Supply a temporary access token from your authorized local Google account')
    root=Path(args.state).resolve();path=root/'manifest.json';state=json.loads(path.read_text(encoding='utf8'))
    headers={'Authorization':'Bearer '+token,'Content-Type':'application/json','x-goog-user-project':args.project}
    base=f'https://firestore.googleapis.com/v1/projects/{args.project}/databases/(default)/documents'
    def request(url,method='GET',data=None):
        req=urllib.request.Request(url,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
        with urllib.request.urlopen(req,timeout=90) as result:return json.load(result)
    backup=root/'backups'/'registration';backup.mkdir(parents=True,exist_ok=True)
    (backup/(datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')+'.json')).write_text(json.dumps(state,ensure_ascii=False),encoding='utf8')
    existing=request(base+':runQuery','POST',{'structuredQuery':{'from':[{'collectionId':'academicMaterials'}],'where':{'fieldFilter':{'field':{'fieldPath':'institutionId'},'op':'EQUAL','value':{'stringValue':'akl'}}}}})
    existing={row['document']['name'].split('/')[-1]:decode({'mapValue':{'fields':row['document']['fields']}}) for row in existing if 'document' in row}
    fresh=[]
    for rid,record in state['resources'].items():
        if record['source']=='archive' and record['status']=='excluded': continue
        if rid in existing:
            # Keep administrator decisions made after initial registration.
            state['resources'][rid]={**record,**existing[rid], 'databaseRegistered':True}
        else:
            record.update(published=False, classificationConfirmed=False, visibilityConfirmed=False, downloadAllowed=False, databaseRegistered=False)
            fresh.append(record)
    for offset in range(0,len(fresh),200):
        batch=fresh[offset:offset+200]
        request(base+':commit','POST',{'writes':[{'update':{'name':f'projects/{args.project}/databases/(default)/documents/academicMaterials/{r["id"]}','fields':encode({**r,'databaseRegistered':True})['mapValue']['fields']},'currentDocument':{'exists':False}} for r in batch]})
        for record in batch: record['databaseRegistered']=True
        temporary=path.with_suffix('.json.tmp');temporary.write_text(json.dumps(state,ensure_ascii=False,separators=(',',':')),encoding='utf8');temporary.replace(path)
        print(f'Registered {min(offset+200,len(fresh))}/{len(fresh)} new document records; all remain unpublished.',flush=True)
    # Retire only the known starter course, retaining its complete original record.
    try:
        course=request(base+'/courses/CS-101');fields=course['fields']
        if fields.get('creditLine',{}).get('stringValue')=='UniHub original demonstration material' and fields.get('outline',{}).get('stringValue','').startswith('Sample outline'):
            original=backup/'original-starter-CS-101.json'
            if not original.exists():original.write_text(json.dumps(course,ensure_ascii=False),encoding='utf8')
            request(base+'/courses/CS-101?updateMask.fieldPaths=published','PATCH',{'fields':{'published':{'booleanValue':False}}})
            print('Starter course unpublished; original backed up. No provided material was published.',flush=True)
    except urllib.error.HTTPError as error:
        if error.code!=404:raise
    temporary=path.with_suffix('.json.tmp');temporary.write_text(json.dumps(state,ensure_ascii=False,separators=(',',':')),encoding='utf8');temporary.replace(path)
    print(json.dumps({'registered':sum(r['databaseRegistered'] for r in state['resources'].values()),'new':len(fresh),'published':sum(r['published'] for r in state['resources'].values()),'fileStorage':'local','cloudFileUploads':0}),flush=True)

if __name__=='__main__':main()
