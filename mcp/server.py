#!/usr/bin/env python3
"""SELA Webapp MCP Server

Exposes development and testing tools for the sela-webapp repo to AI coding
assistants (GitHub Copilot, Claude Code, Codex).

Configuration (set as environment variables):
  SELA_TEST_DIR  – path to the external E2E/unit test directory
                   (e.g. /path/to/Sound Display Transliteration)
  SELA_BASE_URL  – base URL for E2E tests and screenshots
                   (defaults to Vercel preview URL)
"""

import base64
import os
import subprocess
import sys
from pathlib import Path

from fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Path resolution — no hardcoded absolute paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).parent.parent.resolve()

DEFAULT_PREVIEW_URL = (
    "https://sela-webapp-git-brian-sound-v2-sela-webapp.vercel.app"
)


def _test_dir() -> Path | None:
    raw = os.environ.get("SELA_TEST_DIR", "").strip()
    if not raw:
        return None
    p = Path(raw)
    return p if p.exists() else None


def _base_url() -> str:
    return os.environ.get("SELA_BASE_URL", DEFAULT_PREVIEW_URL).rstrip("/")


# ---------------------------------------------------------------------------
# MCP server
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "sela-webapp",
    instructions=(
        "Tools for developing and testing the SELA Hebrew Bible study webapp. "
        "Set SELA_TEST_DIR to the external test directory to enable test tools. "
        "Set SELA_BASE_URL to override the target URL for E2E tests."
    ),
)


# ---------------------------------------------------------------------------
# Repo tools
# ---------------------------------------------------------------------------

@mcp.tool()
def repo_info() -> str:
    """Return the repo root path and key source file checklist."""
    key_files = [
        "src/lib/actions.ts",
        "src/lib/transliterate.ts",
        "src/lib/hebrewHighlights.ts",
        "src/components/StudyPane/InfoPane/Sounds.tsx",
        "src/schema.ts",
        "package.json",
        "tsconfig.json",
        "next.config.mjs",
        ".env",
    ]
    lines = [f"Repo root: {REPO_ROOT}", ""]
    for rel in key_files:
        exists = "✓" if (REPO_ROOT / rel).exists() else "✗"
        lines.append(f"  {exists}  {rel}")

    td = _test_dir()
    lines += [
        "",
        f"SELA_TEST_DIR: {td or '(not set)'}",
        f"SELA_BASE_URL: {_base_url()}",
    ]
    return "\n".join(lines)


@mcp.tool()
def read_source_file(path: str) -> str:
    """Read a file from the sela-webapp repo.

    Args:
        path: Relative path from repo root, e.g. 'src/lib/transliterate.ts'
    """
    target = (REPO_ROOT / path).resolve()
    if not str(target).startswith(str(REPO_ROOT)):
        return "⚠️ Path must be within the repo root."
    if not target.exists():
        return f"⚠️ File not found: {path}"
    try:
        return target.read_text(encoding="utf-8")
    except Exception as e:
        return f"⚠️ Could not read file: {e}"


@mcp.tool()
def list_source_files(glob_pattern: str = "src/**/*.ts") -> str:
    """List source files in the repo matching a glob pattern.

    Args:
        glob_pattern: Glob relative to repo root, e.g. 'src/**/*.tsx'
    """
    matches = sorted(REPO_ROOT.glob(glob_pattern))
    if not matches:
        return f"No files matched: {glob_pattern}"
    return "\n".join(str(p.relative_to(REPO_ROOT)) for p in matches)


@mcp.tool()
def run_type_check() -> str:
    """Run TypeScript type checking (tsc --noEmit) in the repo."""
    result = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode == 0:
        return "✅ TypeScript: no type errors."
    return f"❌ TypeScript errors:\n{result.stdout}\n{result.stderr}".strip()


