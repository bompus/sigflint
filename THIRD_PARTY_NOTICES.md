# Third-party notices

sigflint has no dependencies and copies no third-party source code into
`src/`.

## Contributor Covenant

Source: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html

- `CODE_OF_CONDUCT.md`: version 2.1, with this repository's reporting method
  filled in. Licensed under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); its own
  Attribution section credits the source.

## Reference implementations

The test corpora in `test/` hold the signatures that botocore (Apache-2.0),
the AWS CRT (Apache-2.0) and the AWS SDK for JavaScript signer (Apache-2.0)
produce for requests this repository generates (`conformance/`). The corpora
contain their output, not their code; the four S3 example signatures come
from the S3 documentation. The benchmark harness in `bench/` runs the other
libraries it compares from npm and ships none of their code.
