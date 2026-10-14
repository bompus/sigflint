// SigV4a's ECDSA P-256 for the entries that have node:crypto (Node, Deno, Bun). The key is rebuilt from the derived scalar; ECDH supplies the public point that a JWK needs.
import crypto from 'node:crypto';

const b64url = (bytes) => Buffer.from(bytes).toString('base64url');

export const ecdsa = {
  key(d) {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(d);
    const point = ecdh.getPublicKey();
    return crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: b64url(d), x: b64url(point.subarray(1, 33)), y: b64url(point.subarray(33)) }, format: 'jwk' });
  },
  sign: (key, text) => crypto.sign('sha256', text, { key, dsaEncoding: 'der' }).toString('hex'),
};
