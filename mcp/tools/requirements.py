"""PDF → requirements extraction tools.

These tools turn an uploaded PDF (e.g. a product mockup / design deck) into
material the LLM can reason over, then help it produce **planning / requirements
markdown for review**. They are deliberately mechanical: the LLM decides which
pages are relevant and writes the requirements — these tools only parse, render,
split, and persist.

Typical flow (also available via the `sela-extract-reqs` MCP prompt, which MCP
clients that support prompts expose as `/sela-extract-reqs`; in GitHub Copilot CLI
invoke it with natural language instead — Copilot CLI does not surface MCP prompts
as slash commands):
    1. extract_requirements_from_pdf(pdf, context="Wordplay")
         -> creates a timestamped work folder with one PNG per page,
            a per-page text dump, and a manifest.json + INDEX.md.
    2. The LLM `view`s the page images / reads the text, decides which pages
       are relevant to the requested topic/context.
    3. pdf_extract_pages(pdf, "4,7-9", ...) -> a focused PDF of just those pages.
    4. pdf_render_images(pdf, "4,7-9", ...) -> high-res images of those pages.
    5. write_requirements_doc(...) -> save the generated requirements markdown.

IMPORTANT: This toolset never implements application code. Its only output is
review material (images, a focused PDF) and requirements/planning markdown.
"""

import json
import re
from datetime import datetime
from pathlib import Path

from _app import REPO_ROOT, mcp

# All extraction output lands under <repo>/local/reqs/ so it sits beside the
# existing browser screenshot runs and stays out of the committed source tree.
REQS_BASE = REPO_ROOT / "local" / "reqs"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resolve_pdf(pdf_path: str) -> tuple[Path | None, str]:
    """Resolve a user-supplied PDF path to an existing file.

    Accepts absolute paths or paths relative to the repo root. Returns
    (path, error); error is empty on success.
    """
    if not pdf_path or not pdf_path.strip():
        return None, "No pdf_path provided."
    raw = pdf_path.strip().strip('"').strip("'")
    candidate = Path(raw)
    if not candidate.is_absolute():
        candidate = (REPO_ROOT / raw).resolve()
    if not candidate.exists():
        return None, f"PDF not found: {pdf_path}"
    if candidate.suffix.lower() != ".pdf":
        return None, f"Not a PDF file: {pdf_path}"
    return candidate, ""


def _parse_page_spec(spec: str, page_count: int) -> tuple[list[int], str]:
    """Parse a 1-based page spec like '1,3,5-7' into a sorted 0-based index list.

    Empty spec selects all pages. Returns (indices, error).
    """
    if not spec or not spec.strip():
        return list(range(page_count)), ""
    indices: set[int] = set()
    for chunk in spec.replace(" ", "").split(","):
        if not chunk:
            continue
        if "-" in chunk:
            lo_s, _, hi_s = chunk.partition("-")
            if not lo_s.isdigit() or not hi_s.isdigit():
                return [], f"Invalid page range: '{chunk}'"
            lo, hi = int(lo_s), int(hi_s)
            if lo > hi:
                lo, hi = hi, lo
            for p in range(lo, hi + 1):
                indices.add(p - 1)
        else:
            if not chunk.isdigit():
                return [], f"Invalid page number: '{chunk}'"
            indices.add(int(chunk) - 1)
    valid = sorted(i for i in indices if 0 <= i < page_count)
    if not valid:
        return [], f"No valid pages in '{spec}' (document has {page_count} pages)."
    return valid, ""


def _slugify(text: str, default: str = "reqs") -> str:
    """Make a filesystem-safe slug from arbitrary text."""
    keep = [c.lower() if c.isalnum() else "-" for c in (text or "")]
    slug = "".join(keep).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return (slug or default)[:48]


def _new_work_folder(label: str) -> Path:
    """Create and return a fresh timestamped work folder under local/reqs/."""
    stamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    folder = REQS_BASE / f"{stamp}_{_slugify(label)}"
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def _safe_out_path(out_path: str, default_name: str, work_folder: Path) -> Path:
    """Resolve an output path, defaulting into the given work folder."""
    if not out_path or not out_path.strip():
        return work_folder / default_name
    raw = out_path.strip().strip('"').strip("'")
    candidate = Path(raw)
    if not candidate.is_absolute():
        candidate = (work_folder / raw).resolve()
    candidate.parent.mkdir(parents=True, exist_ok=True)
    return candidate


