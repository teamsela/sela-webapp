"""Code quality tools: type checking and linting."""

import subprocess

from _app import REPO_ROOT, mcp


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
