// One plain S3 GET (the production download shape) signed with the AWS documentation example credentials at a fixed time.
// EXPECTED comes from the botocore reference (ref/expected.json, case bench-download).
export const HREF =
  'https://examplebucket.s3.amazonaws.com/2022/05/media/upload/facebook-131__m4qhsQzwMdHCoc6UnBOYv.webp';
export const EXPECTED = '038caaeca9783938139f75f49fed7f8c128dd93fd5c97a9bf863cdadb0cab17a';
// botocore S3SigV4Auth, bench-download with unsigned=true.
export const UNSIGNED_EXPECTED = '906aa3bd3f2f9a716f82df9de24562805acd05919dbbe93e0c98b6282ad632be';
export const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
export const CREDS = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
export const REGION = 'us-east-1';
export const FIXED_ISO = '2013-05-24T00:00:00.000Z';
export const FIXED_MS = Date.parse(FIXED_ISO);
// a missing header (null or undefined) throws here, which the caller reports as an error (the cast is for the type checker only)
/** @param {string | null | undefined} auth */
export const sigOf = (auth) => /** @type {string} */ (auth).slice(-64);
export function freezeClock() {
  const RealDate = globalThis.Date;
  // a cast: the subclass has no call signature (Date() without new), which DateConstructor declares
  globalThis.Date = /** @type {DateConstructor} */ (
    /** @type {unknown} */ (
      class extends RealDate {
        /** @param {...any} a */
        constructor(...a) {
          super(.../** @type {[string]} */ (a.length === 0 ? [FIXED_ISO] : a));
        }
        /** @override */
        static now() {
          return FIXED_MS;
        }
      }
    )
  );
}
export const IDS = [
  'sigflint',
  'sigflint-web',
  'aws4fetch',
  'aws4',
  'smithy',
  'smithy-web',
  'aws-sig',
  'wdl',
  'minio',
  's3mini',
  'tiny-oss',
  'lean-s3',
  's3-lite-client',
];
