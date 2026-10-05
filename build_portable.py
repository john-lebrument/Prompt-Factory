"""Generate the self-contained and ZIP versions of Prompt Factory."""

import html as html_module
import re
import sys
import zipfile
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent
PORTABLE_DIR = ROOT / "portable"


def read_text(path):
    return path.read_text(encoding="utf-8")


def replace_once(html, pattern, replacement, label):
    updated, count = re.subn(pattern, lambda _: replacement, html, count=1, flags=re.IGNORECASE | re.DOTALL)
    if count != 1:
        raise RuntimeError(f"Impossible d'intégrer {label} : balise source absente ou dupliquée.")
    return updated


def build_portable():
    PORTABLE_DIR.mkdir(parents=True, exist_ok=True)
    standalone_path = PORTABLE_DIR / "PromptFactory-Standalone.html"
    zip_path = PORTABLE_DIR / "PromptFactory-Portable.zip"

    html = read_text(ROOT / "index.html")
    for css_name in ("vendor/tailwind.min.css", "styles.css"):
        css_path = ROOT / css_name
        if not css_path.is_file():
            raise FileNotFoundError(f"Dépendance locale absente : {css_name}")
        style_tag = f"<style>\n{read_text(css_path)}\n</style>"
        pattern = rf'<link\s+rel="stylesheet"\s+href="{re.escape(css_name)}"\s*/?>'
        html = replace_once(html, pattern, style_tag, css_name)

    for js_name in ("vendor/lucide.min.js", "app.js"):
        js_path = ROOT / js_name
        if not js_path.is_file():
            raise FileNotFoundError(f"Dépendance locale absente : {js_name}")
        js = read_text(js_path)
        # Prevent a string in a library from prematurely closing an inline script.
        js = re.sub(r"</script", r"<\\/script", js, flags=re.IGNORECASE)
        script_tag = f"<script>\n{js}\n</script>"
        pattern = rf'<script\s+src="{re.escape(js_name)}"\s*>\s*</script>'
        html = replace_once(html, pattern, script_tag, js_name)

    legal_texts = (
        ("project-license-text", "LICENSE"),
        ("third-party-license-notices", "THIRD_PARTY_NOTICES.md"),
    )
    legal_templates = "\n<!-- License texts are embedded to preserve notices in the offline single-file distribution. -->\n"
    for template_id, file_name in legal_texts:
        legal_path = ROOT / file_name
        if not legal_path.is_file():
            raise FileNotFoundError(f"Notice de licence absente : {file_name}")
        escaped_text = html_module.escape(read_text(legal_path), quote=False)
        legal_templates += f'<template id="{template_id}"><pre>{escaped_text}</pre></template>\n'
    html = replace_once(html, r'</body>', legal_templates + '</body>', 'textes de licence')

    remote_assets = re.findall(
        r'<(?:script|link)\b[^>]*(?:src|href)=["\']https?://[^"\']+["\']',
        html,
        flags=re.IGNORECASE,
    )
    if remote_assets:
        raise RuntimeError(f"La version autonome contient encore des dépendances distantes : {remote_assets}")

    old_html = standalone_path.read_text(encoding="utf-8") if standalone_path.exists() else None
    html_changed = old_html != html
    if html_changed:
        standalone_path.write_text(html, encoding="utf-8", newline="\n")
        print(f"[OK] Fichier autonome actualisé : {standalone_path}")
    else:
        print("[INFO] Fichier autonome déjà à jour.")

    files_to_pack = [
        "index.html",
        "app.js",
        "styles.css",
        "vendor/tailwind.min.css",
        "vendor/lucide.min.js",
        "LICENSE",
        "THIRD_PARTY_NOTICES.md",
        "Lancer Prompt Factory.bat",
        "README.md",
    ]
    missing = [name for name in files_to_pack if not (ROOT / name).is_file()]
    if missing:
        raise FileNotFoundError(f"Fichiers requis pour l'archive absents : {', '.join(missing)}")

    zip_needed = not zip_path.exists() or html_changed
    if not zip_needed:
        zip_mtime = zip_path.stat().st_mtime
        zip_needed = any((ROOT / name).stat().st_mtime > zip_mtime for name in files_to_pack)

    if zip_needed:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for name in files_to_pack:
                archive.write(ROOT / name, (Path("PromptFactory") / name).as_posix())
            archive.write(standalone_path, "PromptFactory/PromptFactory-Standalone.html")
        print(f"[OK] Archive ZIP portable actualisée : {zip_path}")
    else:
        print("[INFO] Archive ZIP déjà à jour.")

    return str(standalone_path), str(zip_path)


if __name__ == "__main__":
    build_portable()
