# `_run_test.py` — Setup

## Dependencies

`playwright` (+ `python -m playwright install chromium`), and a valid `CLERK_SECRET_KEY` for sign-in.

## Verify

```powershell
python mcp/_run_test.py --suite wordplay
```

## Usage

Set `SELA_PREVIEW_URL` and `SELA_TEST_EMAIL`, then run `python mcp/_run_test.py --suite wordplay`. Use `--suite all` for every flow or `--keep-open` for a live demo.

## Notes

This is a developer convenience harness; CI does not run it.
