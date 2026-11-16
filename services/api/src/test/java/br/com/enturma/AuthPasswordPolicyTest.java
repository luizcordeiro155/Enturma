package br.com.enturma;

import static org.assertj.core.api.Assertions.assertThat;
import br.com.enturma.auth.AuthController;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

class AuthPasswordPolicyTest {
  @Test
  void registrationAndResetAcceptEightThroughSixtyFourCharactersWithoutChangingLogin() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();
      for (int length : new int[] {7, 8, 64, 65}) {
        var password = "a".repeat(length);
        var register = new AuthController.Register("Estudante", "estudante", "student@example.test", password, "JUnit", true);
        var reset = new AuthController.Reset("valid-token", password);
        boolean allowed = length >= 8 && length <= 64;
        assertThat(validator.validate(register).isEmpty()).isEqualTo(allowed);
        assertThat(validator.validate(reset).isEmpty()).isEqualTo(allowed);
      }
      assertThat(validator.validate(new AuthController.Login("student@example.test", "a".repeat(60), "JUnit"))).isEmpty();
    }
  }
}
