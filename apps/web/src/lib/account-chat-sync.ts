import { api } from "./api";
import {
  createIdentity,
  decryptAccountIdentity,
  decryptIdentityVault,
  encryptAccountIdentity,
  prepareAccountWrappingKey,
  publicFields,
  readAccountWrappingKey,
  readIdentity,
  storeIdentity,
  type AccountIdentityVault,
  type Identity,
  type IdentityVault,
} from "./private-chat-crypto";

export type AccountVaultState = {
  epoch: number;
  envelope?: AccountIdentityVault;
};

export async function prepareChatAfterLogin(password: string) {
  const user = await api<{ id: string; credentialVersion: number }>(
    "/users/me",
    { cache: "no-store" },
  );
  if (user.credentialVersion)
    await prepareAccountWrappingKey(password, user.id, user.credentialVersion);
  // Try the old vault with this successful login only. Never replace lost keys.
  if (!(await readIdentity(user.id))) {
    const old = await api<{ envelope: IdentityVault }[]>("/private-vault", {
      cache: "no-store",
    });
    if (old[0]?.envelope) {
      const recovered = await decryptIdentityVault(
        old[0].envelope,
        password,
        user.id,
      ).catch(() => undefined);
      if (recovered) await storeIdentity(user.id, recovered);
    }
  }
  await synchronizeAccountIdentity(user.id);
}

async function synchronizePasswordIdentity(
  user: string,
): Promise<{ identity: Identity; synced: boolean }> {
  const prepare = async () => {
    const [registered, state, wrapping] = await Promise.all([
      api<{ publicKey: JsonWebKey }[]>("/private-identity", {
        cache: "no-store",
      }),
      api<AccountVaultState>("/private-account-vault", { cache: "no-store" }),
      readAccountWrappingKey(user),
    ]);
    let local = await readIdentity(user);
    const same = (key: JsonWebKey) =>
      !registered.length ||
      JSON.stringify(publicFields(key)) ===
        JSON.stringify(publicFields(registered[0].publicKey));
    if (local && !same(local.publicKey))
      throw Error("Restaure a identidade original das conversas nesta conta.");
    if (state.envelope && wrapping?.epoch === state.envelope.epoch) {
      try {
        const restored = await decryptAccountIdentity(
          state.envelope,
          wrapping,
          user,
        );
        if (!same(restored.publicKey))
          throw Error("A chave não corresponde à conta.");
        await storeIdentity(user, restored);
        return { identity: restored, synced: state.epoch === wrapping.epoch };
      } catch {
        if (!local)
          throw Error(
            "Recupere a proteção das conversas abaixo. Seu histórico continua cifrado e preservado.",
          );
      }
    }
    if (!local) {
      if (registered.length)
        throw Error(
          "O histórico antigo ainda não possui uma cópia sincronizada. Sua identidade e suas mensagens foram preservadas; restaure uma cópia de segurança para recuperar esse histórico.",
        );
      local = await createIdentity();
      await api("/private-identity", {
        method: "PUT",
        body: JSON.stringify(publicFields(local.publicKey)),
      });
      await storeIdentity(user, local);
    }
    if (
      wrapping?.epoch === state.epoch &&
      (!state.envelope || state.envelope.epoch < state.epoch)
    ) {
      const envelope = await encryptAccountIdentity(local, wrapping, user);
      try {
        await api("/private-account-vault", {
          method: "PUT",
          body: JSON.stringify(envelope),
        });
      } catch (error) {
        if ((error as Error & { status?: number }).status !== 409) throw error;
        const current = await api<AccountVaultState>("/private-account-vault", {
          cache: "no-store",
        });
        if (!current.envelope) throw error;
        const existing = await decryptAccountIdentity(
          current.envelope,
          wrapping,
          user,
        );
        if (!same(existing.publicKey)) throw error;
        await storeIdentity(user, existing);
        local = existing;
      }
      return { identity: local, synced: true };
    }
    return { identity: local, synced: false };
  };
  return prepare();
}

type SessionVault = {
  epoch: number;
  key: string;
  envelope?: AccountIdentityVault;
};
const pending = new Map<
  string,
  Promise<{ identity: Identity; synced: boolean }>
>();

export function synchronizeAccountIdentity(
  user: string,
): Promise<{ identity: Identity; synced: boolean }> {
  const existing = pending.get(user);
  if (existing) return existing;
  const prepare = async () => {
    const capabilities = await api<{ accountSessionSync: boolean }>(
      "/private-account-vault/capabilities",
      { cache: "no-store" },
    ).catch((error) => {
      if ((error as { status?: number }).status === 404)
        return { accountSessionSync: false };
      throw error;
    });
    if (!capabilities.accountSessionSync)
      return synchronizePasswordIdentity(user);
    const [state, registered] = await Promise.all([
      api<SessionVault>("/private-account-vault/session", {
        method: "POST",
        body: "{}",
      }),
      api<{ publicKey: JsonWebKey }[]>("/private-identity", {
        cache: "no-store",
      }),
    ]);
    const keyBytes = Uint8Array.from(atob(state.key), (c) => c.charCodeAt(0));
    if (keyBytes.length !== 32 || state.epoch !== 1)
      throw Error("Proteção de sincronização inválida.");
    const wrapping = {
      epoch: 1,
      key: await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
        "encrypt",
        "decrypt",
      ]),
    };
    keyBytes.fill(0);
    const verify = (identity: Identity) => {
      if (
        registered.length &&
        JSON.stringify(publicFields(identity.publicKey)) !==
          JSON.stringify(publicFields(registered[0].publicKey))
      )
        throw Error(
          "A identidade sincronizada não corresponde à sua conta. O histórico foi preservado.",
        );
      return identity;
    };
    if (state.envelope) {
      const restored = verify(
        await decryptAccountIdentity(state.envelope, wrapping, user),
      );
      await storeIdentity(user, restored);
      return { identity: restored, synced: true };
    }
    let local = await readIdentity(user);
    if (!local) local = (await synchronizePasswordIdentity(user)).identity;
    verify(local);
    const envelope = await encryptAccountIdentity(local, wrapping, user);
    try {
      await api("/private-account-vault/session", {
        method: "PUT",
        body: JSON.stringify(envelope),
      });
    } catch (error) {
      if ((error as { status?: number }).status !== 409) throw error;
      const current = await api<SessionVault>(
        "/private-account-vault/session",
        { method: "POST", body: "{}" },
      );
      if (!current.envelope) throw error;
      local = verify(
        await decryptAccountIdentity(current.envelope, wrapping, user),
      );
      await storeIdentity(user, local);
    }
    return { identity: local, synced: true };
  };
  const task = (async () =>
    navigator.locks
      ? await navigator.locks.request(
          `enturma-private-identity:${user}`,
          prepare,
        )
      : await prepare())().finally(() => pending.delete(user));
  pending.set(user, task);
  return task;
}
