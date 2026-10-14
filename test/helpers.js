export const credentials = { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' };
export const stamp = '20130524T000000Z';
export const now = Date.parse('2013-05-24T00:00:00Z');

export const toMs = (s) => Date.parse(s.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z'));

// signs a corpus case: the request exactly as the case describes it
export function signCase(getAuthHeaders, c) {
  return getAuthHeaders(
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
  );
}
