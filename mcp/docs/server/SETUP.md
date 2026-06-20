# `server.py` — Setup

## Dependencies

All of `mcp/requirements.txt` (it loads every tool module).

## Verify

```powershell
python -c "import sys; sys.path.insert(0,'mcp'); from _app import mcp; import tools; print('OK')"
```

## Usage

Launched automatically by your assistant via `.mcp.json` (`python mcp/server.py`). Run it directly only to smoke-test that the server starts.

## Notes

Adding a new tool module? Import it in `tools/__init__.py` so its `@mcp.tool()` decorators run on startup.
