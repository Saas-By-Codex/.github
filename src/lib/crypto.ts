import crypto from "crypto";

/**
 * Authenticated symmetric encryption for connected-account tokens.
 *
 * Tokens issued by manufacturer/telematics OAuth flows are sensitive and must
 * NEVER be stored in plain text. We use AES-256-GCM with a key supplied via the
 * TOKEN_ENCRYPTION_KEY env var (64 hex chars = 32 bytes).
 *
 * Output format: base64( iv(12) || authTag(16) || ciphertext )
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Clearly-insecure fallback so a zero-config demo deploy can still encrypt/
// decrypt round-trip without crashing. ALWAYS set TOKEN_ENCRYPTION_KEY in
// production (openssl rand -hex 32).
const DEV_FALLBACK_KEY =
  "0000000000000000000000000000000000000000000000000000000000000000";

function getKey(): Buffer {
  let hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "TOKEN_ENCRYPTION_KEY is not set to 64 hex chars — using an INSECURE " +
          "fallback. Set TOKEN_ENCRYPTION_KEY (openssl rand -hex 32).",
      );
    }
    hex = DEV_FALLBACK_KEY;
  }
  return Buffer.from(hex, "hex");
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(payload: string): string {
  const key = getKey();
  const data = Buffer.from(payload, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