@mcp.tool()
def run_lint() -> str:
    """Run ESLint (next lint) in the repo."""
    result = subprocess.run(
        ["npm", "run", "lint"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=120,
        shell=True,
    )
    if result.returncode == 0:
        return "✅ Lint: no issues."
    return f"❌ Lint errors:\n{result.stdout}\n{result.stderr}".strip()


# ---------------------------------------------------------------------------
# Test tools (require SELA_TEST_DIR)
# ---------------------------------------------------------------------------

def _require_test_dir() -> Path | str:
    td = _test_dir()
    if td is None:
        return (
            "⚠️ SELA_TEST_DIR is not set or does not exist. "
            "Set it to the path of the external test directory."
        )
    return td


@mcp.tool()
def run_unit_tests(filter_pattern: str = "") -> str:
    """Run vitest unit tests from the external test directory.

    Args:
        filter_pattern: Optional test name filter, e.g. 'transliterate'
    """
    td = _require_test_dir()
    if isinstance(td, str):
        return td

    cmd = ["npx", "vitest", "run", "--reporter=verbose"]
    if filter_pattern:
        cmd += ["-t", filter_pattern]

    result = subprocess.run(
        cmd, cwd=td, capture_output=True, text=True, timeout=180
    )
    return (result.stdout + result.stderr).strip()


@mcp.tool()
def run_e2e_tests(spec: str = "", base_url: str = "") -> str:
    """Run Playwright E2E tests from the external test directory.

    Args:
        spec: Optional spec file to run, e.g. 'sounds.spec.ts'
        base_url: Override the target URL (defaults to SELA_BASE_URL env var)
    """
    td = _require_test_dir()
    if isinstance(td, str):
        return td

    env = os.environ.copy()
    if base_url:
        env["SELA_BASE_URL"] = base_url

    cmd = ["npx", "playwright", "test", "--reporter=list"]
    if spec:
        cmd.append(spec)

    result = subprocess.run(
        cmd, cwd=td, capture_output=True, text=True, timeout=300, env=env
    )
    return (result.stdout + result.stderr).strip()


@mcp.tool()
def take_screenshots(base_url: str = "") -> str:
    """Run the quick-screenshot script and report results.

    Args:
        base_url: URL to screenshot (defaults to SELA_BASE_URL env var)
    """
    td = _require_test_dir()
    if isinstance(td, str):
        return td

    script = td / "quick-screenshot.ts"
    if not script.exists():
        return f"⚠️ quick-screenshot.ts not found in {td}"

    env = os.environ.copy()
    if base_url:
        env["SELA_BASE_URL"] = base_url

    result = subprocess.run(
        ["npx", "ts-node", "quick-screenshot.ts"],
        cwd=td,
        capture_output=True,
        text=True,
        timeout=180,
        env=env,
    )
    return (result.stdout + result.stderr).strip()


@mcp.tool()
def list_screenshots(kind: str = "fresh") -> str:
    """List available screenshots.

    Args:
        kind: 'fresh' (latest run), 'automated' (spec screenshots), or 'spec' (requirement images)
    """
    td = _require_test_dir()
    if isinstance(td, str):
        return td

    path_map = {
        "spec": td / "images",
        "automated": td / "test-evidence" / "screenshots" / "automated",
        "fresh": td / "test-evidence" / "screenshots" / "fresh",
    }
    target = path_map.get(kind)
    if target is None:
        return f"⚠️ Unknown kind '{kind}'. Use 'fresh', 'automated', or 'spec'."
    if not target.exists():
        return f"Directory not found: {target}"

    files = sorted(target.glob("*.png"))
    return "\n".join(f.name for f in files) or "No screenshots found."


@mcp.tool()
def get_screenshot(name: str, kind: str = "fresh") -> str:
    """Get a screenshot as a base64-encoded PNG data URI.

    Args:
        name: Filename, e.g. '07-transliteration-mode-with-highlights.png'
        kind: 'fresh', 'automated', or 'spec'
    """
    td = _require_test_dir()
    if isinstance(td, str):
        return td

    path_map = {
        "spec": td / "images" / name,
        "automated": td / "test-evidence" / "screenshots" / "automated" / name,
        "fresh": td / "test-evidence" / "screenshots" / "fresh" / name,
    }
    target = path_map.get(kind)
    if target is None:
        return f"⚠️ Unknown kind '{kind}'."
    if not target.exists():
        return f"⚠️ File not found: {target}"

    data = target.read_bytes()
    b64 = base64.b64encode(data).decode()
    return f"data:image/png;base64,{b64}"


@mcp.tool()
def read_test_file(relative_path: str) -> str:
    """Read a file from the external test directory.

    Args:
        relative_path: Path relative to SELA_TEST_DIR, e.g. 'unit/hebrewHighlights.test.ts'
    """
    td = _require_test_dir()
    if isinstance(td, str):
        return td

    target = (td / relative_path).resolve()
    if not str(target).startswith(str(td.resolve())):
        return "⚠️ Path must be within SELA_TEST_DIR."
    if not target.exists():
        return f"⚠️ File not found: {relative_path}"
    try:
        return target.read_text(encoding="utf-8")
    except Exception as e:
        return f"⚠️ Could not read file: {e}"


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    mcp.run()
