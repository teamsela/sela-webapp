# `tools/sela.py` — Sela app E2E flows

High-level, Sela-specific browser flows built on `browser.py`: create studies and exercise the Sound/Letter Distribution and Wordplay features with deterministic verification.

## Tools

| Tool | Purpose |
| --- | --- |
| `sela_auth / sela_create_study / sela_open_or_create_study` | Sign in and open/create a study. |
| `sela_set_language_parallel / sela_set_language_parallel_transliteration / sela_open_sounds_tab / sela_open_wordplay_tab` | Set up the passage view. |
| `sela_select_sound_chips / sela_select_letter_chips / sela_smart_highlight / sela_clear_highlight` | Drive highlighting. |
| `sela_run_test / sela_test_distribution_counts / sela_test_letter_tooltip / sela_verify_*` | End-to-end test flows with PASS/FAIL output. |
| `sela_test_wordplay` | Psalm 88 acceptance flow for real lexical/sound candidates, pair-only highlighting, exact colors, controls, tooltip, and screenshots. |

## Usage

Set `SELA_PREVIEW_URL` and `SELA_TEST_EMAIL`, then run `python mcp/_run_test.py --suite wordplay`. Use `--suite all` for every flow or `--keep-open` for a live demo.

See [`SETUP.md`](SETUP.md) for prerequisites.
