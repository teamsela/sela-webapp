# `server.py` — MCP entrypoint

The stdio entrypoint. Puts `mcp/` on `sys.path`, imports the shared FastMCP instance from `_app`, imports `tools` (which registers every tool/prompt as a side effect), then calls `mcp.run()`.

## Usage

Launched automatically by your assistant via `.mcp.json` (`python mcp/server.py`). Run it directly only to smoke-test that the server starts.

See [`SETUP.md`](SETUP.md) for prerequisites.
