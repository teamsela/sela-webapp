# `_run_test.py` — Setup

## Dependencies

`playwright` (+ `python -m playwright install chromium`), and a valid `CLERK_SECRET_KEY` for sign-in.

## Verify

```powershell
python mcp/_run_test.py  # opens a browser and runs the flows
```

## Usage

Edit the `PREVIEW` and `EMAIL` constants at the top, then run `python mcp/_run_test.py`. Press Ctrl+C to exit.

## Notes

This is a developer convenience harness; CI does not run it.
