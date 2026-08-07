// Reads the Web Push identity from the environment. Returns null instead
// of throwing when unconfigured, so a deployment that never set these up
// just doesn't offer background push — the rest of the app doesn't care.
// See .env.example for how to generate a real pair.

export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

let cached: VapidConfig | null | undefined;

export function getVapidConfig(): VapidConfig | null {
  if (cached !== undefined) return cached;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  cached = publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
  return cached;
}
