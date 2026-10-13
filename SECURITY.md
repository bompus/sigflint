# Security policy

sigflint computes request signatures from an access key and a secret key you give it. It does not store, log or send them anywhere; the only output is the headers it returns.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue for a security problem.

Include the version, the runtime and its version, and a request that reproduces the problem. A wrong signature that makes a request fail is an ordinary bug; report it as an issue. Report privately anything that could expose a secret or let a request be signed that the caller did not intend, such as a canonicalization difference that lets a different request share a signature.

## Supported versions

Only the latest release gets fixes.