def _requirements_doc_issues(content: str) -> list[str]:
    """Return structural issues that make a requirements document unsafe to use."""
    lower = content.lower()
    required_sections = {
        "source traceability": ("source traceability", "traceability matrix"),
        "acceptance criteria": ("acceptance criteria",),
        "conflicts/ambiguities": ("conflict", "ambigu"),
        "open questions": ("open question",),
    }
    issues = [
        f"missing {label} section"
        for label, markers in required_sections.items()
        if not any(marker in lower for marker in markers)
    ]

    if "[explicit]" not in lower:
        issues.append("no [EXPLICIT] source classification")
    if not re.search(r"\bp(?:age)?\s*\d+\b", lower):
        issues.append("no page-level source citations")

    traceability_terms = ("classification", "source", "evidence")
    if "traceability" in lower and not all(term in lower for term in traceability_terms):
        issues.append("traceability section must identify classification, source, and evidence")
    return issues


def _requirements_prompt_text(pdf_path: str, context: str = "") -> str:
    focus = context.strip() or "(no specific topic given — summarise the whole deck)"
    return f"""You are extracting **requirements** from a PDF. Produce planning
material for review. **Do NOT implement any application code, edit src/, or open
PRs.** Your only outputs are review images, a focused PDF, and requirements markdown.

Inputs:
- PDF: `{pdf_path}`
- Focus / context: {focus}

Follow these steps using the MCP tools:

1. Call `extract_requirements_from_pdf("{pdf_path}", "{context}")`. This renders
   every page to an image, dumps the text, and creates a work folder.
2. Review the page images as the authoritative source. Use `text.txt` only as a
   search aid: it loses columns, indentation, RTL order, color, and emphasis.
3. Build a per-feature cross-reference before writing. For every repeated feature
   label, compare all pages where it appears. Record differing lists, terminology,
   hierarchy, thresholds, or examples as conflicts rather than merging them.
4. Identify the relevant pages and call
   `pdf_extract_pages("{pdf_path}", "<relevant pages>")`. Render important pages
   at higher DPI when hierarchy, color, or small annotations affect meaning.
5. Write `REQUIREMENTS.md` with these mandatory sections:
   - **Overview**
   - **Source traceability matrix** — ID, classification, source page, short
     verbatim evidence/visual description, and requirement or question.
   - **Confirmed functional requirements** — only `[EXPLICIT]` source statements.
   - **Acceptance criteria** — observable checks mapped to confirmed requirement IDs.
   - **Source conflicts and undefined labels**
   - **Open questions and assumptions**
   - **Non-functional / UX requirements**
   - **Suggested scope and plan** — planning only, no code.

Classification rules:
- `[EXPLICIT]`: directly stated or unambiguously depicted; include `(pNN)`.
- `[INFERRED]`: reasoned from context, never a confirmed functional requirement.
- `[UNDEFINED]`: a label/control exists but its algorithm or behavior is absent.
- `[CONFLICT]`: pages disagree in terminology, hierarchy, lists, or semantics.

Never invent an algorithm for a UX label. Never flatten sub-bullets into peers.
Flag placeholder/draft/problem slides as acknowledged open problems. Preserve
source wording; if you normalize terminology or transliteration, show the original.
When an unresolved decision changes implementation semantics, mark the feature
not implementation-ready rather than choosing a behavior.

6. Call `validate_requirements_doc(content)` and resolve every reported issue.
7. Save the validated document with
   `write_requirements_doc(content, work_folder=...)`.
8. Report the work folder, relevant pages, conflicts, undefined labels, and
   implementation-readiness status. Remind the user that nothing was implemented.
"""


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
def pdf_info(pdf_path: str, preview_chars: int = 240) -> str:
    """Inspect a PDF: page count, metadata, and a short text preview per page.

    Use this first to get an overview of the document and decide which pages
    are worth rendering or extracting for a given topic.

    Args:
        pdf_path: Path to the PDF (absolute, or relative to the repo root).
        preview_chars: Characters of text to preview per page (default 240).
    """
    path, err = _resolve_pdf(pdf_path)
    if err:
        return f"ERROR: {err}"
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return "ERROR: PyMuPDF not installed. Run: pip install -r mcp/requirements.txt"

    try:
        doc = fitz.open(str(path))
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not open PDF: {exc}"

    try:
        meta = doc.metadata or {}
        lines = [
            f"PDF: {path}",
            f"Pages: {doc.page_count}",
            f"Title: {meta.get('title') or '(none)'}",
            f"Author: {meta.get('author') or '(none)'}",
            "",
            "Per-page text preview:",
        ]
        for i in range(doc.page_count):
            text = " ".join(doc.load_page(i).get_text().split())
            preview = text[:preview_chars]
            if len(text) > preview_chars:
                preview += " …"
            lines.append(f"  p{i + 1}: {preview or '(no extractable text — likely an image/mockup)'}")
        return "\n".join(lines)
    finally:
        doc.close()


