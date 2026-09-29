"""Package the tested Spring Boot JAR for SquareCloud, excluding local secrets by default."""
import argparse
import hashlib
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]


def package(jar: Path, output: Path, subdomain: str | None = None,
            env_file: Path | None = None, cert_dir: Path | None = None) -> Path:
    if subdomain and not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", subdomain):
        raise ValueError("Subdomínio inválido: use apenas letras minúsculas, números e hífen.")
    with ZipFile(jar) as archive:
        manifest = archive.read("META-INF/MANIFEST.MF").decode()
        if "Start-Class: br.com.enturma.EnturmaApplication" not in manifest or not any(
            name.startswith("BOOT-INF/lib/") for name in archive.namelist()
        ):
            raise ValueError("Use o fat JAR gerado por mvn verify, não .jar.original.")
    config = (ROOT / "deploy/squarecloud/squarecloud.app").read_text(encoding="utf-8")
    if subdomain:
        config += f"SUBDOMAIN={subdomain}\n"
    environment = (env_file or ROOT / ".env.example").read_text(encoding="utf-8-sig")
    certificates = []
    if cert_dir:
        for name in ("certificate.pem", "root.crt", "client.p12", "client-cert.crt", "client-key.key"):
            file = cert_dir / name
            if file.is_file():
                certificates.append(file)
        if not certificates:
            raise ValueError("Nenhum certificado reconhecido na pasta indicada.")
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        archive.write(jar, "app.jar")
        archive.writestr("squarecloud.app", config)
        archive.writestr(".env", environment)
        archive.write(ROOT / "deploy/squarecloud/LEIA-ME.md", "LEIA-ME.md")
        for file in certificates:
            archive.write(file, f"certs/{file.name}")
    with output.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    output.with_suffix(".zip.sha256").write_text(f"{digest}  {output.name}\n", encoding="utf-8")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jar", type=Path, default=ROOT / "services/api/target/enturma-api-0.1.0.jar")
    parser.add_argument("--output", type=Path, default=ROOT / "dist/enturma-squarecloud.zip")
    parser.add_argument("--subdomain", help="Nome disponível, sem .squareweb.app; pode ser escolhido no painel.")
    parser.add_argument("--env-file", type=Path, help="Opt-in: inclui este arquivo privado no ZIP. Nunca publique o ZIP com segredos.")
    parser.add_argument("--cert-dir", type=Path, help="Opt-in: pasta privada com certificados do PostgreSQL.")
    args = parser.parse_args()
    artifact = package(args.jar, args.output, args.subdomain, args.env_file, args.cert_dir)
    print(f"ZIP criado: {artifact}")
    print("Inclui segredos fornecidos pelo operador." if args.env_file or args.cert_dir
          else "Sem segredos locais: preencha .env ou use as variáveis do painel da SquareCloud.")
