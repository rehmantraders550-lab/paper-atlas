import copy
import unittest
from validate_public_data import public_export


class PublicationTests(unittest.TestCase):
    def setUp(self):
        fields = {'name':'Test paper', 'material_family':'paper', 'common_uses':['Test use'],
                  'surface_or_feel':'Test surface', 'manufacturing_origin':None}
        self.record = {'id':'test-1', 'publication_status':'approved', 'public_fields':fields,
                       'field_evidence':{k:{'status':'approved'} for k,v in fields.items() if v is not None},
                       'editorial_review':{'reviewer':'Test reviewer','date':'2026-09-06'},
                       'public_citations':[{'title':'Test citation','url':'https://example.com/material','approved_for_publication':True}],
                       'raw_research_row':{'private':'Do not export'}, 'local_path':'private file'}

    def test_private_fields_excluded(self):
        result = public_export({'materials':[self.record]})['materials'][0]
        self.assertNotIn('raw_research_row', result)
        self.assertNotIn('local_path', result)

    def test_unapproved_records_excluded(self):
        self.record['publication_status']='needs_primary_verification'
        self.assertEqual(public_export({'materials':[self.record]})['materials'], [])

    def test_unsupported_claim_rejected(self):
        self.record['field_evidence']['name']['status']='unverified_saved_research'
        with self.assertRaises(ValueError): public_export({'materials':[self.record]})

    def test_duplicate_rejected(self):
        with self.assertRaises(ValueError): public_export({'materials':[self.record, copy.deepcopy(self.record)]})

    def test_missing_citation_rejected(self):
        self.record['public_citations']=[]
        with self.assertRaises(ValueError): public_export({'materials':[self.record]})


if __name__ == '__main__': unittest.main()

