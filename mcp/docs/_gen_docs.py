"""One-off generator for mcp/docs/<script>/{README,SETUP}.md.

Run from the mcp/ directory:  python docs/_gen_docs.py
Idempotent — overwrites the generated per-script docs each run.
(The `requirements` script docs are authored by hand and skipped here.)
"""
from pathlib import Path

DOCS = Path(__file__).parent

SCRIPTS = {
    "server": {
        "title": "server.py — MCP entrypoint",
        "summary": "The stdio entrypoint. Puts `mcp/` on `sys.path`, imports the "
                   "shared FastMCP instance from `_app`, imports `tools` (which "
                   "registers every tool/prompt as a side effect), then calls "
                   "`mcp.run()`.",
        "tools": [],
        "usage": "Launched automatically by your assistant via `.mcp.json` "
                 "(`python mcp/server.py`). Run it directly only to smoke-test "
                 "that the server starts.",
        "deps": "All of `mcp/requirements.txt` (it loads every tool module).",
        "verify": 'python -c "import sys; sys.path.insert(0,\'mcp\'); '
                  'from _app import mcp; import tools; print(\'OK\')"',
        "notes": "Adding a new tool module? Import it in `tools/__init__.py` so its "
                 "`@mcp.tool()` decorators run on startup.",
    },
    "_app": {
        "title": "_app.py — shared FastMCP instance & helpers",
        "summary": "Creates the single `FastMCP(\"sela-webapp\")` instance every "
                   "tool module imports, plus subprocess helpers. `REPO_ROOT` is "
                   "the resolved repo root used for all file and command operations.",
        "tools": [],
        "usage": "Imported by every tool module: `from _app import REPO_ROOT, mcp` "
                 "(and `_run`, `_current_branch` where needed).",
        "deps": "`fastmcp`.",
        "verify": 'python -c "import sys; sys.path.insert(0,\'mcp\'); '
                  'from _app import mcp, REPO_ROOT; print(REPO_ROOT)"',
        "notes": "`_run(cmd, cwd, timeout, extra_env)` never raises — it returns "
                 "`(returncode, stdout, stderr)`, so tools can surface errors as "
                 "strings instead of crashing the server.",
    },
    "_run_test": {
        "title": "_run_test.py — ad-hoc Sela E2E runner",
        "summary": "A standalone script (not an MCP tool) that runs the Sela "
                   "browser end-to-end flows from `tools/sela.py` against a Vercel "
                   "preview with optional live-browser inspection.",
        "tools": [],
        "usage": "Set `SELA_PREVIEW_URL` and `SELA_TEST_EMAIL`, then run "
                 "`python mcp/_run_test.py --suite wordplay`. Use `--suite all` "
                 "for every flow or `--keep-open` for a live demo.",
        "deps": "`playwright` (+ `python -m playwright install chromium`), and a "
                "valid `CLERK_SECRET_KEY` for sign-in.",
        "verify": "python mcp/_run_test.py --suite wordplay",
        "notes": "This is a developer convenience harness; CI does not run it.",
    },
    "repo": {
        "title": "tools/repo.py — repo navigation",
        "summary": "Browse and read source files in the repo so the assistant can "
                   "inspect code without shell access.",
        "tools": [
            ("repo_info()", "Repo root path + a checklist of key source files."),
            ("read_source_file(path)", "Read a file (path relative to repo root). "
                                       "Refuses paths outside the repo."),
            ("list_source_files(glob_pattern='src/**/*.ts')", "List files matching "
                                                              "a glob."),
        ],
        "usage": "Call `repo_info` first to orient, then `read_source_file` / "
                 "`list_source_files` to navigate.",
        "deps": "None beyond `fastmcp`.",
        "verify": 'python -c "import sys; sys.path.insert(0,\'mcp\'); '
                  'from tools.repo import repo_info; print(repo_info())"',
        "notes": "Paths are sandboxed to `REPO_ROOT` for safety.",
    },
    "code_quality": {
        "title": "tools/code_quality.py — type-check & lint",
        "summary": "Runs the project's TypeScript and ESLint checks and returns the "
                   "results as text.",
        "tools": [
            ("run_type_check()", "`npx tsc --noEmit` — reports type errors."),
            ("run_lint()", "`npm run lint` (next lint) — reports lint issues."),
        ],
        "usage": "Run after making code changes, before opening a PR.",
        "deps": "Node.js + project `npm install` already done (uses `npx`/`npm`).",
        "verify": "From the repo root: `npx tsc --noEmit` and `npm run lint`.",
        "notes": "Both tools have a 120s timeout; large changes may need a manual "
                 "`npm run build`.",
    },
    "git": {
        "title": "tools/git.py — git workflow",
        "summary": "Branch switching plus pulling/merging `main` and resolving merge "
                   "conflicts from within the assistant.",
        "tools": [
            ("git_list_branches()", "List local + origin branches."),
            ("git_checkout_branch(branch)", "Fetch and switch (creates a tracking "
                                            "branch if needed)."),
            ("git_pull_merge_main()", "Merge origin/main; on conflict leaves the "
                                      "repo conflicted with a report."),
            ("git_merge_continue()", "Commit the merge once markers are resolved."),
            ("git_merge_abort()", "Abort an in-progress merge."),
        ],
        "usage": "On a conflict from `git_pull_merge_main`, read each conflicted "
                 "file, edit out the markers, then `git_merge_continue`.",
        "deps": "`git` on PATH.",
        "verify": 'python -c "import sys; sys.path.insert(0,\'mcp\'); '
                  'from tools.git import git_list_branches; print(git_list_branches())"',
        "notes": "Never force-pushes or rewrites history.",
    },
    "github": {
        "title": "tools/github.py — PRs & Vercel previews",
        "summary": "Create draft PRs and find a branch's Vercel preview deployment "
                   "via the GitHub CLI.",
        "tools": [
            ("check_pr(branch='')", "Report whether a PR exists for a branch."),
            ("create_draft_pr(title='', body='', base='main')", "Idempotently "
                "create a draft PR for the current branch."),
            ("check_vercel_deployment(branch='')", "Report the Vercel preview URL "
                "and check status."),
            ("open_vercel_preview(branch='')", "Open the preview URL in a browser."),
        ],
        "usage": "Create a branch, push, `create_draft_pr`, then "
                 "`check_vercel_deployment` until the preview URL appears.",
        "deps": "`gh` (GitHub CLI) authenticated on PATH.",
        "verify": "gh auth status",
        "notes": "Does not need a Vercel API token — it scrapes the Vercel bot's PR "
                 "comment for the preview URL.",
    },
    "browser": {
        "title": "tools/browser.py — Playwright automation",
        "summary": "Generic Chromium automation: open/navigate/click/type/screenshot "
                   "a page, plus Clerk sign-in via sign-in tokens. One browser "
                   "instance is kept alive across tool calls.",
        "tools": [
            ("browser_open / browser_navigate / browser_get_url", "Open & move "
                "around pages."),
            ("browser_click / browser_type / browser_wait_for / browser_get_text",
                "Interact with elements."),
            ("browser_run_init / browser_screenshot", "Start a screenshot run "
                "folder and capture PNGs under `local/`."),
            ("browser_auth_clerk", "Sign in via a Clerk sign-in token."),
            ("browser_close", "Tear down the browser."),
        ],
        "usage": "`browser_run_init` → `browser_open` → interact → "
                 "`browser_screenshot` → `browser_close`.",
        "deps": "`playwright` + `python -m playwright install chromium`; "
                "`CLERK_SECRET_KEY` for auth.",
        "verify": "python -m playwright install chromium",
        "notes": "Screenshots are written under `local/` (git-ignored).",
    },
    "sela": {
        "title": "tools/sela.py — Sela app E2E flows",
        "summary": "High-level, Sela-specific browser flows built on `browser.py`: "
                   "create studies and exercise the Sound/Letter Distribution and "
                   "Wordplay features with deterministic verification.",
        "tools": [
            ("sela_auth / sela_create_study / sela_open_or_create_study",
                "Sign in and open/create a study."),
            ("sela_set_language_parallel / "
                "sela_set_language_parallel_transliteration / "
                "sela_open_sounds_tab / sela_open_wordplay_tab",
                "Set up the passage view."),
            ("sela_select_sound_chips / sela_select_letter_chips / "
                "sela_smart_highlight / sela_clear_highlight", "Drive highlighting."),
            ("sela_run_test / sela_test_distribution_counts / "
                "sela_test_letter_tooltip / sela_verify_*", "End-to-end test flows "
                "with PASS/FAIL output."),
            ("sela_test_wordplay", "Psalm 88 acceptance flow for real lexical/sound "
                "candidates, pair-only highlighting, exact colors, controls, "
                "tooltip, and screenshots."),
        ],
        "usage": "Set `SELA_PREVIEW_URL` and `SELA_TEST_EMAIL`, then run "
                 "`python mcp/_run_test.py --suite wordplay`. Use `--suite all` "
                 "for every flow or `--keep-open` for a live demo.",
        "deps": "Same as `browser.py` (Playwright + Chromium + `CLERK_SECRET_KEY`).",
        "verify": "python mcp/_run_test.py --suite wordplay",
        "notes": "`SOUND_PALETTE` mirrors `src/lib/hebrewHighlights.ts` exactly so "
                 "verification can assert exact colors. The LanguageSwitcher "
                 "dropdown opens only via each button's chevron span.",
    },
}

