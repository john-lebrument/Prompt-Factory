"""Synchronise Prompt Factory to GitHub after explicit user confirmation."""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

LOCAL_APP_DATA = os.environ.get("LOCALAPPDATA", "")
PROGRAM_FILES = os.environ.get("ProgramFiles", r"C:\Program Files")
GIT_PATHS = [
    os.path.join(LOCAL_APP_DATA, "Programs", "Git", "cmd"),
    os.path.join(PROGRAM_FILES, "Git", "cmd"),
    os.path.join(PROGRAM_FILES, "GitHub CLI"),
]


def update_env_path():
    current_path = os.environ.get("PATH", "")
    existing = {p.casefold() for p in current_path.split(os.pathsep) if p}
    new_paths = [p for p in GIT_PATHS if os.path.isdir(p) and p.casefold() not in existing]
    if new_paths:
        os.environ["PATH"] = os.pathsep.join(new_paths + [current_path])


def run_cmd(cmd, cwd=None, check=True):
    """Run a command without a shell to avoid interpreting user-controlled text."""
    if not isinstance(cmd, (list, tuple)) or not cmd:
        raise ValueError("Commands must be provided as a non-empty argument list")
    print(f"-> Exécution : {' '.join(map(str, cmd))}")
    result = subprocess.run(
        list(map(str, cmd)),
        cwd=cwd,
        shell=False,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip() and result.returncode != 0:
        print(f"[ERREUR] {result.stderr.strip()}", file=sys.stderr)
    if check and result.returncode != 0:
        raise RuntimeError(f"Échec de la commande (code {result.returncode}): {cmd}")
    return result


def remote_main_sha(cwd):
    result = run_cmd(["git", "ls-remote", "--heads", "origin", "refs/heads/main"], cwd=cwd)
    matches = []
    for line in result.stdout.splitlines():
        fields = line.split()
        if len(fields) == 2 and fields[1] == "refs/heads/main":
            matches.append(fields[0])
    if len(matches) != 1:
        raise RuntimeError("Impossible de vérifier la référence distante origin/main.")
    return matches[0]


def sync(commit_message=None):
    update_env_path()
    base_dir = Path(__file__).resolve().parent

    print("==================================================")
    print("🏭 SYNCHRONISATION PROMPT FACTORY -> GITHUB")
    print("==================================================")

    print("\n[1/3] Régénération de la version portable...")
    from build_portable import build_portable
    build_portable()

    print("\n[2/3] Vérification des modifications...")
    status = run_cmd(["git", "status", "--short"], cwd=base_dir)
    if not status.stdout.strip():
        print("Aucune modification à synchroniser. Tout est à jour !")
        return False

    print("Fichiers modifiés/non suivis détectés :")
    print(status.stdout.strip())
    branch = run_cmd(["git", "branch", "--show-current"], cwd=base_dir).stdout.strip()
    if branch != "main":
        raise RuntimeError(f"Branche courante : {branch!r}. Bascule sur 'main' avant synchronisation.")

    answer = input("Ajouter, committer et publier ces changements sur le dépôt public ? (o/N) ").strip().lower()
    if answer not in {"o", "oui", "y", "yes"}:
        print("Synchronisation annulée ; aucun commit ni push effectué.")
        return False

    base_sha = run_cmd(["git", "rev-parse", "HEAD"], cwd=base_dir).stdout.strip()
    if not base_sha:
        raise RuntimeError("Impossible d'identifier le commit local de départ.")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if not commit_message:
        commit_message = f"Mise à jour Prompt Factory ({now_str})"

    print("\n[3/3] Commit et publication...")
    run_cmd(["git", "add", "-A", "--", "."], cwd=base_dir)
    staged = run_cmd(["git", "diff", "--cached", "--name-only"], cwd=base_dir)
    if not staged.stdout.strip():
        print("Aucun changement à committer.")
        return False
    approved_tree = run_cmd(["git", "write-tree"], cwd=base_dir).stdout.strip()
    if not approved_tree:
        raise RuntimeError("Impossible de figer le contenu staged ; aucun commit ni push effectué.")
    print("Fichiers qui seront publiés :")
    print(staged.stdout.strip())
    publish = input("Confirmer le commit et la publication de cette liste exacte ? (o/N) ").strip().lower()
    if publish not in {"o", "oui", "y", "yes"}:
        print("Publication annulée ; les fichiers restent préparés localement, aucun commit ni push effectué.")
        return False
    confirmed_files = staged.stdout.splitlines()
    current_staged = run_cmd(["git", "diff", "--cached", "--name-only"], cwd=base_dir).stdout.splitlines()
    if current_staged != confirmed_files:
        raise RuntimeError("L’index a changé depuis la confirmation ; aucun commit ni push effectué.")
    current_tree = run_cmd(["git", "write-tree"], cwd=base_dir).stdout.strip()
    if current_tree != approved_tree:
        raise RuntimeError("Le contenu staged a changé depuis la confirmation ; aucun commit ni push effectué.")
    run_cmd(["git", "commit", "-m", commit_message], cwd=base_dir)
    commit_sha = run_cmd(["git", "rev-parse", "HEAD"], cwd=base_dir).stdout.strip()
    committed_tree = run_cmd(
        ["git", "rev-parse", f"{commit_sha}^{{tree}}"], cwd=base_dir
    ).stdout.splitlines()
    if committed_tree != [approved_tree]:
        raise RuntimeError("Le contenu du commit diffère de celui confirmé ; il n’a pas été publié sur GitHub.")
    committed_files = run_cmd(
        ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", commit_sha], cwd=base_dir
    ).stdout.splitlines()
    if committed_files != confirmed_files:
        raise RuntimeError("Le commit contient une liste différente ; il n’a pas été publié sur GitHub.")
    commit_parent = run_cmd(["git", "rev-parse", f"{commit_sha}^"], cwd=base_dir).stdout.strip()
    if commit_parent != base_sha:
        raise RuntimeError("Le commit de départ a changé ; aucun push effectué.")
    current_head = run_cmd(["git", "rev-parse", "HEAD"], cwd=base_dir).stdout.strip()
    if current_head != commit_sha:
        raise RuntimeError("HEAD a changé depuis le commit validé ; aucun push effectué.")

    remote_sha = remote_main_sha(base_dir)
    if remote_sha == commit_sha:
        print("Ce commit est déjà présent sur origin/main.")
        return True
    if remote_sha != base_sha:
        raise RuntimeError("origin/main a changé depuis le début ; récupérez les changements et relancez.")

    run_cmd(["git", "push", "origin", f"{commit_sha}:refs/heads/main"], cwd=base_dir)
    verified_remote_sha = remote_main_sha(base_dir)
    if verified_remote_sha != commit_sha:
        raise RuntimeError("Le push a été tenté, mais la vérification distante n’a pas retrouvé le commit attendu.")
    print("\n✅ Synchronisation terminée avec succès vers GitHub !")
    return True


if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else None
    sync(message)
