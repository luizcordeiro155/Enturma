package br.com.enturma.notifications;

import java.util.UUID;

public record PushRequested(
    UUID user,
    UUID actor,
    String category,
    String kind,
    UUID target,
    String href,
    String message) {}
