// MUST be imported before tweetnacl so its PRNG can find crypto.getRandomValues.
import "react-native-get-random-values";

import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

import { secureStorage, StorageKeys } from "../utils/storage";

/**
 * E2EE primitives — NaCl `box` (Curve25519 + XSalsa20 + Poly1305).
 *
 * Server stores opaque `ciphertext` + `nonce` blobs. The recipient and sender
 * each decrypt locally using their own keypair + the peer's public key.
 *
 * Key format: 32-byte raw → base64 (44 chars).
 * Nonce format: 24-byte raw → base64 (32 chars; matches DB `VARCHAR(32)`).
 */

export interface KeyPair {
  publicKey: string; // base64
  secretKey: string; // base64
}

export const fromBase64 = naclUtil.decodeBase64;
export const toBase64 = naclUtil.encodeBase64;
export const utf8ToBytes = naclUtil.decodeUTF8;
export const bytesToUtf8 = naclUtil.encodeUTF8;

export function generateKeyPair(): KeyPair {
  const kp = nacl.box.keyPair();
  return {
    publicKey: toBase64(kp.publicKey),
    secretKey: toBase64(kp.secretKey),
  };
}

/**
 * Encrypt a plaintext string for a recipient.
 * Returns both ciphertext and nonce as base64 strings — both are needed for decryption.
 */
export function encryptMessage(
  plaintext: string,
  recipientPublicKey: string,
  senderSecretKey: string,
): { ciphertext: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = utf8ToBytes(plaintext);
  const cipherBytes = nacl.box(
    messageBytes,
    nonce,
    fromBase64(recipientPublicKey),
    fromBase64(senderSecretKey),
  );

  return {
    ciphertext: toBase64(cipherBytes),
    nonce: toBase64(nonce),
  };
}

/**
 * Decrypt an inbound ciphertext using the recipient's secret key + the sender's public key.
 * Returns null on tampering / wrong key — never throws to the caller, since a single bad
 * message must not break rendering of an entire conversation.
 */
export function decryptMessage(
  ciphertext: string,
  nonce: string,
  senderPublicKey: string,
  recipientSecretKey: string,
): string | null {
  try {
    const plaintextBytes = nacl.box.open(
      fromBase64(ciphertext),
      fromBase64(nonce),
      fromBase64(senderPublicKey),
      fromBase64(recipientSecretKey),
    );
    if (!plaintextBytes) return null;
    return bytesToUtf8(plaintextBytes);
  } catch {
    return null;
  }
}

// ─── Persistent keypair management ────────────────────────────────────────────

/**
 * Load this device's keypair from secure storage, generating one on first use.
 * The secret key never leaves the device. The public key is uploaded to the
 * server so peers can encrypt messages addressed to us.
 */
export async function loadOrCreateKeyPair(): Promise<KeyPair> {
  const [pub, sec] = await Promise.all([
    secureStorage.get(StorageKeys.publicKey),
    secureStorage.get(StorageKeys.privateKey),
  ]);

  if (pub && sec) {
    return { publicKey: pub, secretKey: sec };
  }

  const kp = generateKeyPair();
  await Promise.all([
    secureStorage.set(StorageKeys.publicKey, kp.publicKey),
    secureStorage.set(StorageKeys.privateKey, kp.secretKey),
  ]);
  return kp;
}

export async function getStoredKeyPair(): Promise<KeyPair | null> {
  const [pub, sec] = await Promise.all([
    secureStorage.get(StorageKeys.publicKey),
    secureStorage.get(StorageKeys.privateKey),
  ]);
  if (!pub || !sec) return null;
  return { publicKey: pub, secretKey: sec };
}

export async function clearKeyPair(): Promise<void> {
  await Promise.all([
    secureStorage.remove(StorageKeys.publicKey),
    secureStorage.remove(StorageKeys.privateKey),
  ]);
}
