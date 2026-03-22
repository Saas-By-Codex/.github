import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const AES_ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const rawKey = process.env.STRIPE_KEY_ENCRYPTION_SECRET;
  if (!rawKey) {
    throw new Error('Missing STRIPE_KEY_ENCRYPTION_SECRET environment variable.');
  }

  const key = Buffer.from(rawKey, 'base64');
  if (key.length !== 32) {
    throw new Error('STRIPE_KEY_ENCRYPTION_SECRET must be base64-encoded 32-byte key.');
  }

  return key;
}

export function encryptStripeKey(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(AES_ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptStripeKey(payload: string): string {
  const [ivPart, tagPart, encryptedPart] = payload.split('.');

  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error('Invalid encrypted key format.');
  }

  const iv = Buffer.from(ivPart, 'base64');
  const tag = Buffer.from(tagPart, 'base64');
  const encrypted = Buffer.from(encryptedPart, 'base64');

  const decipher = createDecipheriv(AES_ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
