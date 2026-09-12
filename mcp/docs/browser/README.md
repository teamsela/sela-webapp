# `tools/browser.py` — Playwright automation

Generic Chromium automation: open/navigate/click/type/screenshot a page, plus Clerk sign-in via sign-in tokens. One browser instance is kept alive across tool calls.

## Tools

| Tool | Purpose |
| --- | --- |
| `browser_open / browser_navigate / browser_get_url` | Open & move around pages. |
| `browser_click / browser_type / browser_wait_for / browser_get_text` | Interact with elements. |
| `browser_run_init / browser_screenshot` | Start a screenshot run folder and capture PNGs under `local/`. |
| `browser_auth_clerk` | Sign in via a Clerk sign-in token. |
| `browser_close` | Tear down the browser. |

## Usage

`browser_run_init` → `browser_open` → interact → `browser_screenshot` → `browser_close`.

See [`SETUP.md`](SETUP.md) for prerequisites.
