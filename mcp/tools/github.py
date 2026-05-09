"""GitHub tools: pull request creation and Vercel deployment checks."""

import json
import re

from _app import _current_branch, _run, mcp


@mcp.tool()
def create_draft_pr(
    title: str = "",
    body: str = "",
    base: str = "main",
) -> str:
    """Create a draft pull request for the current branch on GitHub.

    Idempotent: if a PR already exists for this branch, returns its details
    without creating a duplicate.

    Args:
        title: PR title. Defaults to the branch name if not provided.
        body: PR description body in Markdown.
        base: Base branch for the PR (default: main).
    """
    branch, err = _current_branch()
    if err:
        return f"ERROR: {err}"

    # Check if a PR already exists for this branch.
    rc, out, _ = _run(["gh", "pr", "view", "--json", "url,state,isDraft"])
    if rc == 0 and out:
        try:
            data = json.loads(out)
            url = data.get("url", "")
            state = data.get("state", "")
            is_draft = data.get("isDraft", False)
            return (
                f"PR already exists for '{branch}':\n"
                f"  URL: {url}\n"
                f"  State: {state}\n"
                f"  Draft: {is_draft}"
            )
        except json.JSONDecodeError:
            pass

    pr_title = title or branch
    cmd = [
        "gh", "pr", "create",
        "--draft",
        "--title", pr_title,
        "--base", base,
        "--body", body,
    ]
    rc, out, err = _run(cmd, timeout=60)
    if rc == 0:
        return f"Draft PR created for '{branch}':\n  {out.strip()}"
    return f"ERROR: Could not create draft PR:\n{out}\n{err}".strip()


@mcp.tool()
def check_vercel_deployment() -> str:
    """Check Vercel preview deployment status for the current branch's PR.

    Scans PR comments for the Vercel bot's preview URL and reports any
    Vercel-related status checks. Does not require a Vercel API token.

    Returns the deployment URL when available, or a status message if the
    build is still in progress or no PR exists yet.
    """
    branch, err = _current_branch()
    if err:
        return f"ERROR: {err}"

    rc, out, err = _run(
        ["gh", "pr", "view", "--json", "url,comments,statusCheckRollup"]
    )
    if rc != 0:
        return (
            f"No PR found for branch '{branch}'. "
            f"Create one first with create_draft_pr.\n{err}"
        )

    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        return "ERROR: Could not parse PR data from GitHub CLI."

    pr_url = data.get("url", "")
    comments: list[dict] = data.get("comments", []) or []
    checks: list[dict] = data.get("statusCheckRollup", []) or []

    lines = [f"PR: {pr_url}"]

    # Scan comments newest-first for a Vercel bot preview URL.
    preview_url: str = ""
    for comment in reversed(comments):
        author = comment.get("author", {}).get("login", "")
        body = comment.get("body", "")
        if "vercel" in author.lower() or "vercel" in body.lower():
            match = re.search(r'https://[^\s)<>"\']+\.vercel\.app[^\s)<>"\']*', body)
            if match:
                preview_url = match.group(0)
                break

    if preview_url:
        lines.append(f"Preview URL: {preview_url}")

    # Report Vercel status checks.
    vercel_checks = [c for c in checks if "vercel" in c.get("name", "").lower()]
    if vercel_checks:
        lines.append("Vercel checks:")
        for c in vercel_checks:
            name = c.get("name", "")
            status = c.get("status", "")
            conclusion = c.get("conclusion", "") or "pending"
            target = c.get("targetUrl") or c.get("detailsUrl") or ""
            line = f"  {name}: {status} / {conclusion}"
            if target:
                line += f"\n    -> {target}"
            lines.append(line)

    if not preview_url and not vercel_checks:
        lines.append(
            "Vercel deployment not yet detected. "
            "The Vercel bot may still be building or has not been triggered."
        )

    return "\n".join(lines)
