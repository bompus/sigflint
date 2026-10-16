# Security policy

sigflint computes request signatures from an access key and a secret key you give it. It does not log them, write them anywhere or send them; what it returns is the signature headers, the presigned URL, or the signed chunk and event bytes. The access key ID and any session token are visible in those headers and URLs; the secret key never is. Its signing-key caches keep secret keys in process memory: each cached signing key (up to 1,000 per cache) is stored under a lookup string that contains the secret access key it was derived from.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue for a security problem.

Include the version, the runtime and its version, and a request that reproduces the problem. A wrong signature that makes a request fail is an ordinary bug; report it as an issue. Report privately anything that could expose a secret or let a request be signed that the caller did not intend, such as a canonicalization difference that lets a different request share a signature.

## Supported versions

Only the latest release gets fixes.