@mcp.tool()
def pdf_extract_text(pdf_path: str, pages: str = "", out_path: str = "") -> str:
    """Extract the full text of all or selected PDF pages.

    Args:
        pdf_path: Path to the PDF (absolute, or relative to the repo root).
        pages: 1-based page spec like '1,3,5-7'. Empty = all pages.
        out_path: Optional path to write the text to. When omitted the text is
            returned inline (and also saved into a work folder under local/reqs/).
    """
    path, err = _resolve_pdf(pdf_path)
    if err:
        return f"ERROR: {err}"
    try:
        import fitz
    except ImportError:
        return "ERROR: PyMuPDF not installed. Run: pip install -r mcp/requirements.txt"

    try:
        doc = fitz.open(str(path))
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not open PDF: {exc}"

    try:
        idxs, perr = _parse_page_spec(pages, doc.page_count)
        if perr:
            return f"ERROR: {perr}"
        blocks = []
        for i in idxs:
            text = doc.load_page(i).get_text().strip()
            blocks.append(f"===== Page {i + 1} =====\n{text or '(no extractable text)'}")
        body = "\n\n".join(blocks)
    finally:
        doc.close()

    work = _new_work_folder(f"{path.stem}-text")
    target = _safe_out_path(out_path, "text.txt", work)
    try:
        target.write_text(body, encoding="utf-8")
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not write text file: {exc}"

    return f"Extracted text from {len(idxs)} page(s) -> {target}\n\n{body}"


@mcp.tool()
def pdf_render_images(
    pdf_path: str,
    pages: str = "",
    out_dir: str = "",
    dpi: int = 150,
) -> str:
    """Render PDF pages to PNG images so they can be viewed/reviewed.

    For mockup/design PDFs the visual layout matters more than the text, so
    rendering pages to images lets the LLM `view` each slide and judge relevance.

    Args:
        pdf_path: Path to the PDF (absolute, or relative to the repo root).
        pages: 1-based page spec like '1,3,5-7'. Empty = all pages.
        out_dir: Output directory. Defaults to a timestamped folder under local/reqs/.
        dpi: Render resolution (default 150; use 200-300 for fine detail).
    """
    path, err = _resolve_pdf(pdf_path)
    if err:
        return f"ERROR: {err}"
    try:
        import fitz
    except ImportError:
        return "ERROR: PyMuPDF not installed. Run: pip install -r mcp/requirements.txt"

    dpi = max(72, min(int(dpi or 150), 400))
    try:
        doc = fitz.open(str(path))
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not open PDF: {exc}"

    try:
        idxs, perr = _parse_page_spec(pages, doc.page_count)
        if perr:
            return f"ERROR: {perr}"
        work = Path(out_dir).resolve() if out_dir else _new_work_folder(f"{path.stem}-images")
        work.mkdir(parents=True, exist_ok=True)
        written: list[str] = []
        for i in idxs:
            pix = doc.load_page(i).get_pixmap(dpi=dpi)
            img_path = work / f"page-{i + 1:03d}.png"
            pix.save(str(img_path))
            written.append(str(img_path))
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not render images: {exc}"
    finally:
        doc.close()

    listing = "\n".join(f"  {p}" for p in written)
    return f"Rendered {len(written)} page image(s) at {dpi} dpi -> {work}\n{listing}"


