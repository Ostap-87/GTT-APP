// Сессии: подписанный токен «openid + срок», без базы. Коды приглашений — случайные строки.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const b64 = (buf) => Buffer.from(buf).toString('base64url');

export function signSession(secret, openid, ttlDays, now = Date.now()) {
  const payload = b64(JSON.stringify({ sub: openid, exp: now + ttlDays * 86400_000 }));
  const sig = b64(createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifySession(secret, token, now = Date.now()) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = createHmac('sha256', secret).update(payload).digest();
  const given = Buffer.from(sig || '', 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > now && typeof data.sub === 'string' ? data.sub : null;
  } catch {
    return null;
  }
}

// Код приглашения помещается в scene QR-кода мини-программы (до 32 символов).
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function inviteCode(length = 12) {
  const bytes = randomBytes(length);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}
