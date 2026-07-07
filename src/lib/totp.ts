import { createHmac } from 'crypto';

// Minimal RFC 6238 TOTP generator (30s step, 6 digits, SHA-1) — no external
// dependency needed. AngelOne's login requires a live TOTP code generated
// from the secret shown when you enable "TOTP" under Profile > Settings in
// the AngelOne app; that secret is a base32 string (like an authenticator
// app seed), which this decodes and feeds into the standard HOTP algorithm.

function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  let bits = '';
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) throw new Error('Invalid base32 character in TOTP secret');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

export function generateTotp(base32Secret: string, stepSeconds = 30): string {
  const key = base32Decode(base32Secret);
  const counter = Math.floor(Date.now() / 1000 / stepSeconds);
  return hotp(key, counter);
}
