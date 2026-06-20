# `tools/sela.py` — Sela app E2E flows

High-level, Sela-specific browser flows built on `browser.py`: create studies and exercise the Sound/Letter Distribution highlight features with deterministic verification.

## Tools

| Tool | Purpose |
| --- | --- |
| `sela_auth / sela_create_study / sela_open_or_create_study` | Sign in and open/create a study. |
| `sela_set_language_parallel / sela_open_sounds_tab` | Set up the passage view. |
| `sela_select_sound_chips / sela_select_letter_chips / sela_smart_highlight / sela_clear_highlight` | Drive highlighting. |
| `sela_run_test / sela_test_distribution_counts / sela_test_letter_tooltip / sela_verify_*` | End-to-end test flows with PASS/FAIL output. |

## Usage

See the docstring at the top of `tools/sela.py` for a full example flow; or run `mcp/_run_test.py`.

See [`SETUP.md`](SETUP.md) for prerequisites.
