# MCP Server — Setup

How to install and run the `sela-webapp` MCP server so an AI assistant can use
its tools.

## Prerequisites

- **Python 3.10+** (developed against 3.12).
- The repo cloned locally (the server reads/writes files under the repo root).
- For browser tools only: a Chromium build installed by Playwright.

## 1. Install Python dependencies

From the repo root:

```powershell
pip install -r mcp/requirements.txt
```

This installs:

| Package | Used by |
| --- | --- |
| `fastmcp` | the server itself (`_app.py`, all tools) |
| `playwright` | `tools/browser.py`, `tools/sela.py` |
| `pypdf` | `tools/requirements.py` (splitting PDFs) |
| `pymupdf` | `tools/requirements.py` (text extraction + page rendering) |

### Browser tools (optional)

If you plan to use the browser / Sela E2E tools, install the Chromium binary:

```powershell
python -m playwright install chromium
```

## 2. Register the server with your assistant

The repo ships a ready-to-use config at `.mcp.json`:

```json
{
  "mcpServers": {
    "sela-webapp": {
      "type": "stdio",
      "command": "python",
      "args": ["mcp/server.py"]
    }
  }
}
```

- **GitHub Copilot CLI / Claude Code** pick this up automatically when run from
  the repo root.
- For other clients, point them at `python mcp/server.py` as a stdio MCP server.

## 3. Verify it loads

```powershell
python -c "import sys; sys.path.insert(0,'mcp'); from _app import mcp; import tools; print('OK')"
```

You should see `OK` with no traceback.

## 4. Environment variables

Some tools read credentials from the repo `.env` / `.env.local`:

- `CLERK_SECRET_KEY` — required by the browser auth tools (`browser_auth_clerk`,
  `sela_auth`) to mint Clerk sign-in tokens.

The PDF / requirements tools (`tools/requirements.py`) need **no** credentials.

## Output locations

- Browser screenshots and requirements review folders are written under
  `local/` (which is git-ignored). Requirements runs land in `local/reqs/`.

## Per-script docs

Each script has focused docs under `docs/`:

- `docs/<script>/README.md` — what the script does and its tools.
- `docs/<script>/SETUP.md` — prerequisites and how to invoke it.
