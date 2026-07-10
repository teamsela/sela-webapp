# `_run_test.py` — ad-hoc Sela E2E runner

A standalone script (not an MCP tool) that runs the Sela browser end-to-end flows from `tools/sela.py` against a Vercel preview with optional live-browser inspection.

## Usage

Set `SELA_PREVIEW_URL` and `SELA_TEST_EMAIL`, then run `python mcp/_run_test.py --suite wordplay`. Use `--suite all` for every flow or `--keep-open` for a live demo.

See [`SETUP.md`](SETUP.md) for prerequisites.
