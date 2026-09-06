"""Validate and export approved Atlas records; never export private research rows."""
import argparse
import json
from pathlib import Path

FIELDS = {'name', 'material_family', 'common_uses', 'surface_or_feel', 'manufacturing_origin'}


def public_export(data):
    seen = set()
    public = []
    for record in data['materials']:
        ident = record['id']
        if not isinstance(ident, str) or not ident or ident in seen:
            raise ValueError('Missing or duplicate material ID')
        seen.add(ident)
        if record.get('publication_status') != 'approved':
            continue
        fields = record['public_fields']
        if set(fields) != FIELDS:
            raise ValueError(ident + ': public fields differ from contract')
        if not all(isinstance(fields[f], str) and fields[f].strip()
                   for f in ('name', 'material_family', 'surface_or_feel')):
            raise ValueError(ident + ': missing display text')
        if not isinstance(fields['common_uses'], list) or not fields['common_uses'] or not all(isinstance(u, str) and u.strip() for u in fields['common_uses']):
            raise ValueError(ident + ': invalid uses')
        review = record.get('editorial_review', {})
        if not review.get('reviewer') or not review.get('date'):
            raise ValueError(ident + ': editorial review required')
        evidence = record.get('field_evidence', {})
        for field, value in fields.items():
            if value is not None and evidence.get(field, {}).get('status') != 'approved':
                raise ValueError(ident + ': unapproved evidence for ' + field)
        citations = record.get('public_citations', [])
        if not citations:
            raise ValueError(ident + ': public citation required')
        safe_citations = []
        for citation in citations:
            url = citation.get('url', '')
            if not url.startswith('https://') or not citation.get('title') or citation.get('approved_for_publication') is not True:
                raise ValueError(ident + ': invalid public citation')
            safe_citations.append({'title': citation['title'], 'url': url})
        public.append({'id': ident, **fields, 'sources': safe_citations,
                       'last_reviewed': review['date']})
    return {'schema_version': '1.0', 'materials': public}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    data = public_export(json.loads(args.input.read_text(encoding='utf-8')))
    with args.output.open('x', encoding='utf-8') as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
    print(f"Exported {len(data['materials'])} approved records.")

