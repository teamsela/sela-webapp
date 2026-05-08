#!/usr/bin/env python3
"""SELA Webapp MCP Server

Exposes development tools for the sela-webapp repo to AI coding assistants
(GitHub Copilot, Claude Code, Codex).
"""

import subprocess
from pathlib import Path

from fastmcp import FastMCP

REPO_ROOT = Path(__file__).parent.parent.resolve()

mcp = FastMCP(
    "sela-webapp",
    instructions="Tools for developing the SELA Hebrew Bible study webapp.",
)


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
    ]
    lines = [f"Repo root: {REPO_ROOT}", ""]
    for rel in key_files:
        exists = "[ok]" if (REPO_ROOT / rel).exists() else "[missing]"
        lines.append(f"  {exists}  {rel}")
    return "\n".join(lines)


@mcp.tool()
def read_source_file(path: str) -> str:
    """Read a file from the sela-webapp repo.

    Args:
        path: Relative path from repo root, e.g. 'src/lib/transliterate.ts'
    """
    target = (REPO_ROOT / path).resolve()
    if not str(target).startswith(str(REPO_ROOT)):
        return "ERROR: Path must be within the repo root."
    if not target.exists():
        return f"ERROR: File not found: {path}"
    try:
        return target.read_text(encoding="utf-8")
    except Exception as e:
        return f"ERROR: Could not read file: {e}"


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
        return "TypeScript: no type errors."
    return f"TypeScript errors:\n{result.stdout}\n{result.stderr}".strip()


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
        return "Lint: no issues."
    return f"Lint errors:\n{result.stdout}\n{result.stderr}".strip()


if __name__ == "__main__":
    mcp.run()
