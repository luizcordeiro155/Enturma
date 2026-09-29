package br.com.enturma.notifications;

import java.util.Set;
import java.util.UUID;

public record AppChanged(String type, Set<UUID> users) {}
