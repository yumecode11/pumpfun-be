import {createCipheriv, createDecipheriv, randomBytes} from "crypto";

export function generateReferralCode(referrerToken: string, referralToken: string) {
  const key = randomBytes(32); // 32 bytes for AES-256
  const iv = randomBytes(16); // 16 bytes for AES

  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(`${referrerToken}:${referralToken}`, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Combine IV, encrypted data, and key into a single string
  // Return combined string
  return iv.toString('hex') + ':' + encrypted + ':' + key.toString('hex');
}

export function extractReferralCode(referralCode: string) {
  const [ivHex, encryptedText, keyHex] = referralCode.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = Buffer.from(keyHex, 'hex');

  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  const [referrerToken, referralToken] = decrypted.split(':')

  // Return extracted referrer address and unique identifier
  return {
    referrerToken,
    referralToken
  };
}
