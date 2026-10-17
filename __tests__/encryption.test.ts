import { encryptFileBuffer, decryptFileBuffer } from "../lib/storage/encryption";

describe("Proof Envelope Encryption (AES-256-GCM)", () => {
  const originalKey = process.env.PROOF_MASTER_KEY;

  beforeAll(() => {
    process.env.PROOF_MASTER_KEY = "test-master-key-gjtf-super-secure-32bytes-secret";
  });

  afterAll(() => {
    process.env.PROOF_MASTER_KEY = originalKey;
  });

  test("passthrough when encryption is disabled", () => {
    const rawData = Buffer.from("test payment proof image raw bytes");
    const encrypted = encryptFileBuffer(rawData, false);

    expect(encrypted.isEncrypted).toBe(false);
    expect(encrypted.ciphertextBuffer.toString()).toBe(rawData.toString());

    const decrypted = decryptFileBuffer(encrypted.ciphertextBuffer, encrypted);
    expect(decrypted.toString()).toBe(rawData.toString());
  });

  test("encrypts and successfully decrypts with valid master key", () => {
    const rawData = Buffer.from("sample confidential payment receipt binary content 123456");
    const encrypted = encryptFileBuffer(rawData, true);

    expect(encrypted.isEncrypted).toBe(true);
    expect(encrypted.wrappedDataKey).toBeDefined();
    expect(encrypted.encryptionIv).toBeDefined();
    expect(encrypted.encryptionTag).toBeDefined();
    // Ciphertext should not match plaintext
    expect(encrypted.ciphertextBuffer.toString()).not.toBe(rawData.toString());

    // Decrypt
    const decrypted = decryptFileBuffer(encrypted.ciphertextBuffer, encrypted);
    expect(decrypted.toString()).toBe(rawData.toString());
  });

  test("fails to decrypt if ciphertext or tag is tampered", () => {
    const rawData = Buffer.from("authentic screenshot content");
    const encrypted = encryptFileBuffer(rawData, true);

    // Tamper with ciphertext
    const tamperedCipher = Buffer.from(encrypted.ciphertextBuffer);
    tamperedCipher[0] = tamperedCipher[0] ^ 0xff;

    expect(() => {
      decryptFileBuffer(tamperedCipher, encrypted);
    }).toThrow();
  });
});
