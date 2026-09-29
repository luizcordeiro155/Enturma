package br.com.enturma.academics;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public record CatalogRecord(
    @NotBlank @Size(max = 240) String externalId,
    @NotBlank String kind,
    @Size(max = 240) String parentExternalId,
    @NotBlank @Size(max = 400) String name,
    @Size(max = 80) String code,
    @Size(max = 40) String curriculumVersion,
    @Min(1) @Max(30) Integer periodNumber,
    @NotBlank String status,
    @NotNull @Valid Source source,
    JsonNode attributes) {
  public record Source(
      @NotBlank @Size(max = 2000) String url,
      @NotBlank @Size(max = 200) String name,
      @NotBlank String type,
      @Pattern(regexp = "[a-f0-9]{64}") String contentHash,
      @NotNull Instant retrievedAt,
      Instant verifiedAt) {}

  public record Document(
      @NotBlank @Pattern(regexp = "[A-Z0-9_]{2,60}") String provider,
      @NotEmpty @Size(max = 10000) List<@Valid CatalogRecord> entries) {}
}
