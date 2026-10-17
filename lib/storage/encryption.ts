import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const KEY_LENGTH = 32; // 256-bit key

export interface EncryptedPayload {
  isEncrypted: boolean;
  ciphertextBuffer: Buffer;
  encryptionVersion: number;
  wrappedDataKey: string | null;
  encryptionIv: string | null;
  encryptionTag: string | null;
}

/**
 * Derives a consistent 256-bit master key from environment variable.
 */
function getMasterKey(): Buffer {
  const masterSecret = process.env.PROOF_MASTER_KEY;
  if (!masterSecret) {
    throw new Error("PROOF_MASTER_KEY is required when PROOF_ENCRYPTION is enabled");
  }
  return crypto.createHash("sha256").update(masterSecret).digest();
}

/**
 * Encrypts a file buffer using a unique per-file Data Encryption Key (DEK),
 * and wraps the DEK with the master key using AES-256-GCM.
 */
export function encryptFileBuffer(
  buffer: Buffer,
  enabled = process.env.PROOF_ENCRYPTION === "on"
): EncryptedPayload {
  if (!enabled) {
    return {
      isEncrypted: false,
      ciphertextBuffer: buffer,
      encryptionVersion: 1,
      wrappedDataKey: null,
      encryptionIv: null,
      encryptionTag: null,
    };
  }

  const masterKey = getMasterKey();

  // 1. Generate unique random Data Encryption Key (DEK)
  const dek = crypto.randomBytes(KEY_LENGTH);

  // 2. Encrypt the file buffer with DEK
  const fileIv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, dek, fileIv);
  const encryptedFile = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const fileTag = cipher.getAuthTag();

  // 3. Wrap (encrypt) the DEK with the Master Key
  const wrapIv = crypto.randomBytes(IV_LENGTH);
  const wrapCipher = crypto.createCipheriv(ALGORITHM, masterKey, wrapIv);
  const wrappedDekCipher = Buffer.concat([wrapCipher.update(dek), wrapCipher.final()]);
  const wrapTag = wrapCipher.getAuthTag();

  // Serialized wrapped DEK format: wrapIv:wrapTag:wrappedCipher (all base64)
  const wrappedDekPayload = `${wrapIv.toString("base64")}:${wrapTag.toString("base64")}:${wrappedDekCipher.toString("base64")}`;

  return {
    isEncrypted: true,
    ciphertextBuffer: encryptedFile,
    encryptionVersion: 1,
    wrappedDataKey: wrappedDekPayload,
    encryptionIv: fileIv.toString("base64"),
    encryptionTag: fileTag.toString("base64"),
  };
}

/**
 * Decrypts a file buffer using the wrapped DEK and file IV/tag.
 */
export function decryptFileBuffer(
  ciphertextBuffer: Buffer,
  meta: {
    isEncrypted: boolean;
    wrappedDataKey?: string | null;
    encryptionIv?: string | null;
    encryptionTag?: string | null;
  }
): Buffer {
  if (!meta.isEncrypted || !meta.wrappedDataKey || !meta.encryptionIv || !meta.encryptionTag) {
    return ciphertextBuffer;
  }

  const masterKey = getMasterKey();

  // 1. Unwrap (decrypt) the DEK using the Master Key
  const [wrapIvB64, wrapTagB64, wrappedDekB64] = meta.wrappedDataKey.split(":");
  if (!wrapIvB64 || !wrapTagB64 || !wrappedDekB64) {
    throw new Error("Invalid wrapped DEK payload structure");
  }

  const wrapIv = Buffer.from(wrapIvB64, "base64");
  const wrapTag = Buffer.from(wrapTagB64, "base64");
  const wrappedDekCipher = Buffer.from(wrappedDekB64, "base64");

  const wrapDecipher = crypto.createDecipheriv(ALGORITHM, masterKey, wrapIv);
  wrapDecipher.setAuthTag(wrapTag);
  const dek = Buffer.concat([wrapDecipher.update(wrappedDekCipher), wrapDecipher.final()]);

  // 2. Decrypt the file buffer with the unwrapped DEK
  const fileIv = Buffer.from(meta.encryptionIv, "base64");
  const fileTag = Buffer.from(meta.encryptionTag, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, dek, fileIv);
  decipher.setAuthTag(fileTag);
  const decrypted = Buffer.concat([decipher.update(ciphertextBuffer), decipher.final()]);

  return decrypted;
}
