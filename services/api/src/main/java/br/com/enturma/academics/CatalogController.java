package br.com.enturma.academics;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {
  private final CatalogService catalog;

  public CatalogController(CatalogService catalog) {
    this.catalog = catalog;
  }

  public record Import(@NotEmpty @Size(max = 500) @Valid List<CatalogService.Entry> entries) {}

  @GetMapping("/academics")
  public Object list(
      @RequestParam String kind,
      @RequestParam(required = false) UUID parentId,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page) {
    return catalog.list(kind, parentId, search, page, false);
  }

  @GetMapping("/admin/academics")
  public Object admin(
      @RequestParam String kind,
      @RequestParam(required = false) UUID parentId,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page) {
    return catalog.list(kind, parentId, search, page, true);
  }

  @PostMapping("/admin/academics/import")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void importData(@AuthenticationPrincipal Actor a, @Valid @RequestBody Import data) {
    catalog.importEntries(a, data.entries());
  }
}
