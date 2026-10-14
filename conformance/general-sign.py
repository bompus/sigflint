"""Stage 3: botocore's generic SigV4Auth signs each normalized case with a fixed clock -> corpus-general.json
(adds sig = last 64 hex chars of Authorization, canonical = canonical request, authorization)."""
import json, sys, datetime
import botocore.auth as A
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials

creds = ('AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')
cases = json.load(open(sys.argv[1]))
out = []
for c in cases:
    now = datetime.datetime.strptime(c['stamp'], '%Y%m%dT%H%M%SZ')
    A.get_current_datetime = lambda remove_tzinfo=True, now=now: now
    cr = Credentials(creds[0], creds[1], c['token'])
    body = c['body'].encode('utf-8') if c['body'] else None
    req = AWSRequest(method=c['method'], url=c['pathHref'], data=body, headers=dict(c['headers']), params=[tuple(p) for p in c['pairs']] or None)
    if c['unsigned']:
        req.context['payload_signing_enabled'] = False
    signer = A.SigV4Auth(cr, c['service'], c['region'])
    cap = {}
    orig = signer.canonical_request
    def spy(request, orig=orig):
        r = orig(request); cap['cr'] = r; return r
    signer.canonical_request = spy
    signer.add_auth(req)
    auth = req.headers['Authorization']
    c['sig'] = auth.split('Signature=')[1]
    c['canonical'] = cap['cr']
    c['authorization'] = auth
    out.append(c)
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(out), 'signed')