README_TMPL = """# `{path}` — {short}

{summary}
{tools_section}
## Usage

{usage}

See [`SETUP.md`](SETUP.md) for prerequisites.
"""

SETUP_TMPL = """# `{path}` — Setup

## Dependencies

{deps}

## Verify

```powershell
{verify}
```

## Usage

{usage}

## Notes

{notes}
"""


def _path_for(name: str) -> str:
    return f"{name}.py" if name in {"server", "_app", "_run_test"} else f"tools/{name}.py"


def _tools_section(tools: list[tuple[str, str]]) -> str:
    if not tools:
        return ""
    rows = "\n".join(f"| `{sig}` | {desc} |" for sig, desc in tools)
    return "\n## Tools\n\n| Tool | Purpose |\n| --- | --- |\n" + rows + "\n"


def main() -> None:
    for name, cfg in SCRIPTS.items():
        path = _path_for(name)
        short = cfg["title"].split("—", 1)[-1].strip()
        readme = README_TMPL.format(
            path=path,
            short=short,
            summary=cfg["summary"],
            tools_section=_tools_section(cfg["tools"]),
            usage=cfg["usage"],
        )
        setup = SETUP_TMPL.format(
            path=path,
            deps=cfg["deps"],
            verify=cfg["verify"],
            usage=cfg["usage"],
            notes=cfg["notes"],
        )
        folder = DOCS / name
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "README.md").write_text(readme, encoding="utf-8")
        (folder / "SETUP.md").write_text(setup, encoding="utf-8")
        print(f"wrote docs/{name}/README.md + SETUP.md")


if __name__ == "__main__":
    main()