@mcp.tool()
def pdf_extract_pages(pdf_path: str, pages: str, out_path: str = "") -> str:
    """Write a NEW PDF containing only the selected pages.

    Use this once you've identified the pages relevant to a topic, to produce a
    focused, separate PDF for review.

    Args:
        pdf_path: Path to the source PDF (absolute, or relative to repo root).
        pages: 1-based page spec like '4,7-9'. Required (cannot be empty).
        out_path: Output PDF path. Defaults to a timestamped folder under local/reqs/.
    """
    path, err = _resolve_pdf(pdf_path)
    if err:
        return f"ERROR: {err}"
    if not pages or not pages.strip():
        return "ERROR: 'pages' is required (e.g. '4,7-9'). Use pdf_info to choose pages."
    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        return "ERROR: pypdf not installed. Run: pip install -r mcp/requirements.txt"

    try:
        reader = PdfReader(str(path))
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not open PDF: {exc}"

    idxs, perr = _parse_page_spec(pages, len(reader.pages))
    if perr:
        return f"ERROR: {perr}"

    work = _new_work_folder(f"{path.stem}-extract")
    target = _safe_out_path(out_path, f"{path.stem}-pages-{_slugify(pages)}.pdf", work)
    writer = PdfWriter()
    for i in idxs:
        writer.add_page(reader.pages[i])
    try:
        with open(target, "wb") as fh:
            writer.write(fh)
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not write PDF: {exc}"

    human_pages = ", ".join(str(i + 1) for i in idxs)
    return f"Extracted {len(idxs)} page(s) [{human_pages}] -> {target}"


