// Server-only license utilities for stateless Pro licenses (Node runtime)
// Scheme: BASE58(chargeId + "." + HMAC_SHA256(secret, chargeId)[:16])

import crypto from "crypto";

// Minimal base58 implementation using Bitcoin alphabet (URL-safe)
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) ALPHABET_MAP[ALPHABET[i]] = i;

function base58Encode(buffer: Uint8Array): string {
  if (buffer.length === 0) return "";
  let zeros = 0;
  let i = 0;
  while (i < buffer.length && buffer[i] === 0) {
    zeros++;
    i++;
  }
  const encoded: number[] = [];
  const b58 = 58;
  let carry: number;
  const arr = Array.from(buffer);
  while (i < arr.length) {
    carry = arr[i];
    let j = 0;
    for (let k = encoded.length - 1; k >= 0; k--) {
      carry += encoded[k] * 256;
      encoded[k] = carry % b58;
      carry = (carry / b58) | 0;
      j = k;
    }
    while (carry > 0) {
      encoded.unshift(carry % b58);
      carry = (carry / b58) | 0;
    }
    i++;
  }
  let str = "";
  for (let p = 0; p < zeros; p++) str += "1";
  for (let q = 0; q < encoded.length; q++) str += ALPHABET[encoded[q]];
  return str;
}

function base58Decode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array();
  let zeros = 0;
  let i = 0;
  while (i < str.length && str[i] === "1") {
    zeros++;
    i++;
  }
  const b58 = 58;
  const bytes: number[] = [];
  while (i < str.length) {
    const ch = str[i];
    const val = ALPHABET_MAP[ch];
    if (val === undefined) throw new Error("Invalid base58 character");
    let carry = val;
    for (let j = bytes.length - 1; j >= 0; j--) {
      carry += bytes[j] * b58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.unshift(carry & 0xff);
      carry >>= 8;
    }
    i++;
  }
  const out = new Uint8Array(zeros + bytes.length);
  out.fill(0, 0, zeros);
  out.set(bytes, zeros);
  return out;
}

function hmac16(secret: string, message: string): string {
  const mac = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return mac.slice(0, 32); // 16 bytes in hex = 32 chars
}

export function computeFromChargeId(chargeId: string, secret = process.env.PREDIKT_LICENSE_SECRET || ""): string {
  if (!secret) throw new Error("Missing PREDIKT_LICENSE_SECRET");
  const mac16 = hmac16(secret, chargeId);
  const payload = `${chargeId}.${mac16}`;
  return base58Encode(new TextEncoder().encode(payload));
}

export function parseAndVerify(license: string, secret = process.env.PREDIKT_LICENSE_SECRET || ""): { ok: boolean; chargeId?: string; error?: string } {
  try {
    if (!secret) return { ok: false, error: "Missing PREDIKT_LICENSE_SECRET" };
    const decoded = new TextDecoder().decode(base58Decode(license));
    const idx = decoded.lastIndexOf(".");
    if (idx <= 0) return { ok: false, error: "Malformed license" };
    const chargeId = decoded.slice(0, idx);
    const sigHex = decoded.slice(idx + 1);
    if (!/^[0-9a-f]{32}$/.test(sigHex)) return { ok: false, error: "Invalid signature length" };
    const expect = hmac16(secret, chargeId);
    const ok = crypto.timingSafeEqual(Buffer.from(sigHex, "utf8"), Buffer.from(expect, "utf8"));
    return ok ? { ok: true, chargeId } : { ok: false, error: "Signature mismatch" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid license" };
  }
}

export const __test__ = { base58Encode, base58Decode, hmac16 };
