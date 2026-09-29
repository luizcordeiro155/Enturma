const enc = new TextEncoder();
const dec = new TextDecoder();
export type Identity = { publicKey: JsonWebKey; privateKey: JsonWebKey };
export function base64(bytes: ArrayBuffer | Uint8Array) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function bytes(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("enturma-private-keys", 1);
    let expired = false;
    const timer = setTimeout(() => {
      expired = true;
      reject(
        Error(
          "Não foi possível abrir o armazenamento de chaves. Feche outras abas do Enturma e tente novamente.",
        ),
      );
    }, 8000);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("identities"))
        r.result.createObjectStore("identities");
    };
    r.onsuccess = () => {
      clearTimeout(timer);
      if (expired) r.result.close();
      else resolve(r.result);
    };
    r.onerror = () => {
      clearTimeout(timer);
      reject(
        Error(
          "O navegador bloqueou o armazenamento das chaves. Permita os dados deste site e tente novamente.",
        ),
      );
    };
  });
}
async function identityTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("identities", mode);
    const request = operation(tx.objectStore("identities"));
    const timer = setTimeout(() => {
      tx.abort();
      reject(
        Error("O armazenamento de chaves demorou demais. Tente novamente."),
      );
    }, 8000);
    const close = () => {
      clearTimeout(timer);
      db.close();
    };
    tx.oncomplete = () => {
      close();
      resolve(request.result);
    };
    tx.onabort = tx.onerror = () => {
      close();
      reject(
        Error(
          "Não foi possível acessar sua chave neste navegador. Confira as permissões de armazenamento.",
        ),
      );
    };
  });
}
export function readIdentity(user: string): Promise<Identity | undefined> {
  return identityTransaction("readonly", (store) => store.get(user));
}
export async function storeIdentity(user: string, value: Identity) {
  await identityTransaction("readwrite", (store) => store.put(value, user));
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

// Version 2 binds a password-protected identity to its account and public key.
// The passphrase and clear private key never leave this device.
export type IdentityVault = {
  version: 2;
  publicKey: ReturnType<typeof publicFields>;
  salt: string;
  iv: string;
  data: string;
};
async function vaultKey(password: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 600000 },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
function vaultContext(user: string, key: JsonWebKey) {
  return enc.encode(
    JSON.stringify(["enturma-private-vault-v2", user, publicFields(key)]),
  );
}
export async function encryptIdentityVault(
  identity: Identity,
  password: string,
  user: string,
): Promise<IdentityVault> {
  if (password.length < 12 || password.length > 256)
    throw Error("Use uma senha das conversas com 12 a 256 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: vaultContext(user, identity.publicKey),
    },
    await vaultKey(password, salt),
    enc.encode(JSON.stringify(identity)),
  );
  return {
    version: 2,
    publicKey: publicFields(identity.publicKey),
    salt: base64(salt),
    iv: base64(iv),
    data: base64(data),
  };
}
export async function decryptIdentityVault(
  vault: IdentityVault,
  password: string,
  user: string,
): Promise<Identity> {
  if (
    vault.version !== 2 ||
    password.length > 256 ||
    !/^[A-Za-z0-9+/]{43}=$/.test(vault.salt) ||
    !/^[A-Za-z0-9+/]{16}$/.test(vault.iv) ||
    vault.data.length > 12000 ||
    vault.data.length < 64
  )
    throw Error("Cofre de conversas inválido.");
  const clear = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: bytes(vault.iv),
      additionalData: vaultContext(user, vault.publicKey),
    },
    await vaultKey(password, bytes(vault.salt)),
    bytes(vault.data),
  );
  const identity: Identity = JSON.parse(dec.decode(clear));
  if (
    JSON.stringify(publicFields(identity.publicKey)) !==
      JSON.stringify(publicFields(vault.publicKey)) ||
    JSON.stringify(publicFields(identity.privateKey)) !==
      JSON.stringify(publicFields(vault.publicKey))
  )
    throw Error("Chaves do cofre não correspondem.");
  // Import validates the curve/private scalar. A round trip verifies the pair.
  const probe = await createIdentity();
  const own = await conversationKey(identity, probe.publicKey, user);
  const peer = await conversationKey(probe, identity.publicKey, user);
  const message = await encryptMessage(
    own,
    "verify-vault",
    user,
    user,
    "vault",
  );
  await decryptMessage(peer, { ...message, senderId: user }, user);
  return identity;
}
