function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomSaltBase64(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64(bytes);
}

export async function hashPassword(password: string, saltBase64: string) {
  const salt = fromBase64(saltBase64);
  const enc = new TextEncoder();
  const passwordBytes = enc.encode(password);
  const combined = new Uint8Array(salt.length + passwordBytes.length);
  combined.set(salt, 0);
  combined.set(passwordBytes, salt.length);
  const digest = await crypto.subtle.digest("SHA-256", combined);
  return toBase64(new Uint8Array(digest));
}

