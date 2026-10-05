import json
import re
import unittest
import zipfile
from pathlib import Path

import build_portable


class TestPortableBuild(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.standalone, cls.archive = map(Path, build_portable.build_portable())
        cls.html = cls.standalone.read_text(encoding="utf-8")

    def test_standalone_has_all_assets_inlined_without_remote_resources(self):
        self.assertNotRegex(self.html, r"<script\s+src=")
        self.assertNotRegex(self.html, r"<link\s+rel=\"stylesheet\"")
        self.assertNotIn("cdn.tailwindcss.com", self.html)
        self.assertNotIn("unpkg.com", self.html)
        self.assertNotIn("fonts.googleapis.com", self.html)
        self.assertIn("PromptFactoryApp", self.html)
        self.assertIn("createIcons", self.html)
        self.assertIn('id="project-license-text"', self.html)
        self.assertIn("SPDX-License-Identifier: GPL-3.0-or-later", self.html)
        self.assertIn('id="third-party-license-notices"', self.html)

    def test_portable_zip_includes_local_libraries_and_licenses(self):
        with zipfile.ZipFile(self.archive) as archive:
            names = set(archive.namelist())
            self.assertIn("PromptFactory/vendor/tailwind.min.css", names)
            self.assertIn("PromptFactory/vendor/lucide.min.js", names)
            self.assertIn("PromptFactory/LICENSE", names)
            self.assertIn("PromptFactory/THIRD_PARTY_NOTICES.md", names)
            html = archive.read("PromptFactory/PromptFactory-Standalone.html").decode("utf-8")
            self.assertNotRegex(html, r"<(?:script|link)\b[^>]*(?:src|href)=['\"]https?://")
            self.assertIn("SPDX-License-Identifier: GPL-3.0-or-later", html)

    def test_vendored_library_versions_match_lockfile_and_license_notices(self):
        root = Path(__file__).resolve().parent.parent
        lock = json.loads((root / "package-lock.json").read_text(encoding="utf-8"))
        tailwind_version = lock["packages"]["node_modules/tailwindcss"]["version"]
        lucide_version = lock["packages"]["node_modules/lucide"]["version"]
        css = (root / "vendor/tailwind.min.css").read_text(encoding="utf-8")
        lucide = (root / "vendor/lucide.min.js").read_text(encoding="utf-8")
        notices = (root / "THIRD_PARTY_NOTICES.md").read_text(encoding="utf-8")
        self.assertIn(f"tailwindcss v{tailwind_version}", css)
        self.assertIn(f"lucide v{lucide_version}", lucide)
        self.assertIn(f"Tailwind CSS {tailwind_version}", notices)
        self.assertIn(f"Lucide {lucide_version}", notices)


if __name__ == "__main__":
    unittest.main()
