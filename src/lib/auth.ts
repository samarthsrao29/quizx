import crypto from 'crypto';

// Use environment secret or fall back to a static secure string (or random at runtime)
const SECRET = process.env.ADMIN_SECRET || 'quizx-cryptographic-signing-key-SAM29@';

export function generateToken(adminId: string): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 1 day expiration
  const payload = JSON.stringify({ role: 'admin', adminId, expiresAt });
  
  const payloadBase64 = Buffer.from(payload).toString('base64');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');

  return `${payloadBase64}.${signature}`;
}

export function verifyToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadBase64, signature] = parts;
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    
    // Recalculate signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payloadJson)
      .digest('hex');

    if (signature !== expectedSignature) return false;

    // Check expiration
    const payload = JSON.parse(payloadJson);
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

export function decodeToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64] = parts;
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    return JSON.parse(payloadJson);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
