package br.com.enturma.materials;

import br.com.enturma.auth.Actor;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/materials")
public class MaterialController {
  private final MaterialService materials;

  public MaterialController(MaterialService materials) {
    this.materials = materials;
  }

  @GetMapping
  public Object list(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    return materials.list(a, room);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Object upload(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @RequestParam MultipartFile file)
      throws java.io.IOException {
    return materials.upload(a, room, file.getOriginalFilename(), file.getBytes());
  }

  @GetMapping("/{id}")
  public ResponseEntity<byte[]> download(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id) {
    var d = materials.download(a, room, id);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(d.mime()))
        .header(
            "Content-Disposition",
            ContentDisposition.attachment()
                .filename(d.name(), java.nio.charset.StandardCharsets.UTF_8)
                .build()
                .toString())
        .header("Cache-Control", "no-store")
        .body(d.body());
  }
}
