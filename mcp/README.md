# Sela Webapp — MCP Server

A [FastMCP](https://github.com/jlowin/fastmcp) server that exposes development
and product tooling for the `sela-webapp` repo to AI coding assistants
(GitHub Copilot CLI, Claude Code, Codex, etc.).

The server is launched over **stdio** via `mcp/server.py` (see `.mcp.json` at the
repo root). On import it auto-loads every module in `tools/`, each of which
registers tools (and, for `requirements.py`, a prompt / slash command) on a
shared FastMCP instance.

```
mcp/
├── server.py            # entrypoint: starts the FastMCP stdio server
├── _app.py              # shared FastMCP instance + subprocess helpers
├── _run_test.py         # ad-hoc end-to-end runner for the Sela browser tests
├── requirements.txt     # Python dependencies
├── README.md            # this file
├── SETUP.md             # how to install & run the server
├── docs/                # per-script README.md + SETUP.md
└── tools/
    ├── repo.py          # browse & read repo source files
    ├── code_quality.py  # tsc type-check + eslint lint
    ├── git.py           # branch switch, pull/merge main, conflict resolution
    ├── github.py        # draft PRs + Vercel preview checks
    ├── browser.py       # Playwright browser automation (Clerk auth, screenshots)
    ├── sela.py          # high-level Sela E2E flows (sound/letter + Wordplay)
    └── requirements.py  # PDF → requirements extraction (/sela-extract-reqs)
```

## Capabilities at a glance

| Script | What it gives the assistant |
| --- | --- |
| `tools/repo.py` | `repo_info`, `read_source_file`, `list_source_files` |
| `tools/code_quality.py` | `run_type_check`, `run_lint` |
| `tools/git.py` | branch switching, `git_pull_merge_main`, merge continue/abort |
| `tools/github.py` | `create_draft_pr`, `check_pr`, Vercel preview helpers |
| `tools/browser.py` | open/navigate/click/screenshot a Chromium page, Clerk sign-in |
| `tools/sela.py` | Sela-specific study creation + Sound/Letter and Wordplay acceptance tests |
| `tools/requirements.py` | parse a PDF, render pages, split out relevant pages, write requirements markdown; invoked by natural language (and exposes a `sela-extract-reqs` MCP prompt) |

## Running the PDF → requirements workflow

> **How to invoke it in GitHub Copilot CLI:** Copilot CLI's `/` slash commands are
> a **fixed built-in set** — MCP servers contribute **tools**, not slash commands.
> So there is no `/sela-extract-reqs` command in Copilot CLI. Instead, invoke it
> with **natural language**, which triggers the MCP tools:
>
> ```
> Extract requirements from @local/Sela Mockup - 2026.pdf for Wordplay
> ```
> or, with an absolute path:
> ```
> Run extract_requirements_from_pdf on "C:\path\Sela Mockup - 2026.pdf" with context "Wordplay", then write the requirements doc.
> ```
>
> The `sela-extract-reqs` **MCP prompt** (below) is still exposed for MCP clients
> that surface prompts as slash commands (e.g. Claude Code, VS Code's MCP
> integration) — there it appears as `/sela-extract-reqs`.

Point the assistant at a PDF (e.g. a product mockup deck) and a topic. It will
parse the deck, find the pages relevant to the topic, extract them into a focused
PDF + page images, and generate **requirements / planning markdown for review**.

> It is planning-only by design — it never implements application code.

See [`docs/requirements/README.md`](docs/requirements/README.md) for the full
workflow and the tools it uses.

## Getting started

See [`SETUP.md`](SETUP.md) for installation and how to register the server with
your assistant. Each script also has its own `docs/<script>/README.md` (what it
does) and `docs/<script>/SETUP.md` (prerequisites & usage).
