// Node-only webhook verification using crypto
import crypto from 'crypto';

export function verifyWebhook(rawBody: string, signature: string | null | undefined): boolean {
  const secret = process.env.COINBASE_COMMERCE_SHARED_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(digest, 'utf8'));
  } catch {
    return false;
  }
}
