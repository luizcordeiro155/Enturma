package br.com.enturma.users;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.common.ApiException;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class AccountSessionVaultTest {
  private AccountSessionVault vault(byte key) {
    byte[] bytes = new byte[32];
    Arrays.fill(bytes, key);
    return new AccountSessionVault(
        null,
        null,
        new MockEnvironment()
            .withProperty("CHAT_ACCOUNT_MASTER_KEY", Base64.getEncoder().encodeToString(bytes)));
  }

  @Test
  void encryptionBindsKeysToAccountAndMasterWithoutPlaintextStorage() {
    var service = vault((byte) 1);
    var user = UUID.randomUUID();
    byte[] raw = new byte[32];
    new java.security.SecureRandom().nextBytes(raw);
    var sealed = service.seal(user, raw);
    assertThat(sealed).doesNotContain(Base64.getEncoder().encodeToString(raw));
    assertThat(service.open(user, sealed)).isEqualTo(Base64.getEncoder().encodeToString(raw));
    assertThat(service.seal(user, raw)).isNotEqualTo(sealed);
    assertThatThrownBy(() -> service.open(UUID.randomUUID(), sealed))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> vault((byte) 2).open(user, sealed)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.open(user, sealed.substring(0, sealed.length() - 4)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void missingAndInvalidConfigurationFailClosed() {
    assertThat(new AccountSessionVault(null, null, new MockEnvironment()).enabled()).isFalse();
    assertThatThrownBy(
            () ->
                new AccountSessionVault(
                    null,
                    null,
                    new MockEnvironment().withProperty("CHAT_ACCOUNT_MASTER_KEY", "not-a-key")))
        .isInstanceOf(IllegalStateException.class);
  }
}
