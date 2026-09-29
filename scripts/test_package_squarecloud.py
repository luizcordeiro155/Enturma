import importlib.util
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location("packaging", Path(__file__).with_name("package-squarecloud.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PackagingTest(unittest.TestCase):
    def test_zip_has_flat_entrypoint_and_no_implicit_local_secrets(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            jar = base / "app.jar"
            with ZipFile(jar, "w") as archive:
                archive.writestr("META-INF/MANIFEST.MF", "Start-Class: br.com.enturma.EnturmaApplication\n")
                archive.writestr("BOOT-INF/lib/test.jar", "fixture")
            (base / ".env").write_text("SECRET=never-include-implicitly")
            result = module.package(jar, base / "upload.zip", "enturma-test")
            with ZipFile(result) as archive:
                self.assertEqual(set(archive.namelist()), {"app.jar", ".env", "squarecloud.app", "LEIA-ME.md"})
                self.assertNotIn(b"never-include-implicitly", archive.read(".env"))
                self.assertIn(b"SUBDOMAIN=enturma-test", archive.read("squarecloud.app"))
            self.assertTrue(result.with_suffix(".zip.sha256").exists())

    def test_rejects_non_boot_jar_and_subdomain_injection(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            jar = base / "bad.jar"
            with ZipFile(jar, "w") as archive:
                archive.writestr("META-INF/MANIFEST.MF", "Main-Class: something\n")
            with self.assertRaises(ValueError):
                module.package(jar, base / "upload.zip")
            with self.assertRaises(ValueError):
                module.package(jar, base / "upload.zip", "test\nSTART=malicious")


if __name__ == "__main__":
    unittest.main()
