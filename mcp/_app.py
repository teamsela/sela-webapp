"""Shared FastMCP instance and subprocess helpers.

Every tool module imports from here so all tools register on the same server.
"""

import os
import subprocess
from pathlib import Path

from fastmcp import FastMCP

REPO_ROOT = Path(__file__).parent.parent.resolve()

mcp = FastMCP(
    "sela-webapp",
    instructions="Tools for developing the SELA Hebrew Bible study webapp.",
)


def _run(
    cmd: list[str],
    cwd: Path | None = None,
    timeout: int = 60,
    extra_env: dict[str, str] | None = None,
) -> tuple[int, str, str]:
    """Run a subprocess command, returning (returncode, stdout, stderr).

    Never raises — all errors are returned as a non-zero returncode.
    """
    try:
        env = {**os.environ, **(extra_env or {})}
        result = subprocess.run(
            cmd,
            cwd=cwd or REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except FileNotFoundError as exc:
        return 1, "", f"Command not found: {exc}"
    except subprocess.TimeoutExpired:
        return 1, "", f"Command timed out after {timeout}s: {' '.join(cmd)}"
    except Exception as exc:  # noqa: BLE001
        return 1, "", str(exc)


def _current_branch() -> tuple[str, str]:
    """Return (branch_name, error). error is empty on success."""
    rc, out, err = _run(["git", "branch", "--show-current"])
    if rc != 0 or not out:
        return "", err or "Could not determine current branch."
    return out, ""
