"""Run Sela browser acceptance flows against a deployed preview."""
import argparse
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from tools.browser import browser_close
from tools.sela import (
    sela_run_test,
    sela_test_letter_tooltip,
    sela_test_distribution_counts,
    sela_test_wordplay,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--preview",
        default=os.environ.get("SELA_PREVIEW_URL", ""),
        help="Vercel preview URL (or set SELA_PREVIEW_URL).",
    )
    parser.add_argument(
        "--email",
        default=os.environ.get("SELA_TEST_EMAIL", ""),
        help="Clerk test-user email (or set SELA_TEST_EMAIL).",
    )
    parser.add_argument(
        "--suite",
        choices=["wordplay", "sounds", "all"],
        default="wordplay",
    )
    parser.add_argument("--keep-open", action="store_true")
    args = parser.parse_args()
    if not args.preview or not args.email:
        parser.error("--preview and --email are required (or use the environment variables)")
    return args

async def main(args: argparse.Namespace) -> int:
    outputs: list[str] = []

    if args.suite in {"wordplay", "all"}:
        outputs.append(
            await sela_test_wordplay(
                base_url=args.preview,
                user_email=args.email,
                book="psalms",
                passage="88",
            )
        )

    if args.suite in {"sounds", "all"}:
        outputs.append(
            await sela_run_test(
                base_url=args.preview,
                user_email=args.email,
                book="psalms",
                passage="23",
                sound_chips=["m", "l", "n"],
            )
        )
        outputs.append(
            await sela_test_letter_tooltip(
                base_url=args.preview,
                user_email=args.email,
                book="psalms",
                passage="23",
            )
        )
        outputs.append(
            await sela_test_distribution_counts(
                base_url=args.preview,
                user_email=args.email,
                book="psalms",
                passage="1",
                mode="both",
            )
        )

    print("\n\n".join(outputs))
    failed = any(
        "RESULT: FAIL" in output
        or output.startswith("ERROR")
        or "\n[FAIL]" in output
        for output in outputs
    )

    if args.keep_open:
        print("\nBrowser left open - press Ctrl+C to exit.")
        await asyncio.Event().wait()
    else:
        await browser_close()
    return 1 if failed else 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main(parse_args())))
    except KeyboardInterrupt:
        print("\nExiting.")
