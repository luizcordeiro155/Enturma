import { api } from "./api";
import {
  createIdentity,
  decryptAccountIdentity,
  encryptAccountIdentity,
  prepareAccountWrappingKey,
  publicFields,
  readAccountWrappingKey,
  readIdentity,
  storeIdentity,
  type AccountIdentityVault,
  type Identity,
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
}

export async function synchronizeAccountIdentity(
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
          "Conclua a migração das conversas abaixo usando o dispositivo original, sua antiga senha das conversas ou um backup cifrado.",
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
  return navigator.locks
    ? navigator.locks.request(`enturma-private-identity:${user}`, prepare)
    : prepare();
}