@mcp.tool()
def extract_requirements_from_pdf(
    pdf_path: str,
    context: str = "",
    dpi: int = 150,
) -> str:
    """Prepare a PDF for requirements review (mechanical pre-processing step).

    Creates a timestamped work folder under local/reqs/ containing:
      - page-NNN.png  : one rendered image per page (for visual review)
      - text.txt      : extracted text for every page
      - manifest.json : machine-readable index (folder, page count, files, context)
      - INDEX.md      : a human/LLM-readable starting point that restates the task

    This does NOT decide relevance or write requirements — after calling it, the
    LLM should `view` the page images / read text.txt, pick the pages relevant to
    `context`, then call pdf_extract_pages + write_requirements_doc.

    Args:
        pdf_path: Path to the PDF (absolute, or relative to the repo root).
        context: The topic / focus the user cares about (e.g. 'Wordplay'). Saved
            into the manifest and INDEX so the requirements stay scoped.
        dpi: Render resolution for page images (default 150).
    """
    path, err = _resolve_pdf(pdf_path)
    if err:
        return f"ERROR: {err}"
    try:
        import fitz
    except ImportError:
        return "ERROR: PyMuPDF not installed. Run: pip install -r mcp/requirements.txt"

    dpi = max(72, min(int(dpi or 150), 400))
    work = _new_work_folder(f"{path.stem}-{_slugify(context, 'review')}")

    try:
        doc = fitz.open(str(path))
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not open PDF: {exc}"

    images: list[str] = []
    text_blocks: list[str] = []
    try:
        for i in range(doc.page_count):
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=dpi)
            img_path = work / f"page-{i + 1:03d}.png"
            pix.save(str(img_path))
            images.append(img_path.name)
            text = page.get_text().strip()
            text_blocks.append(f"===== Page {i + 1} =====\n{text or '(no extractable text)'}")
        page_count = doc.page_count
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not process PDF: {exc}"
    finally:
        doc.close()

    (work / "text.txt").write_text("\n\n".join(text_blocks), encoding="utf-8")

    manifest = {
        "source_pdf": str(path),
        "context": context,
        "page_count": page_count,
        "dpi": dpi,
        "images": images,
        "text_file": "text.txt",
        "created": datetime.now().isoformat(timespec="seconds"),
    }
    (work / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    focus = context.strip() or "(no specific topic provided — cover the whole deck)"
    index_md = f"""# Requirements review — {path.name}

- **Source PDF:** `{path}`
- **Focus / context:** {focus}
- **Pages:** {page_count}
- **Page images:** `page-001.png` … `page-{page_count:03d}.png`
- **Full text:** `text.txt`

## Next steps (for the LLM — do NOT implement code)

1. `view` each page image in this folder. Use `text.txt` only as a search aid:
   multi-column layout, bullet indentation, RTL order, color, and emphasis are lost.
2. Identify the pages most relevant to **{focus}**.
3. Cross-reference repeated feature labels across all relevant pages. Do not merge
   conflicting lists or terminology; preserve hierarchy and flag undefined labels.
4. Record placeholder/draft/problem slides as acknowledged open problems.
5. `pdf_extract_pages("{path}", "<relevant pages>", ...)` to produce a focused PDF.
6. Write a traceable `REQUIREMENTS.md` using `[EXPLICIT]`, `[INFERRED]`,
   `[UNDEFINED]`, and `[CONFLICT]` classifications, page citations, source evidence,
   acceptance criteria, conflicts, and open questions.
7. Run `validate_requirements_doc(content)`, resolve all issues, then call
   `write_requirements_doc(...)`. **Do not implement application code.**
"""
    (work / "INDEX.md").write_text(index_md, encoding="utf-8")

    listing = "\n".join(f"  {n}" for n in images)
    return (
        f"Prepared requirements review for '{path.name}'\n"
        f"  Context: {focus}\n"
        f"  Work folder: {work}\n"
        f"  Pages rendered: {page_count} (at {dpi} dpi)\n"
        f"  Files: INDEX.md, manifest.json, text.txt\n"
        f"  Page images:\n{listing}\n\n"
        f"NEXT: view the page images, pick the pages relevant to '{focus}', then call "
        f"pdf_extract_pages and write_requirements_doc. Do NOT implement app code."
    )


@mcp.tool()
def validate_requirements_doc(content: str) -> str:
    """Validate that generated requirements are traceable and ambiguity-aware.

    This structural gate cannot prove that an interpretation is correct, but it
    prevents saving documents that omit page evidence, source classifications,
    acceptance criteria, conflicts/ambiguities, or open questions.
    """
    if not content or not content.strip():
        return "ERROR: 'content' is empty — nothing to validate."
    issues = _requirements_doc_issues(content)
    if issues:
        return "FAIL: " + "; ".join(issues)
    return "PASS: requirements document includes traceability and ambiguity controls"


@mcp.tool()
def write_requirements_doc(content: str, out_path: str = "", work_folder: str = "") -> str:
    """Save generated requirements/planning markdown for review.

    This is the final step: persist the markdown the LLM produced from the PDF.
    It writes review material only — it must never contain or trigger application
    code changes.

    Args:
        content: The requirements markdown to write.
        out_path: Target file path. Defaults to REQUIREMENTS.md inside work_folder
            (or a new local/reqs/ folder when work_folder is omitted).
        work_folder: Optional existing work folder (from extract_requirements_from_pdf)
            to place the doc in.
    """
    if not content or not content.strip():
        return "ERROR: 'content' is empty — nothing to write."
    issues = _requirements_doc_issues(content)
    if issues:
        return (
            "ERROR: Requirements document failed validation: "
            + "; ".join(issues)
            + ". Run validate_requirements_doc and correct the document first."
        )

    if work_folder and work_folder.strip():
        wf = Path(work_folder.strip().strip('"').strip("'"))
        if not wf.is_absolute():
            wf = (REPO_ROOT / wf).resolve()
        wf.mkdir(parents=True, exist_ok=True)
    else:
        wf = _new_work_folder("requirements")

    target = _safe_out_path(out_path, "REQUIREMENTS.md", wf)
    if target.suffix.lower() not in (".md", ".markdown", ".txt"):
        return "ERROR: Requirements docs must be markdown/text (.md/.markdown/.txt)."
    try:
        target.write_text(content, encoding="utf-8")
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: Could not write requirements doc: {exc}"
    return f"Wrote requirements doc ({len(content)} chars) -> {target}"


# ---------------------------------------------------------------------------
# Prompt — exposed to clients as the /sela-extract-reqs slash command.
# ---------------------------------------------------------------------------

@mcp.prompt(
    name="sela-extract-reqs",
    title="Extract requirements from a PDF",
    description="Parse an uploaded PDF, find the pages relevant to a topic, "
    "extract them, and generate requirements/planning markdown for review "
    "(planning only — does not implement).",
)
def sela_extract_reqs(pdf_path: str, context: str = "") -> str:
    """Guide the LLM through PDF → requirements extraction without implementing.

    Args:
        pdf_path: Path to the PDF the user uploaded/referenced.
        context: Extra context/topic from the user (e.g. 'Wordplay').
    """
    return _requirements_prompt_text(pdf_path, context)
