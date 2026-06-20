# `tools/browser.py` — Setup

## Dependencies

`playwright` + `python -m playwright install chromium`; `CLERK_SECRET_KEY` for auth.

## Verify

```powershell
python -m playwright install chromium
```

## Usage

`browser_run_init` → `browser_open` → interact → `browser_screenshot` → `browser_close`.

## Notes

Screenshots are written under `local/` (git-ignored).
