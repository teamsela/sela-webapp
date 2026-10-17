#!/usr/bin/env python3
"""SELA Webapp MCP Server — entrypoint.

Exposes development tools for the sela-webapp repo to AI coding assistants
(GitHub Copilot, Claude Code, Codex).

Tool modules live in tools/ and are auto-loaded on import:
  tools/repo.py          — browse and read source files
  tools/code_quality.py  — type checking and linting
  tools/git.py           — push, pull/merge, conflict resolution
  tools/github.py        — pull requests and Vercel deployments
"""

import sys
from pathlib import Path

# Ensure this directory is on sys.path so tool modules can import _app.
sys.path.insert(0, str(Path(__file__).parent))

from _app import mcp  # noqa: E402
import tools  # noqa: E402, F401  — registers all tools as a side effect


if __name__ == "__main__":
    mcp.run()
