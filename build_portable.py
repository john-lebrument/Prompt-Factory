"""
Script de génération de la version portable de Prompt Factory
Génère :
1. portable/PromptFactory-Standalone.html (Fichier HTML unique avec CSS et JS intégrés)
2. portable/PromptFactory-Portable.zip (Archive complète prête à l'emploi)
"""

import os
import sys
import zipfile
import re

# Forcer l'encodage UTF-8 pour la console Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def build_portable():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    portable_dir = os.path.join(base_dir, "portable")
    os.makedirs(portable_dir, exist_ok=True)

    # 1. Génération du fichier HTML autonome unique (inlined CSS + JS)
    index_path = os.path.join(base_dir, "index.html")
    styles_path = os.path.join(base_dir, "styles.css")
    app_path = os.path.join(base_dir, "app.js")

    with open(index_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    with open(styles_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    with open(app_path, "r", encoding="utf-8") as f:
        js_content = f.read()

    # Remplacer le lien vers styles.css par la balise <style>
    style_tag = f"<style>\n{css_content}\n</style>"
    html_standalone = re.sub(
        r'<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>',
        lambda _: style_tag,
        html_content
    )

    # Remplacer la balise script app.js par le script complet
    script_tag = f"<script>\n{js_content}\n</script>"
    html_standalone = re.sub(
        r'<script\s+src="app\.js"\s*><\/script>',
        lambda _: script_tag,
        html_standalone
    )

    standalone_path = os.path.join(portable_dir, "PromptFactory-Standalone.html")
    with open(standalone_path, "w", encoding="utf-8") as f:
        f.write(html_standalone)
    print(f"[OK] Fichier autonome créé : {standalone_path}")

    # 2. Génération de l'archive ZIP portable
    zip_path = os.path.join(portable_dir, "PromptFactory-Portable.zip")
    files_to_pack = [
        "index.html",
        "app.js",
        "styles.css",
        "Lancer Prompt Factory.bat",
        "README.md"
    ]

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_name in files_to_pack:
            file_path = os.path.join(base_dir, file_name)
            if os.path.exists(file_path):
                # Ajouter dans un dossier racine propre dans le ZIP
                arcname = os.path.join("PromptFactory", file_name)
                zf.write(file_path, arcname)

        # Ajouter aussi le standalone dans le zip
        zf.write(standalone_path, os.path.join("PromptFactory", "PromptFactory-Standalone.html"))

    print(f"[OK] Archive ZIP portable créée : {zip_path}")
    return standalone_path, zip_path

if __name__ == "__main__":
    build_portable()
