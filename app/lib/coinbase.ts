// Server-only Coinbase Commerce client helpers
import crypto from "crypto";

const API_BASE = "https://api.commerce.coinbase.com";

function getApiKey(): string | undefined {
  return process.env.COINBASE_COMMERCE_API_KEY;
}

export function isMockMode(): boolean {
  return !getApiKey();
}

export function getClient() {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const headers = {
    "X-CC-Api-Key": apiKey,
    "X-CC-Version": "2018-03-22",
    "Content-Type": "application/json",
  } as const;
  return { headers };
}

export async function createCharge(payload: any): Promise<{ hosted_url: string; code: string; id: string }>
{
  const client = getClient();
  if (!client) throw new Error("Missing API key");
  const res = await fetch(`${API_BASE}/charges`, {
    method: "POST",
    headers: client.headers,
    body: JSON.stringify(payload),
    // Coinbase API is ok with standard fetch
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coinbase create charge failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  const data = json?.data;
  return { hosted_url: data.hosted_url, code: data.code, id: data.id };
}

export async function fetchChargeByCode(code: string): Promise<any> {
  const client = getClient();
  if (!client) throw new Error("Missing API key");
  const res = await fetch(`${API_BASE}/charges/${code}`, {
    method: "GET",
    headers: client.headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coinbase fetch by code failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json?.data;
}

export async function fetchChargeById(id: string): Promise<any> {
  const client = getClient();
  if (!client) throw new Error("Missing API key");
  const res = await fetch(`${API_BASE}/charges/${id}`, {
    method: "GET",
    headers: client.headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coinbase fetch by id failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json?.data;
}

export function verifyWebhook(rawBody: string, signature: string | null | undefined): boolean {
  const secret = process.env.COINBASE_COMMERCE_SHARED_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(digest, "utf8"));
  } catch {
    return false;
  }
}
