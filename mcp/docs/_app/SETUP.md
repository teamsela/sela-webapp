# `_app.py` — Setup

## Dependencies

`fastmcp`.

## Verify

```powershell
python -c "import sys; sys.path.insert(0,'mcp'); from _app import mcp, REPO_ROOT; print(REPO_ROOT)"
```

## Usage

Imported by every tool module: `from _app import REPO_ROOT, mcp` (and `_run`, `_current_branch` where needed).

## Notes

`_run(cmd, cwd, timeout, extra_env)` never raises — it returns `(returncode, stdout, stderr)`, so tools can surface errors as strings instead of crashing the server.
