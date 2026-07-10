# `tools/sela.py` — Setup

## Dependencies

Same as `browser.py` (Playwright + Chromium + `CLERK_SECRET_KEY`).

## Verify

```powershell
python mcp/_run_test.py --suite wordplay
```

## Usage

Set `SELA_PREVIEW_URL` and `SELA_TEST_EMAIL`, then run `python mcp/_run_test.py --suite wordplay`. Use `--suite all` for every flow or `--keep-open` for a live demo.

## Notes

`SOUND_PALETTE` mirrors `src/lib/hebrewHighlights.ts` exactly so verification can assert exact colors. The LanguageSwitcher dropdown opens only via each button's chevron span.
