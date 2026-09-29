package br.com.enturma.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class Account {
  @Id public UUID id;
  public String name;
  public String username;
  public String email;

  @Column(name = "password_hash")
  public String passwordHash;

  public String role;
  public String status;

  @Column(name = "email_verified")
  public boolean emailVerified;

  @Column(name = "created_at")
  public Instant createdAt;

  protected Account() {}

  public Account(String name, String username, String email, String hash) {
    id = UUID.randomUUID();
    this.name = name;
    this.username = username;
    this.email = email;
    passwordHash = hash;
    role = "USER";
    status = "ACTIVE";
    createdAt = Instant.now();
  }
}
