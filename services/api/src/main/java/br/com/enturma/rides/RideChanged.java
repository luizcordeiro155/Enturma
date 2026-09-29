package br.com.enturma.rides;

import java.util.Set;
import java.util.UUID;

public record RideChanged(Set<UUID> users, boolean publicListing) {}
