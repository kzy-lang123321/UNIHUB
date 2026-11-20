import importlib.util
import tempfile
from pathlib import Path
import unittest
import zipfile
spec=importlib.util.spec_from_file_location('ingest',Path(__file__).resolve().parents[1]/'scripts/library-ingest.py')
ingest=importlib.util.module_from_spec(spec);spec.loader.exec_module(ingest)
class IngestTests(unittest.TestCase):
    def test_does_not_treat_chapter_number_as_semester(self):
        suggestion=ingest.suggest('COMPUTER SCIENCE/ICT chapter 4.pdf','',8)
        self.assertIsNone(suggestion['semester']);self.assertEqual(suggestion['subject'],'ICT')
    def test_conflicting_subject_and_folder_stays_unclassified(self):
        suggestion=ingest.suggest('BOTANY/Literary Theory.pdf','',300)
        self.assertEqual(suggestion['programId'],'');self.assertIn('conflict',' '.join(suggestion['reasons']))
    def test_archive_traversal_is_reported_and_original_is_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);archive=root/'notes.zip'
            with zipfile.ZipFile(archive,'w') as z:
                z.writestr('../outside.txt','bad');z.writestr('ICT/Lecture 1.txt','Original notes')
            before=archive.read_bytes();files,errors=ingest.expand_zip(archive,root/'state')
            self.assertEqual(len(errors),1);self.assertEqual(len(files),1)
            self.assertFalse((root/'outside.txt').exists());self.assertEqual(archive.read_bytes(),before)
    def test_unreadable_pdf_is_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);path=root/'bad.pdf';path.write_bytes(b'%PDF-not-a-real-document')
            record,_=ingest.inspect(path,'bad.pdf',root/'state')
            self.assertEqual(record['status'],'corrupt');self.assertFalse(record['published'])
if __name__=='__main__':unittest.main()
