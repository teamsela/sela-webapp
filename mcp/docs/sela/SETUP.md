# `tools/sela.py` — Setup

## Dependencies

Same as `browser.py` (Playwright + Chromium + `CLERK_SECRET_KEY`).

## Verify

```powershell
python mcp/_run_test.py
```

## Usage

See the docstring at the top of `tools/sela.py` for a full example flow; or run `mcp/_run_test.py`.

## Notes

`SOUND_PALETTE` mirrors `src/lib/hebrewHighlights.ts` exactly so verification can assert exact colors. The LanguageSwitcher dropdown opens only via each button's chevron span.
