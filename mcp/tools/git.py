"""Git workflow tools: push, pull/merge, branch switching, and conflict resolution."""

from _app import REPO_ROOT, _current_branch, _run, mcp


def _conflicted_files() -> list[str]:
    """Return list of files with unresolved conflict markers."""
    rc, out, _ = _run(["git", "diff", "--name-only", "--diff-filter=U"])
    if rc != 0:
        return []
    return [f.strip() for f in out.splitlines() if f.strip()]


def _merge_conflict_report(branch: str, *, already_in_progress: bool = False) -> str:
    """Build a structured conflict report for the caller to act on."""
    conflicted = _conflicted_files()
    lines = []
    if already_in_progress:
        lines.append(f"MERGE IN PROGRESS on branch '{branch}'.")
    else:
        lines.append(f"MERGE CONFLICT on branch '{branch}'.")
    lines.append(
        "The repo is left in the conflicted state. "
        "Resolve each conflicted file (remove all <<<<<<< / ======= / >>>>>>> markers), "
        "then call git_merge_continue. Call git_merge_abort to cancel instead."
    )
    lines.append("")
    if conflicted:
        lines.append(f"Conflicted files ({len(conflicted)}):")
        for f in conflicted:
            lines.append(f"  {f}")
        lines.append("")
        lines.append(
            "Use read_source_file to inspect each file (conflict markers will be present), "
            "edit to resolve, then call git_merge_continue."
        )
    else:
        lines.append("No unresolved files detected (may already be resolved).")
    return "\n".join(lines)


@mcp.tool()
def git_list_branches() -> str:
    """List all local branches and remote branches available on origin.

    Fetches from origin first so the list is current.
    The active branch is shown with an asterisk (*).
    """
    _run(["git", "fetch", "origin", "--prune"])  # best-effort — ignore errors
    rc, out, err = _run(["git", "branch", "-a"])
    if rc != 0:
        return f"ERROR: Could not list branches:\n{err}"
    return out or "No branches found."


@mcp.tool()
def git_checkout_branch(branch: str) -> str:
    """Switch to the specified branch.

    Fetches from origin first so remote-tracking refs are up to date.
    If the branch only exists on origin, a local tracking branch is created
    automatically.

    Args:
        branch: Branch name to check out (e.g. 'brian/sound-v2').
    """
    _run(["git", "fetch", "origin"])  # best-effort

    rc, out, err = _run(["git", "checkout", branch])
    if rc == 0:
        return f"Switched to branch '{branch}'.\n{(out + chr(10) + err).strip()}".strip()

    # Branch may only exist on origin — try creating a local tracking branch.
    rc2, out2, err2 = _run(["git", "checkout", "-b", branch, f"origin/{branch}"])
    if rc2 == 0:
        return f"Checked out '{branch}' as a local tracking branch from origin/{branch}."

    return f"ERROR: Could not switch to '{branch}':\n{err}\n{err2}".strip()



    """Push the current branch to remote origin.

    Idempotent: safe to call multiple times. Sets upstream tracking if not set.
    """
    branch, err = _current_branch()
    if err:
        return f"ERROR: {err}"

    rc, out, stderr = _run(["git", "push", "--set-upstream", "origin", branch])
    combined = f"{out}\n{stderr}".strip()
    if rc == 0:
        if "Everything up-to-date" in combined:
            return f"Branch '{branch}' is already up-to-date on origin."
        return f"Pushed branch '{branch}' to origin.\n{combined}".strip()
    return f"ERROR: Could not push branch '{branch}':\n{combined}"


@mcp.tool()
def git_pull_merge_main() -> str:
    """Fetch origin/main and merge it into the current branch.

    Idempotent: if already up-to-date, reports so without making changes.

    On merge conflict: the repo is left in the conflicted state (MERGE_HEAD is
    set) so the caller can resolve conflicts using read_source_file / edit tools,
    then call git_merge_continue. Call git_merge_abort to cancel instead.

    Returns a detailed conflict report listing every conflicted file so the
    caller knows exactly what needs to be resolved.
    """
    branch, err = _current_branch()
    if err:
        return f"ERROR: {err}"

    # If already mid-merge, report current state rather than starting a new one.
    if (REPO_ROOT / ".git" / "MERGE_HEAD").exists():
        return _merge_conflict_report(branch, already_in_progress=True)

    rc, _, err = _run(["git", "fetch", "origin", "main"])
    if rc != 0:
        return f"ERROR: Could not fetch origin/main:\n{err}"

    rc, out, err = _run(["git", "merge", "origin/main", "--no-edit"])
    combined = f"{out}\n{err}".strip()
    if rc == 0:
        if "Already up to date" in combined:
            return f"Branch '{branch}' is already up to date with origin/main."
        return f"Merged origin/main into '{branch}'.\n{combined}"

    # Leave the repo in the conflicted state and report.
    if (REPO_ROOT / ".git" / "MERGE_HEAD").exists():
        return _merge_conflict_report(branch)
    return f"ERROR: Merge failed (not a conflict):\n{combined}"


@mcp.tool()
def git_merge_continue() -> str:
    """Complete a merge after all conflicts have been resolved.

    Call this after editing conflicted files to remove all conflict markers.
    Stages all modified files and commits with the prepared merge message.
    Returns an error (without committing) if any conflict markers remain.
    """
    branch, err = _current_branch()
    if err:
        return f"ERROR: {err}"

    if not (REPO_ROOT / ".git" / "MERGE_HEAD").exists():
        return f"No merge in progress on branch '{branch}'."

    still_conflicted = _conflicted_files()
    if still_conflicted:
        lines = ["ERROR: Conflict markers still present in:"]
        for f in still_conflicted:
            lines.append(f"  {f}")
        lines.append("Resolve all conflicts first, then call git_merge_continue again.")
        return "\n".join(lines)

    rc, _, err = _run(["git", "add", "--all"])
    if rc != 0:
        return f"ERROR: Could not stage resolved files:\n{err}"

    # Use --no-edit to accept the prepared merge commit message without opening an editor.
    rc, out, err = _run(["git", "commit", "--no-edit"])
    combined = f"{out}\n{err}".strip()
    if rc == 0:
        return f"Merge completed on branch '{branch}'.\n{combined}".strip()
    return f"ERROR: Could not complete merge commit:\n{combined}"


@mcp.tool()
def git_merge_abort() -> str:
    """Abort the current in-progress merge and restore the branch to its pre-merge state.

    Safe to call even if no merge is in progress.
    """
    branch, err = _current_branch()
    if err:
        return f"ERROR: {err}"

    if not (REPO_ROOT / ".git" / "MERGE_HEAD").exists():
        return f"No merge in progress on branch '{branch}'."

    rc, out, err = _run(["git", "merge", "--abort"])
    combined = f"{out}\n{err}".strip()
    if rc == 0:
        return f"Merge aborted on branch '{branch}'. Working tree restored."
    return f"ERROR: Could not abort merge:\n{combined}"
