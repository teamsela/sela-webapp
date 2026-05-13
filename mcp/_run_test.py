"""Run sela_run_test end-to-end and leave the browser open for inspection."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from tools.sela import sela_run_test, sela_test_letter_tooltip

PREVIEW = "https://sela-webapp-git-brian-sound-v2-sela-webapp.vercel.app"
EMAIL   = "discarable@gmail.com"


async def main() -> None:
    # Full highlight test
    result = await sela_run_test(
        base_url=PREVIEW,
        user_email=EMAIL,
        book="psalms",
        passage="23",
        sound_chips=["m", "l", "n"],
    )
    print(result)

    # Letter distribution tooltip test
    print("\nRunning letter tooltip test...")
    tooltip_result = await sela_test_letter_tooltip(
        base_url=PREVIEW,
        user_email=EMAIL,
        book="psalms",
        passage="23",
    )
    print(tooltip_result)

    print("\nBrowser left open — press Ctrl+C to exit.")
    # Keep the event loop alive so the browser stays visible
    await asyncio.Event().wait()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting.")
