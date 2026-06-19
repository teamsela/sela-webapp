"""GitHub tools: pull request creation and Vercel deployment checks."""

import json
import re
import webbrowser

from _app import _current_branch, _run, mcp


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resolve_branch(branch: str) -> tuple[str, str]:
    """Return (branch_name, error). Uses current branch if branch is empty."""
    if branch:
        return branch, ""
    return _current_branch()


def _pr_data(branch: str) -> tuple[dict, str]:
    """Fetch PR JSON for the given branch. Returns (data, error)."""
    cmd = ["gh", "pr", "view", "--json", "url,state,isDraft,comments,statusCheckRollup"]
    if branch:
        cmd.insert(3, branch)  # gh pr view <branch> --json ...
    rc, out, err = _run(cmd)
    if rc != 0:
        return {}, err
    try:
        return json.loads(out), ""
    except json.JSONDecodeError:
        return {}, "Could not parse PR data from GitHub CLI."


def _extract_vercel_url(data: dict) -> str:
    """Pull the latest Vercel preview URL from PR comments or status checks."""
    comments: list[dict] = data.get("comments", []) or []
    checks: list[dict] = data.get("statusCheckRollup", []) or []

    # Scan comments newest-first for a Vercel bot preview URL.
    for comment in reversed(comments):
        author = comment.get("author", {}).get("login", "")
        body = comment.get("body", "")
        if "vercel" in author.lower() or "vercel" in body.lower():
            match = re.search(r'https://[^\s)<>"\']+\.vercel\.app[^\s)<>"\']*', body)
            if match:
                return match.group(0)

    # Fall back to Vercel status check target URL.
    for check in checks:
        if "vercel" in check.get("name", "").lower():
            url = check.get("targetUrl") or check.get("detailsUrl") or ""
            if url:
                return url

    return ""


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
def check_pr(branch: str = "") -> str:
    """Check whether a pull request exists for a branch.

    Args:
        branch: Branch name to check. Defaults to the current branch.
    """
    branch, err = _resolve_branch(branch)
    if err:
        return f"ERROR: {err}"

    data, err = _pr_data(branch)
    if err:
        return f"No PR found for branch '{branch}'.\n{err}"

    url = data.get("url", "")
    state = data.get("state", "")
    is_draft = data.get("isDraft", False)
    return (
        f"PR found for '{branch}':\n"
        f"  URL:   {url}\n"
        f"  State: {state}\n"
        f"  Draft: {is_draft}"
    )


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

    data, _ = _pr_data("")  # check current branch
    if data:
        url = data.get("url", "")
        state = data.get("state", "")
        is_draft = data.get("isDraft", False)
        return (
            f"PR already exists for '{branch}':\n"
            f"  URL:   {url}\n"
            f"  State: {state}\n"
            f"  Draft: {is_draft}"
        )

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
def check_vercel_deployment(branch: str = "") -> str:
    """Check Vercel preview deployment status for a branch's PR.

    Scans PR comments for the Vercel bot's preview URL and reports any
    Vercel-related status checks. Does not require a Vercel API token.

    Args:
        branch: Branch name to check. Defaults to the current branch.

    Returns the deployment URL when available, or a status message if the
    build is still in progress or no PR exists yet.
    """
    branch, err = _resolve_branch(branch)
    if err:
        return f"ERROR: {err}"

    data, err = _pr_data(branch)
    if err:
        return (
            f"No PR found for branch '{branch}'. "
            f"Create one first with create_draft_pr.\n{err}"
        )

    pr_url = data.get("url", "")
    checks: list[dict] = data.get("statusCheckRollup", []) or []
    preview_url = _extract_vercel_url(data)

    lines = [f"PR: {pr_url}"]
    if preview_url:
        lines.append(f"Preview URL: {preview_url}")

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


@mcp.tool()
def open_vercel_preview(branch: str = "") -> str:
    """Find the Vercel preview URL for a branch's PR and open it in the browser.

    Useful for kicking off manual or automated testing against the preview
    deployment. The returned URL can be passed to Playwright / E2E tests via
    the SELA_BASE_URL environment variable.

    Args:
        branch: Branch name to check. Defaults to the current branch.

    Returns the preview URL on success so it can be used in subsequent steps.
    """
    branch, err = _resolve_branch(branch)
    if err:
        return f"ERROR: {err}"

    data, err = _pr_data(branch)
    if err:
        return (
            f"No PR found for branch '{branch}'. "
            f"Create one first with create_draft_pr.\n{err}"
        )

    preview_url = _extract_vercel_url(data)
    if not preview_url:
        pr_url = data.get("url", "")
        return (
            f"Vercel preview URL not yet available for '{branch}'.\n"
            f"PR: {pr_url}\n"
            "The Vercel bot may still be building. "
            "Try again in a moment or check check_vercel_deployment for status."
        )

    webbrowser.open(preview_url)
    return (
        f"Opened preview in browser:\n"
        f"  {preview_url}\n\n"
        f"To run E2E tests against this deployment:\n"
        f"  SELA_BASE_URL={preview_url} npx playwright test"
    )
