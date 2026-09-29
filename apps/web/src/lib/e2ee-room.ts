export type RoomPublicKey = JsonWebKey;

export type EphemeralChatEvent =
  | {
      type: "message";
      id: string;
      senderId: string;
      senderName: string;
      createdAt: string;
      text?: string;
      image?: {
        name: string;
        mime: string;
        size: number;
        dataUrl: string;
      };
      replyTo?: string | null;
    }
  | {
      type: "reaction";
      id: string;
      senderId: string;
      messageId: string;
      emoji: string;
      active: boolean;
      createdAt: string;
    }
  | {
      type: "delete";
      id: string;
      senderId: string;
      messageId: string;
      createdAt: string;
    };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createRoomIdentity() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
  return {
    privateKey: keyPair.privateKey,
    publicKey: await crypto.subtle.exportKey("jwk", keyPair.publicKey),
  };
}

export async function createRoomKey() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

async function wrappingKey(
  privateKey: CryptoKey,
  peerPublicKey: RoomPublicKey,
) {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    peerPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function wrapRoomKey(
  roomKey: CryptoKey,
  privateKey: CryptoKey,
  peerPublicKey: RoomPublicKey,
) {
  const key = await wrappingKey(privateKey, peerPublicKey);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", roomKey));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, raw);
  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function unwrapRoomKey(
  privateKey: CryptoKey,
  peerPublicKey: RoomPublicKey,
  ivValue: string,
  ciphertext: string,
) {
  const key = await wrappingKey(privateKey, peerPublicKey);
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivValue) },
    key,
    base64ToBytes(ciphertext),
  );
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptEvent(roomKey: CryptoKey, event: EphemeralChatEvent) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    roomKey,
    encoder.encode(JSON.stringify(event)),
  );
  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptEvent(
  roomKey: CryptoKey,
  ivValue: string,
  ciphertext: string,
): Promise<EphemeralChatEvent> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivValue) },
    roomKey,
    base64ToBytes(ciphertext),
  );
  return JSON.parse(decoder.decode(plain)) as EphemeralChatEvent;
}

export async function fileToEncryptedDataUrl(file: File) {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))
    throw new Error("Use uma imagem JPG, PNG, WEBP ou GIF.");
  if (file.size > 650 * 1024)
    throw new Error("A imagem do chat pode ter no máximo 650 KB.");

  const result = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  return {
    name: file.name.slice(0, 120),
    mime: file.type,
    size: file.size,
    dataUrl: result,
  };
}
