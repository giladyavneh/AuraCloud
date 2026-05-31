import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM with random IV per payload. Ciphertext is prefixed with a
// version tag so we can swap to KMS or another scheme later without breaking
// existing rows.
const VERSION = 'v1';
const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY is not set');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes (base64)');
  cachedKey = buf;
  return buf;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${Buffer.concat([iv, enc, tag]).toString('base64')}`;
}

export function decryptSecret(payload: string): string {
  const sep = payload.indexOf(':');
  if (sep < 0) throw new Error('Ciphertext is missing version prefix');
  const version = payload.slice(0, sep);
  if (version !== VERSION) throw new Error(`Unknown ciphertext version: ${version}`);
  const buf = Buffer.from(payload.slice(sep + 1), 'base64');
  if (buf.length < IV_LENGTH + TAG_LENGTH) throw new Error('Ciphertext is truncated');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const enc = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
