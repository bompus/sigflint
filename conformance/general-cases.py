"""Stage 1: random and hand-written requests for non-S3 services -> raw.json (not yet signed).
Seeded, so a rerun gives the same file. Only well-formed UTF-8 escapes are generated; edge cases that need a decision
(empty query names, invalid UTF-8 escapes) are left out of the corpus."""
import json, random, sys
from urllib.parse import quote

rnd = random.Random(20261014)
SERVICES = [('execute-api', 'us-east-1'), ('dynamodb', 'us-west-2'), ('sqs', 'eu-west-1'), ('sts', 'us-east-1'), ('lambda', 'ap-southeast-2'),
            ('kms', 'us-east-2'), ('iam', 'us-east-1'), ('es', 'eu-central-1'), ('bedrock-runtime', 'us-east-1'), ('ses', 'us-west-2'),
            ('sns', 'sa-east-1'), ('secretsmanager', 'ca-central-1'), ('logs', 'eu-north-1'), ('ec2', 'ap-northeast-1'), ('events', 'us-gov-west-1')]
STAMPS = ['20130524T000000Z', '20240229T120000Z', '20241231T235959Z', '20260101T000001Z', '20150830T123600Z']
SEG = ['a', 'bucket', 'items', 'v1', 'x y', 'café', '日本語', 'a+b', 'a%20b', 'a%2Fb', '%e2%82%ac', "!$&'()*,;=:@", '~tilde', 'under_score', 'dash-dash', 'UPPER', '.', '..', '', '%2e', '%25', 'q?x', 'h#x', '😀']
KEYS = ['Action', 'Version', 'Name', 'prefix', 'max-keys', 'x', 'a b', 'café', 'k+v', 'k%2Bv', 'k=v', 'a&b', 'Z', 'a', 'A']
VALS = ['', '1', 'abc', 'two words', 'a+b', 'a%2Bb', 'café', '日本', 'x=y', 'a&b', '~', "!'()*", '%25', '/slash', ':colon', '@at', '😀', 'ZZ', 'aa']
HDRS = [('content-type', 'application/json'), ('content-type', 'application/x-amz-json-1.0'), ('x-amz-target', 'DynamoDB_20120810.GetItem'), ('x-amz-target', 'AmazonSQS.SendMessage'),
        ('accept', 'application/json'), ('x-custom', '  padded   value  '), ('x-custom', 'tab\there'), ('x-amz-meta-a', 'A B  C'), ('x-amz-security-token-x', 'z'),
        ('content-md5', 'rL0Y20zC+Fzt72VPzMSk2A=='), ('x-api-key', 'k'), ('X-Mixed-CASE', 'Value')]
BODIES = [None, '', '{}', '{"TableName":"t","Key":{"id":{"S":"1"}}}', 'Action=GetCallerIdentity&Version=2011-06-15', 'café 日本 😀', 'x' * 5000]
PAYLOAD_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

def enc(s):  # percent-encode what a caller would put in a URL; keep existing escapes
    return quote(s, safe="/%!$&'()*+,;=:@~")

def host(service, region):
    return {'iam': 'iam.amazonaws.com', 'sts': 'sts.amazonaws.com'}.get(service) if rnd.random() < 0.3 and service in ('iam', 'sts') else f'{service}.{region}.amazonaws.com'

cases = []
def add(kind, **c):
    c.setdefault('headers', {}); c.setdefault('body', None); c.setdefault('unsigned', False); c.setdefault('token', None)
    c.setdefault('stamp', STAMPS[0]); c.setdefault('method', 'GET'); c['kind'] = kind
    c['id'] = f'g-{kind}-{len(cases):04d}'
    cases.append(c)

# hand-written: the shapes real services use
for service, region in SERVICES:
    h = host(service, region)
    add('plain', service=service, region=region, href=f'https://{h}/')
    add('post-json', service=service, region=region, method='POST', href=f'https://{h}/', headers={'content-type': 'application/x-amz-json-1.0', 'x-amz-target': 'Svc.Op'}, body='{"a":1}')
    add('query-action', service=service, region=region, href=f'https://{h}/?Action=ListThings&Version=2010-05-08&Marker=abc%2Bdef')
    add('token', service=service, region=region, href=f'https://{h}/x', token='IQoJb3JpZ2luX2VjEJr//////////wEaCXVzLWVhc3QtMSJHMEUCIQD+test/token==')
    add('unsigned-https', service=service, region=region, method='PUT', href=f'https://{h}/obj', body='data', unsigned=True)
    add('unsigned-http', service=service, region=region, method='PUT', href=f'http://{h}/obj', body='data', unsigned=True)
    add('port', service=service, region=region, href=f'https://{h}:8443/a/b?x=1')
    add('supplied-hash', service=service, region=region, method='POST', href=f'https://{h}/', headers={'x-amz-content-sha256': PAYLOAD_HASH}, body='')
add('local', service='execute-api', region='us-east-1', href='http://localhost:3000/dev/items?limit=5')
add('local', service='execute-api', region='us-east-1', href='https://abc123.execute-api.us-east-1.amazonaws.com/prod/items/1')

# random
for i in range(1500):
    service, region = rnd.choice(SERVICES)
    segs = [rnd.choice(SEG) for _ in range(rnd.choice([0, 0, 1, 2, 3, 4]))]
    path = '/' + '/'.join(enc(s) for s in segs) + ('/' if segs and rnd.random() < 0.2 else '')
    pairs = [(rnd.choice(KEYS), rnd.choice(VALS)) for _ in range(rnd.choice([0, 0, 1, 2, 3, 5]))]
    query = '&'.join(quote(k, safe='%') + '=' + quote(v, safe='%') if rnd.random() < 0.9 else quote(k, safe='%') for k, v in pairs)
    headers = dict(rnd.sample(HDRS, rnd.choice([0, 0, 1, 2, 3])))
    body = rnd.choice(BODIES) if rnd.random() < 0.6 else None
    method = rnd.choice(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'])
    scheme = 'http' if rnd.random() < 0.1 else 'https'
    unsigned = rnd.random() < 0.1
    token = 'tok' + str(rnd.randrange(10**6)) + rnd.choice(['', '+/=', ' x ']) if rnd.random() < 0.2 else None
    add('fuzz', service=service, region=region, method=method, href=f'{scheme}://{host(service, region)}{path}' + ('?' + query if query else ''), headers=headers, body=body, unsigned=unsigned, token=token, stamp=rnd.choice(STAMPS))

json.dump(cases, open(sys.argv[1], 'w'), ensure_ascii=False, indent=0)
print(len(cases), 'cases')
