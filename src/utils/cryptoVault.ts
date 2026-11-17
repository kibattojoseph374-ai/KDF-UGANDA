// Client-side Web Crypto AES-GCM encryption helper for local vault persistence

const KEY_STORAGE = 'kdf_uganda_client_key_v1';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < slice.length; j += 1) {
      binary += String.fromCharCode(slice[j]);
    }
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getOrCreateClientKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(KEY_STORAGE);
  if (existing) {
    const raw = base64ToBytes(existing);
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const exported = await crypto.subtle.exportKey('raw', key);
  const b64 = bytesToBase64(new Uint8Array(exported));
  localStorage.setItem(KEY_STORAGE, b64);
  return key;
}

export async function saveEncryptedSession(storageKey: string, value: unknown): Promise<void> {
  try {
    const key = await getOrCreateClientKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const payload = {
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(cipher)),
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }
}

export async function loadEncryptedSession<T>(storageKey: string): Promise<T | null> {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.iv === 'string' && typeof parsed.data === 'string') {
      const key = await getOrCreateClientKey();
      const iv = base64ToBytes(parsed.iv);
      const data = base64ToBytes(parsed.data);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return JSON.parse(new TextDecoder().decode(plain)) as T;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export function clearEncryptedSession(storageKey: string): void {
  localStorage.removeItem(storageKey);
}
