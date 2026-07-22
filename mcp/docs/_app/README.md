# `_app.py` — shared FastMCP instance & helpers

Creates the single `FastMCP("sela-webapp")` instance every tool module imports, plus subprocess helpers. `REPO_ROOT` is the resolved repo root used for all file and command operations.

## Usage

Imported by every tool module: `from _app import REPO_ROOT, mcp` (and `_run`, `_current_branch` where needed).

See [`SETUP.md`](SETUP.md) for prerequisites.
