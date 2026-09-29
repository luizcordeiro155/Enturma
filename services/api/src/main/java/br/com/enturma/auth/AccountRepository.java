package br.com.enturma.auth;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, UUID> {
  Optional<Account> findByEmail(String email);

  boolean existsByEmail(String email);

  boolean existsByUsername(String username);
}
