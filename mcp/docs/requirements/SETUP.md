# `tools/requirements.py` — Setup

## Dependencies

```powershell
pip install -r mcp/requirements.txt
```

The PDF tools need:

| Package | Why |
| --- | --- |
| `pymupdf` (imported as `fitz`) | text extraction + rendering pages to PNG |
| `pypdf` | splitting selected pages into a new PDF |

No credentials or environment variables are required.

## Verify

```powershell
python -c "import fitz, pypdf; print('pdf deps ok')"
```

## Usage

**In GitHub Copilot CLI**, invoke with natural language (MCP prompts are not
slash commands there):

```
Extract requirements from @local/deck.pdf for Wordplay
```

In MCP clients that expose prompts as slash commands (Claude Code, VS Code):

```
/sela-extract-reqs pdf_path="C:\path\to\deck.pdf" context="Wordplay"
```

Either way the assistant runs these tools:

1. `extract_requirements_from_pdf(pdf_path, context)` → builds a work folder
   under `local/reqs/` with page images, `text.txt`, `manifest.json`, `INDEX.md`.
2. `view` the page images (authoritative) and use `text.txt` only for search.
   Cross-reference repeated labels and preserve columns/bullet hierarchy.
3. `pdf_extract_pages(pdf_path, "4,7-9")` → focused PDF.
4. Classify statements as explicit, inferred, undefined, or conflicting.
5. `validate_requirements_doc(content)` → fix all reported traceability issues.
6. `write_requirements_doc(content, work_folder=...)` → `REQUIREMENTS.md`.

## Output

Everything is written under `local/reqs/` (git-ignored). Nothing in `src/` is
touched — this toolset is planning-only. Documents without source traceability,
acceptance criteria, conflicts/ambiguities, and open questions are rejected.

## Troubleshooting

- **`ERROR: PyMuPDF not installed`** — run the pip install above.
- **`ERROR: PDF not found`** — pass an absolute path, or one relative to the repo
  root; quote paths that contain spaces.
- **Blank/garbled images** — increase `dpi` (e.g. 220–300) in `pdf_render_images`.
