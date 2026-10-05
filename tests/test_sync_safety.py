import io
import unittest
from types import SimpleNamespace
from unittest.mock import call, patch

import sync_github


def result(stdout="", returncode=0, stderr=""):
    return SimpleNamespace(stdout=stdout, stderr=stderr, returncode=returncode)


def prepared_results(paths="app.js", tree="tree-a", base="base-a"):
    return [
        result(" M app.js"),
        result("main"),
        result(base),
        result(""),  # git add
        result(paths),  # staged names
        result(tree),  # git write-tree
    ]


def approved_commit_results(paths="app.js", tree="tree-a", base="base-a", commit="commit-a",
                            commit_paths=None, head=None, remote_before=None):
    if commit_paths is None:
        commit_paths = paths
    if head is None:
        head = commit
    if remote_before is None:
        remote_before = base
    return [
        result(paths),  # recheck staged names
        result(tree),  # recheck staged tree
        result("commit output"),
        result(commit),  # read commit SHA
        result(tree),  # read committed tree
        result(commit_paths),  # read committed paths
        result(base),  # verify commit parent
        result(head),  # verify local HEAD
        result(f"{remote_before}\trefs/heads/main"),  # check remote main
    ]


class TestSyncSafety(unittest.TestCase):
    @patch("sync_github.subprocess.run")
    def test_commands_run_without_a_shell(self, mocked_run):
        mocked_run.return_value = result("ok")
        sync_github.run_cmd(["git", "status"], check=False)
        self.assertFalse(mocked_run.call_args.kwargs["shell"])

    @patch("sync_github.subprocess.run")
    def test_failed_git_status_is_not_treated_as_a_clean_tree(self, mocked_run):
        mocked_run.return_value = result(stderr="fatal: not a repository", returncode=128)
        with self.assertRaisesRegex(RuntimeError, "code 128"):
            sync_github.run_cmd(["git", "status"])

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", return_value="n")
    def test_declining_first_confirmation_never_stages_or_pushes(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = [result(" M app.js"), result("main")]
        with patch("sys.stdout", new_callable=io.StringIO):
            synced = sync_github.sync()
        self.assertFalse(synced)
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertFalse(any(any(word in command for word in ("add", "commit", "push")) for command in commands))

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "n"])
    def test_declining_second_confirmation_never_commits_or_pushes(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = prepared_results()
        output = io.StringIO()
        with patch("sys.stdout", output):
            synced = sync_github.sync()
        self.assertFalse(synced)
        self.assertIn("app.js", output.getvalue())
        self.assertIn("restent préparés localement", output.getvalue())
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertFalse(any(any(word in command for word in ("commit", "push")) for command in commands))

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_changed_staged_list_aborts_before_commit(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = prepared_results() + [result("app.js\nsecret.txt")]
        with patch("sys.stdout", new_callable=io.StringIO), self.assertRaisesRegex(RuntimeError, "index a changé"):
            sync_github.sync()
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertFalse(any(any(word in command for word in ("commit", "push")) for command in commands))

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_changed_staged_tree_aborts_before_commit(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = prepared_results() + [result("app.js"), result("tree-changed")]
        with patch("sys.stdout", new_callable=io.StringIO), self.assertRaisesRegex(RuntimeError, "contenu staged a changé"):
            sync_github.sync()
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertFalse(any(any(word in command for word in ("commit", "push")) for command in commands))

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_unexpected_commit_contents_abort_before_push(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = prepared_results() + approved_commit_results(commit_paths="app.js\nsecret.txt")
        with patch("sys.stdout", new_callable=io.StringIO), self.assertRaisesRegex(RuntimeError, "liste différente"):
            sync_github.sync()
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertFalse(any("push" in command for command in commands))

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_changed_local_head_aborts_before_push(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = prepared_results() + approved_commit_results(head="other-commit")
        with patch("sys.stdout", new_callable=io.StringIO), self.assertRaisesRegex(RuntimeError, "HEAD a changé"):
            sync_github.sync()
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertFalse(any("push" in command for command in commands))

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_remote_divergence_aborts_before_push(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = prepared_results() + approved_commit_results(remote_before="remote-new")
        with patch("sys.stdout", new_callable=io.StringIO), self.assertRaisesRegex(RuntimeError, "origin/main a changé"):
            sync_github.sync()
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertFalse(any("push" in command for command in commands))

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_pushes_exact_validated_sha_and_reads_back_remote_ref(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = (
            prepared_results()
            + approved_commit_results()
            + [result("push ok"), result("commit-a\trefs/heads/main")]
        )
        with patch("sys.stdout", new_callable=io.StringIO):
            synced = sync_github.sync()
        self.assertTrue(synced)
        commands = [item.args[0] for item in mocked_run.call_args_list]
        self.assertIn(["git", "push", "origin", "commit-a:refs/heads/main"], commands)
        self.assertEqual(commands[-1], ["git", "ls-remote", "--heads", "origin", "refs/heads/main"])

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_push_is_not_reported_as_success_when_remote_readback_differs(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = (
            prepared_results()
            + approved_commit_results()
            + [result("push ok"), result("other-commit\trefs/heads/main")]
        )
        output = io.StringIO()
        with patch("sys.stdout", output), self.assertRaisesRegex(RuntimeError, "vérification distante"):
            sync_github.sync()
        self.assertNotIn("Synchronisation terminée avec succès", output.getvalue())

    @patch("build_portable.build_portable")
    @patch("sync_github.run_cmd")
    @patch("builtins.input", side_effect=["y", "y"])
    def test_push_failure_is_not_reported_as_success(self, mocked_input, mocked_run, mocked_build):
        mocked_run.side_effect = prepared_results() + approved_commit_results() + [RuntimeError("push failed")]
        output = io.StringIO()
        with patch("sys.stdout", output), self.assertRaisesRegex(RuntimeError, "push failed"):
            sync_github.sync()
        self.assertNotIn("Synchronisation terminée avec succès", output.getvalue())


if __name__ == "__main__":
    unittest.main()
