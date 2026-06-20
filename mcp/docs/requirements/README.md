# `tools/requirements.py` — PDF → Requirements extraction

Turns an uploaded PDF (e.g. a product mockup / design deck) into review material
and **requirements / planning markdown**.

> **Planning only.** These tools never implement application code. Their only
> outputs are page images, a focused PDF, and requirements markdown for review.

## How to invoke

**GitHub Copilot CLI** does not turn MCP prompts into `/` slash commands (its
slash commands are a fixed built-in set). Invoke the workflow with **natural
language**, which triggers the MCP tools:

```
Extract requirements from @local/Sela Mockup - 2026.pdf for Wordplay
```

or explicitly:

```
Run extract_requirements_from_pdf on "C:\path\deck.pdf" with context "Wordplay",
review the pages, then write the requirements doc.
```

This module also registers a `sela-extract-reqs` **MCP prompt**. In MCP clients
that surface prompts as slash commands (Claude Code, VS Code's MCP integration)
it appears as `/sela-extract-reqs pdf_path=… context=…`.

## Workflow

1. **`extract_requirements_from_pdf(pdf_path, context, dpi=150)`** — mechanical
   pre-processing. Creates a timestamped work folder under `local/reqs/` with:
   - `page-001.png … page-NNN.png` — one rendered image per page
   - `text.txt` — extracted text for every page
   - `manifest.json` — machine-readable index (source, context, page count, files)
   - `INDEX.md` — a human/LLM starting point restating the task
2. The assistant **`view`s the page images** / reads `text.txt` and decides which
   pages are relevant to `context`.
3. **`pdf_extract_pages(pdf_path, "4,7-9")`** — writes a NEW focused PDF with just
   those pages. (Optionally **`pdf_render_images(..., dpi=220)`** for hi-res detail.)
4. **`write_requirements_doc(content, work_folder=...)`** — saves `REQUIREMENTS.md`
   into the work folder.

## Tools

| Tool | Purpose |
| --- | --- |
| `pdf_info(pdf_path, preview_chars=240)` | Page count, metadata, per-page text preview. Use first to scan relevance. |
| `pdf_extract_text(pdf_path, pages="", out_path="")` | Full text of all/selected pages. |
| `pdf_render_images(pdf_path, pages="", out_dir="", dpi=150)` | Render pages to PNGs for visual review. |
| `pdf_extract_pages(pdf_path, pages, out_path="")` | Write a new PDF of only the selected pages. |
| `extract_requirements_from_pdf(pdf_path, context="", dpi=150)` | Orchestrator: build the work folder (images + text + manifest + INDEX). |
| `write_requirements_doc(content, out_path="", work_folder="")` | Persist the requirements markdown. |

### Page specs

Tools that take `pages` accept a 1-based spec: `"1,3,5-7"`. An empty spec means
**all pages** (except `pdf_extract_pages`, where `pages` is required).

### Paths & output

- `pdf_path` may be absolute or relative to the repo root.
- All generated artifacts land under `local/reqs/` (git-ignored), in a folder
  named `<timestamp>_<pdf-stem>-<context-slug>`.

## Suggested `REQUIREMENTS.md` structure

- **Overview** — what feature/area the relevant pages describe.
- **Functional requirements** — numbered, testable statements.
- **Non-functional / UX requirements** — performance, accessibility, design.
- **Open questions & assumptions.**
- **Suggested scope & plan** — phased, planning only (no code).

See [`SETUP.md`](SETUP.md) for dependencies.
