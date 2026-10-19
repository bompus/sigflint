// One plain S3 GET (the production download shape) signed with the AWS documentation example credentials at a fixed time.
// EXPECTED comes from the botocore reference (ref/expected.json, case bench-download).
export const HREF = 'https://examplebucket.s3.amazonaws.com/2022/05/media/upload/facebook-131__m4qhsQzwMdHCoc6UnBOYv.webp';
export const EXPECTED = '038caaeca9783938139f75f49fed7f8c128dd93fd5c97a9bf863cdadb0cab17a';
export const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
export const CREDS = { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' };
export const REGION = 'us-east-1';
export const FIXED_ISO = '2013-05-24T00:00:00.000Z';
export const FIXED_MS = Date.parse(FIXED_ISO);
export const sigOf = (auth) => auth.slice(-64);
export function freezeClock() {
  const RealDate = globalThis.Date;
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length === 0 ? [FIXED_ISO] : a)); }
    static now() { return FIXED_MS; }
  };
}
export const IDS = ['sigflint', 'sigflint-web', 'aws4fetch', 'aws4', 'smithy', 'smithy-web', 'aws-sig', 'wdl', 'minio'];
