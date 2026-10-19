"""Usage: v4a.py corpus-general.json corpus-presign.json out.json
SigV4a reference: botocore's CRT signers (awscrt) sign requests (header and presigned)
-> corpus-v4a.json. ECDSA is randomised, so the checker verifies these signatures with the public
key derived by the JS code instead of comparing bytes.
Bases: the first fuzz cases of corpus-general.json (any service) and the S3 cases of
corpus-presign.json."""

import datetime
import json
import random
import sys
from pathlib import Path

# botocore.auth comes first: importing botocore.crt.auth on its own fails with a circular import
import botocore.auth
import botocore.crt.auth as C
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials

# the CRT signers below are the ones botocore itself uses for SigV4a
assert botocore.auth.AUTH_TYPE_MAPS["v4a"] is C.CrtSigV4AsymAuth
rnd = random.Random(7)
creds = ("AKIAIOSFODNN7EXAMPLE", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")
SETS = ["us-east-1", "us-east-1,us-west-2", "*", "eu-central-1,eu-west-1,eu-north-1"]
gen = [
    c
    for c in json.loads(Path(sys.argv[1]).read_text())
    if c["kind"] in ("fuzz", "plain", "post-json", "token", "unsigned-https", "query-action")
]
pre = json.loads(Path(sys.argv[2]).read_text())
base = rnd.sample(gen, 450) + rnd.sample([c for c in pre if c["service"] == "s3"], 250)
out = []


def run(cls, c, mode, regionset):
    now = datetime.datetime.strptime(c["stamp"], "%Y%m%dT%H%M%SZ").replace(tzinfo=datetime.UTC)
    C.get_current_datetime = lambda remove_tzinfo=True, now=now: now
    cr = Credentials(creds[0], creds[1], c.get("token"))
    body = c["body"].encode("utf-8") if c.get("body") else None
    req = AWSRequest(method=c["method"], url=c["href"], headers=dict(c["headers"]), data=body)
    if c.get("unsigned"):
        req.context["payload_signing_enabled"] = False
    if mode == "query":
        signer = cls(cr, c["service"], regionset, c.get("expires", 3600))
    else:
        signer = cls(cr, c["service"], regionset)
    signer.add_auth(req)
    return req


for c in base:
    s3 = c["service"] == "s3"
    rs = rnd.choice(SETS)
    mode = "query" if ("expires" in c or rnd.random() < 0.4) else "header"
    if mode == "query" and "expires" not in c:
        c = dict(
            c, expires=rnd.choice([60, 3600, 86400]), body=None
        )  # presigned URLs carry no body; keys must be unique
        keys = [
            k
            for k, _ in __import__("urllib.parse", fromlist=["x"]).parse_qsl(
                c["href"].partition("?")[2], keep_blank_values=True
            )
        ]
        if len(keys) != len(set(keys)):
            continue
    cls = (
        (C.CrtS3SigV4AsymQueryAuth if s3 else C.CrtSigV4AsymQueryAuth)
        if mode == "query"
        else (C.CrtS3SigV4AsymAuth if s3 else C.CrtSigV4AsymAuth)
    )
    try:
        req = run(cls, c, mode, rs)
    except Exception as e:
        out.append({"id": c["id"], "skipped": str(e)[:120]})
        continue
    rec = {
        k: c.get(k)
        for k in (
            "id",
            "service",
            "region",
            "method",
            "href",
            "headers",
            "body",
            "token",
            "unsigned",
            "expires",
            "stamp",
        )
    }
    rec.update(mode=mode, regionSet=rs)
    if mode == "header":
        rec["authorization"] = req.headers["Authorization"]
    else:
        rec["url"] = req.url
    out.append(rec)
Path(sys.argv[3]).write_text(json.dumps(out, ensure_ascii=False))
print(
    len(out),
    "cases,",
    sum(1 for r in out if "skipped" in r),
    "skipped by the reference signer,",
    sum(1 for r in out if r.get("mode") == "query"),
    "presigned",
)
