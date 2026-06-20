# `_run_test.py` — ad-hoc Sela E2E runner

A standalone script (not an MCP tool) that runs the Sela browser end-to-end flows from `tools/sela.py` against a Vercel preview and leaves the browser open for inspection.

## Usage

Edit the `PREVIEW` and `EMAIL` constants at the top, then run `python mcp/_run_test.py`. Press Ctrl+C to exit.

See [`SETUP.md`](SETUP.md) for prerequisites.
