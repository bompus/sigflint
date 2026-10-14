"""Presigned URLs: generate cases, normalise like the JS URL parser sees them (via norm.mjs), sign with botocore's SigV4QueryAuth
(any service) and S3SigV4QueryAuth (s3) with a fixed clock. Usage: presign.py gen raw-pre.json | presign.py sign norm-pre.json out.json
Query keys are unique per case (botocore's presign keeps one value per key). S3 paths are generated already in canonical form
because botocore's S3 presigner signs the path as given."""
import json, random, sys, datetime
from urllib.parse import quote, urlsplit, parse_qsl

mode = sys.argv[1]
creds = ('AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')
STAMPS = ['20130524T000000Z', '20240229T120000Z', '20260101T000001Z']
if mode == 'gen':
    rnd = random.Random(20261015)
    SERVICES = [('execute-api', 'us-east-1'), ('dynamodb', 'us-west-2'), ('lambda', 'ap-southeast-2'), ('sqs', 'eu-west-1'), ('es', 'eu-central-1'), ('iam', 'us-east-1')]
    SEG = ['a', 'items', 'x y', 'café', 'a+b', 'a%20b', '~t', 'UP', "!$&'()*,;=:@", '日本']
    KEYS = ['Action', 'Version', 'Name', 'prefix', 'max-keys', 'x', 'a b', 'café', 'k+v', 'Z', 'a', 'A', 'response-content-disposition']
    VALS = ['', '1', 'abc', 'two words', 'a+b', 'a%2Bb', 'café', 'x=y', 'a&b', '~', "!'()*", '%25', '/slash', ':colon', 'attachment; filename="a b.txt"']
    HDRS = [('content-type', 'application/json'), ('x-amz-acl', 'public-read'), ('x-amz-meta-a', 'A  B'), ('content-md5', 'rL0Y20zC+Fzt72VPzMSk2A=='), ('x-custom', '  padded   value  ')]
    cases = []
    def add(**c):
        c.setdefault('headers', {}); c.setdefault('unsigned', False); c.setdefault('token', None); c.setdefault('stamp', STAMPS[0]); c.setdefault('expires', 3600)
        c['id'] = f"p-{c['service']}-{len(cases):04d}"; cases.append(c)
    for i in range(1600):
        s3 = rnd.random() < 0.5
        service, region = ('s3', rnd.choice(['us-east-1', 'eu-west-1', 'ap-southeast-2'])) if s3 else rnd.choice(SERVICES)
        segs = [rnd.choice(SEG) for _ in range(rnd.choice([0, 1, 2, 3]))]
        if s3:
            path = '/' + '/'.join(quote(s, safe='~') for s in segs) if segs else '/'   # canonical S3 form: only unreserved bytes unescaped
            host = f'bkt{rnd.randrange(100)}.s3.{region}.amazonaws.com'
        else:
            path = '/' + '/'.join(quote(s, safe="%!$&'()*+,;=:@~") for s in segs) if segs else '/'
            host = f'{service}.{region}.amazonaws.com'
        keys = rnd.sample(KEYS, rnd.choice([0, 0, 1, 2, 3]))
        query = '&'.join(quote(k, safe='') + '=' + quote(rnd.choice(VALS), safe='') for k in keys)
        add(service=service, region=region, method=rnd.choice(['GET', 'PUT', 'GET', 'HEAD', 'DELETE']), href=f'https://{host}{path}' + ('?' + query if query else ''),
            headers=dict(rnd.sample(HDRS, rnd.choice([0, 0, 0, 1, 2]))), token=('tok' + str(rnd.randrange(10**6)) + rnd.choice(['', '+/=']) if rnd.random() < 0.25 else None),
            unsigned=(not s3 and rnd.random() < 0.15), expires=rnd.choice([1, 60, 3600, 86400, 604800]), stamp=rnd.choice(STAMPS))
    json.dump(cases, open(sys.argv[2], 'w'), ensure_ascii=False)
    print(len(cases), 'cases')
else:
    import botocore.auth as A
    from botocore.awsrequest import AWSRequest
    from botocore.credentials import Credentials
    out = []
    for c in json.load(open(sys.argv[2])):
        now = datetime.datetime.strptime(c['stamp'], '%Y%m%dT%H%M%SZ')
        A.get_current_datetime = lambda remove_tzinfo=True, now=now: now
        cls = A.S3SigV4QueryAuth if c['service'] == 's3' else A.SigV4QueryAuth
        signer = cls(Credentials(creds[0], creds[1], c['token']), c['service'], c['region'], c['expires'])
        req = AWSRequest(method=c['method'], url=c['href'], headers=dict(c['headers']))
        if c['unsigned']:
            req.context['payload_signing_enabled'] = False
        cap = {}
        orig = signer.canonical_request
        def spy(request, orig=orig):
            r = orig(request); cap['cr'] = r; return r
        signer.canonical_request = spy
        signer.add_auth(req)
        q = dict(parse_qsl(urlsplit(req.url).query, keep_blank_values=True))
        c['sig'] = q.pop('X-Amz-Signature')
        c['authParams'] = {k: v for k, v in q.items() if k.startswith('X-Amz-')}
        c['canonical'] = cap['cr']
        out.append(c)
    json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False)
    print(len(out), 'signed')
