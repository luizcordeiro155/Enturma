package br.com.enturma.chat;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

/** Acknowledges only messages actually received/rendered by an authenticated client. */
public record MessageReceipt(
    @NotEmpty @Size(max = 100) List<@NotNull UUID> messageIds, boolean read) {}
