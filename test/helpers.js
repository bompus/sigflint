/**
 * A case in test/corpus.json (conformance/cases.mjs) with botocore's signature and canonical request.
 * @typedef {Object} CorpusCase
 * @property {string} id
 * @property {string} kind
 * @property {string} method
 * @property {string} href
 * @property {Record<string, string>} headers
 * @property {string} body
 * @property {boolean} unsigned
 * @property {string} [token]
 * @property {string} [stamp]
 * @property {string} [region]
 * @property {string} sig
 * @property {string} canonical
 */

export const credentials = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
export const stamp = '20130524T000000Z';
export const now = Date.parse('2013-05-24T00:00:00Z');

/** @param {string} s */
export const toMs = (s) =>
  Date.parse(s.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'));

/**
 * Signs a corpus case: the request exactly as the case describes it.
 * @template {(request: import('../src/base.js').SignRequest, credentials: import('../src/base.js').Credentials) => unknown} F
 * @param {F} getAuthHeaders
 * @param {CorpusCase} c
 * @returns {ReturnType<F>}
 */
export function signCase(getAuthHeaders, c) {
  return /** @type {ReturnType<F>} */ (
    getAuthHeaders(
      {
        method: c.method,
        url: new URL(c.href),
        region: c.region ?? 'us-east-1',
        body: c.body,
        unsignedPayload: c.unsigned,
        signHeaders: { ...c.headers },
        now: toMs(c.stamp ?? stamp),
      },
      c.token ? { ...credentials, sessionToken: c.token } : credentials,
    )
  );
}
