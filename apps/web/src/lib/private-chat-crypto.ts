const enc = new TextEncoder();
const dec = new TextDecoder();
type Identity = { publicKey: JsonWebKey; privateKey: JsonWebKey };
export function base64(bytes: ArrayBuffer | Uint8Array) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function bytes(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("enturma-private-keys", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("identities");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function readIdentity(
  user: string,
): Promise<Identity | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("identities");
    const r = tx.objectStore("identities").get(user);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => db.close();
  });
}
export async function storeIdentity(user: string, value: Identity) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("identities", "readwrite");
    tx.objectStore("identities").put(value, user);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
export async function createIdentity(): Promise<Identity> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  return {
    publicKey: await crypto.subtle.exportKey("jwk", pair.publicKey),
    privateKey: await crypto.subtle.exportKey("jwk", pair.privateKey),
  };
}
export function publicFields(key: JsonWebKey) {
  return { kty: key.kty!, crv: key.crv!, x: key.x!, y: key.y! };
}
export async function conversationKey(
  identity: Identity,
  peer: JsonWebKey,
  thread: string,
) {
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    identity.privateKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    peer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const secret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256,
  );
  const material = await crypto.subtle.importKey("raw", secret, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode(thread),
      info: enc.encode("enturma-private-v1"),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function fingerprint(a: JsonWebKey, b: JsonWebKey) {
  const ordered = [
    JSON.stringify(publicFields(a)),
    JSON.stringify(publicFields(b)),
  ].sort();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(ordered.join("|")),
  );
  return [...new Uint8Array(digest)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")
    .match(/.{1,4}/g)!
    .join(" ");
}
export async function encryptMessage(
  key: CryptoKey,
  text: string,
  thread: string,
  sender: string,
  clientId: string,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: enc.encode(`${thread}:${sender}:${clientId}`),
    },
    key,
    enc.encode(text),
  );
  return { iv: base64(iv), ciphertext: base64(ciphertext), clientId };
}
export async function decryptMessage(
  key: CryptoKey,
  message: {
    iv: string;
    ciphertext: string;
    senderId: string;
    clientId: string;
  },
  thread: string,
) {
  return dec.decode(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytes(message.iv),
        additionalData: enc.encode(
          `${thread}:${message.senderId}:${message.clientId}`,
        ),
      },
      key,
      bytes(message.ciphertext),
    ),
  );
}
async function backupKey(password: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 250000 },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function exportBackup(identity: Identity, password: string) {
  if (password.length < 12)
    throw Error("Use uma senha de backup com pelo menos 12 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await backupKey(password, salt),
    enc.encode(JSON.stringify(identity)),
  );
  return JSON.stringify({
    version: 1,
    salt: base64(salt),
    iv: base64(iv),
    data: base64(data),
  });
}
export async function importBackup(
  raw: string,
  password: string,
): Promise<Identity> {
  const b = JSON.parse(raw);
  if (b.version !== 1) throw Error("Formato de backup inválido.");
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes(b.iv) },
    await backupKey(password, bytes(b.salt)),
    bytes(b.data),
  );
  const value = JSON.parse(dec.decode(clear));
  const key = await crypto.subtle.importKey(
    "jwk",
    value.privateKey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const exported = await crypto.subtle.exportKey("jwk", key);
  if (exported.x !== value.publicKey.x || exported.y !== value.publicKey.y)
    throw Error("Chaves do backup não correspondem.");
  return value;
}
