"""
Script d'automatisation de synchronisation GitHub pour Prompt Factory.
Rôle :
1. Régénérer la version portable (PromptFactory-Standalone.html + PromptFactory-Portable.zip)
2. Détecter les modifications de code
3. Commiter et pousser automatiquement vers le dépôt GitHub public
"""

import os
import sys
import subprocess
from datetime import datetime

# Forcer l'encodage UTF-8 pour la console Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

local_app_data = os.environ.get("LOCALAPPDATA", "")
program_files = os.environ.get("ProgramFiles", r"C:\Program Files")

# Chemins vers les binaires Git et GitHub CLI sur le système (résolus dynamiquement)
GIT_PATHS = [
    os.path.join(local_app_data, "Programs", "Git", "cmd"),
    os.path.join(program_files, "Git", "cmd"),
    os.path.join(program_files, "GitHub CLI")
]

def update_env_path():
    current_path = os.environ.get("PATH", "")
    new_paths = [p for p in GIT_PATHS if os.path.exists(p) and p not in current_path]
    if new_paths:
        os.environ["PATH"] = ";".join(new_paths) + ";" + current_path

def run_cmd(cmd, cwd=None, check=True):
    print(f"-> Exécution : {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    res = subprocess.run(
        cmd,
        cwd=cwd,
        shell=True,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace"
    )
    if res.stdout.strip():
        print(res.stdout.strip())
    if res.stderr.strip() and res.returncode != 0:
        print(f"[ERREUR] {res.stderr.strip()}", file=sys.stderr)
    if check and res.returncode != 0:
        raise RuntimeError(f"Échec de la commande (code {res.returncode}): {cmd}")
    return res

def sync(commit_message=None):
    update_env_path()
    base_dir = os.path.dirname(os.path.abspath(__file__))

    print("==================================================")
    print("🏭 SYNCHRONISATION PROMPT FACTORY -> GITHUB")
    print("==================================================")

    # 1. Régénération de la version portable
    print("\n[1/3] Régénération de la version portable...")
    from build_portable import build_portable
    build_portable()

    # 2. Vérification de l'état Git
    print("\n[2/3] Vérification de l'état Git...")
    status_res = run_cmd("git status --porcelain", cwd=base_dir, check=False)
    
    if not status_res.stdout.strip():
        print("Aucune modification à synchroniser. Tout est à jour !")
        return

    # 3. Ajout et Commit
    if not commit_message:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        commit_message = f"Mise à jour automatique : code et version portable ({now_str})"

    print(f"\n[3/3] Synchronisation vers GitHub : '{commit_message}'...")
    run_cmd("git add -A", cwd=base_dir)
    run_cmd(["git", "commit", "-m", commit_message], cwd=base_dir)
    
    # Push vers le remote
    push_res = run_cmd("git push origin main", cwd=base_dir, check=False)
    if push_res.returncode != 0:
        # Tenter master si main n'est pas la branche
        run_cmd("git push origin master", cwd=base_dir, check=False)

    print("\n✅ Synchronisation terminée avec succès vers GitHub !")

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else None
    sync(msg)
