#!/usr/bin/env python3
"""Reference signatures for the conformance cases, per the SigV4 specification, computed with
botocore's own signing steps.

botocore signs the query string exactly as written, so this script first normalizes each request
the way the specification (and every spec-following server) does, then lets botocore build the
canonical request, the string to sign and the signature:
  path   : '+' is a space (as S3 reads it; an encoded plus is %2B), percent-decode to bytes, then
           encode every byte outside A-Za-z0-9-._~ and '/'
  query  : split on '&', split name/value on the first '=', form-decode ('+' is a space, then
           percent-decode to bytes), encode every byte outside A-Za-z0-9-._~, sort by encoded name
           then encoded value, join as name=value
  headers: lowercase names, trim and collapse runs of whitespace in values, sort by name
Fixed clock 20130524T000000Z, region us-east-1, the AWS documentation example credentials.
Credentials get a session token when a case has a `token` field.
Usage: oracle.py cases.json expected.json
"""

import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import quote_from_bytes, unquote_to_bytes, urlsplit

from botocore.auth import S3SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials

CREDS = Credentials("AKIAIOSFODNN7EXAMPLE", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")
REGION = "us-east-1"
STAMP = "20130524T000000Z"
EMPTY_SHA = hashlib.sha256(b"").hexdigest()


def enc(b: bytes, safe: str) -> str:
    return quote_from_bytes(b, safe=safe)


def canonical_path(path: str) -> str:
    return enc(unquote_to_bytes((path or "/").replace("+", " ")), "/-_.~") or "/"


def canonical_query(query: str) -> str:
    if not query:
        return ""
    pairs = []
    for part in query.split("&"):
        if not part:
            continue
        name, _, value = part.partition("=")
        n = enc(unquote_to_bytes(name.replace("+", " ")), "-_.~")
        v = enc(unquote_to_bytes(value.replace("+", " ")), "-_.~")
        pairs.append((n, v))
    pairs.sort()
    return "&".join(f"{n}={v}" for n, v in pairs)


def sign(case):
    parts = urlsplit(case["href"])
    path = canonical_path(parts.path)
    query = canonical_query(parts.query)
    url = f"{parts.scheme}://{parts.netloc}{path}" + (f"?{query}" if query else "")
    body = case["body"].encode("utf-8")
    payload = "UNSIGNED-PAYLOAD" if case["unsigned"] else hashlib.sha256(body).hexdigest()
    stamp = case.get("stamp", STAMP)
    headers = {"X-Amz-Date": stamp, "X-Amz-Content-SHA256": payload}
    headers.update(case["headers"])
    if "token" in case:
        headers["X-Amz-Security-Token"] = case["token"]
    req = AWSRequest(method=case["method"], url=url, headers=headers)
    req.context["timestamp"] = stamp
    signer = S3SigV4Auth(CREDS, "s3", case.get("region", REGION))
    canonical = signer.canonical_request(req)
    sts = signer.string_to_sign(req, canonical)
    return {"sig": signer.signature(sts, req), "canonical": canonical}


def main():
    cases = json.loads(Path(sys.argv[1]).read_text())
    out = {c["id"]: sign(c) for c in cases}
    Path(sys.argv[2]).write_text(json.dumps(out))
    print(f"{len(out)} reference signatures written")


if __name__ == "__main__":
    main()
