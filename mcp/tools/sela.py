"""Sela webapp-specific browser automation tools.

Builds on the generic browser tools to provide high-level actions
targeting the Sela Bible Poetry study app.

Typical test flow:
    browser_run_init("sounds-test")
    sela_auth(PREVIEW_URL, USER_EMAIL)
    sela_create_study("psalms", "23")
    sela_set_language_parallel()
    sela_open_sounds_tab()
    sela_select_sound_chips(["m", "l", "n"])
    sela_smart_highlight()
    result = sela_verify_letter_highlights()
    # result contains PASS/FAIL + detail
"""

import json

from _app import mcp
from tools.browser import _ensure_page, _screenshot_path

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _click_text(text: str, timeout_ms: int = 8000) -> None:
    page = await _ensure_page()
    await page.get_by_text(text, exact=True).first.click(timeout=timeout_ms)

async def _ss(step: str) -> str:
    page = await _ensure_page()
    path = _screenshot_path(step if step.endswith(".png") else f"{step}.png")
    await page.screenshot(path=str(path))
    return str(path)


# ---------------------------------------------------------------------------
# Auth tool
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_auth(base_url: str, user_email: str) -> str:
    """Authenticate into the Sela app using a Clerk sign-in token.

    Navigates to /sign-in, waits for Clerk JS, creates a sign-in token via
    the Clerk Backend API, signs in via the JS SDK, then navigates to the
    dashboard.

    Args:
        base_url: Root URL of the Sela deployment (e.g. Vercel preview URL).
        user_email: Email address of the Clerk user to sign in as.
    """
    from tools.browser import browser_auth_clerk
    return await browser_auth_clerk(base_url, user_email)


# ---------------------------------------------------------------------------
# Study creation
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_create_study(book: str, passage: str, base_url: str = "") -> str:
    """Create a new study via the dashboard New Study dialog.

    Clicks New Study, selects the book, types the passage, clicks OK, then
    waits for navigation to the study edit page.

    Valid book values (lowercase): 'genesis', 'psalms', 'isaiah', etc.
    Passage format: '23' (whole chapter), '23:1' (single verse).

    Args:
        book: Book name value as used in the select (lowercase, e.g. 'psalms').
        passage: Chapter/verse reference string (e.g. '23').
        base_url: If provided, navigate to the dashboard first.
    """
    try:
        page = await _ensure_page()

        if base_url:
            await page.goto(f"{base_url.rstrip('/')}/dashboard/home",
                            timeout=30_000, wait_until="networkidle")
            await page.wait_for_timeout(2000)

        # Open New Study dialog
        new_study_btn = page.locator("button", has_text="New Study").first
        await new_study_btn.wait_for(timeout=8_000)
        await new_study_btn.click()
        await page.wait_for_timeout(1000)

        # Select book
        book_select = page.locator("select[name='book']")
        await book_select.wait_for(timeout=5_000)
        await book_select.select_option(book)
        await page.wait_for_timeout(400)

        # Type passage using keyboard (React controlled input)
        passage_input = page.locator("input[name='passage']")
        await passage_input.wait_for(timeout=5_000)
        await passage_input.click()
        await page.keyboard.type(passage)
        await page.wait_for_timeout(400)

        # Submit — use .last because there may be a hidden copy of the button
        # from a collapsed dialog; .click() already waits for visibility.
        await page.locator("button[type='submit']", has_text="OK").last.click(timeout=8_000)
        await page.wait_for_timeout(4000)

        # Check for validation errors
        err_el = await page.query_selector(".text-red-700, .bg-red-100")
        if err_el:
            err_txt = await err_el.inner_text()
            return f"ERROR: Validation failed: {err_txt.strip()}"

        url = page.url
        if "/study/" not in url:
            return f"WARNING: Expected /study/ URL after creation, got: {url}"

        return f"Study created. URL: {url}"
    except Exception as exc:
        return f"ERROR: {exc}"


# ---------------------------------------------------------------------------
# Language / panel selector
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_set_language_parallel() -> str:
    """Switch the passage display to Parallel mode and select 'English Gloss / Hebrew OHB'.

    Clicks the 'Aא' language switcher button then selects the first dropdown
    option (English Gloss / Hebrew OHB).
    """
    try:
        page = await _ensure_page()

        # Click the Parallel (Aא) tab — it's a <span> with that text
        await page.locator("span", has_text="Aא").first.click(timeout=8_000)
        await page.wait_for_timeout(600)

        # Select "English Gloss / Hebrew OHB" from dropdown
        await page.locator("button", has_text="English Gloss / Hebrew OHB").first.click(timeout=5_000)
        await page.wait_for_timeout(600)

        return "Language set to: English Gloss / Hebrew OHB (Parallel mode)"
    except Exception as exc:
        return f"ERROR: {exc}"


# ---------------------------------------------------------------------------
# Sounds panel navigation
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_open_sounds_tab() -> str:
    """Click the Sounds tab in the study header to open the Sounds panel."""
    try:
        page = await _ensure_page()
        await page.locator("button", has_text="Sounds").first.click(timeout=8_000)
        await page.wait_for_timeout(1000)
        return "Sounds tab opened."
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def sela_open_sound_distribution() -> str:
    """Open the Hebrew Sound Distribution accordion (if not already open)."""
    try:
        page = await _ensure_page()
        btn = page.locator("button", has_text="Hebrew Sound Distribution").first
        await btn.wait_for(timeout=8_000)
        await btn.click()
        await page.wait_for_timeout(600)
        return "Hebrew Sound Distribution opened."
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def sela_open_letter_distribution() -> str:
    """Open the Hebrew Letters Distribution accordion (if not already open)."""
    try:
        page = await _ensure_page()
        btn = page.locator("button", has_text="Hebrew Letters Distribution").first
        await btn.wait_for(timeout=8_000)
        await btn.click()
        await page.wait_for_timeout(600)
        return "Hebrew Letters Distribution opened."
    except Exception as exc:
        return f"ERROR: {exc}"


# ---------------------------------------------------------------------------
# Chip selection
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_select_sound_chips(chip_labels: list[str]) -> str:
    """Select sound distribution chips by their label text.

    Available sound chip labels:
        s, sh, ts, z, kh/ ch, k/ q, g, h, d, t, n, m, b, v, p, f, l, r, y

    Chips are toggle buttons inside .wordBlock elements. Clicking a chip
    that is already selected will deselect it.

    Args:
        chip_labels: List of label strings to select, e.g. ["m", "l", "n"].
    """
    try:
        page = await _ensure_page()
        selected = []
        not_found = []

        for label in chip_labels:
            # Each chip button has a <span class="text-black"> with the label
            # and a count bubble next to it. Find button by its first span text.
            chips = await page.locator("button.wordBlock").all()
            matched = False
            for chip in chips:
                spans = await chip.locator("span.text-black").all()
                for span in spans:
                    txt = (await span.inner_text()).strip()
                    if txt == label:
                        await chip.click()
                        await page.wait_for_timeout(200)
                        selected.append(label)
                        matched = True
                        break
                if matched:
                    break
            if not matched:
                not_found.append(label)

        msg = f"Selected chips: {selected}"
        if not_found:
            msg += f" | Not found: {not_found}"
        return msg
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def sela_select_letter_chips(chip_labels: list[str]) -> str:
    """Select Hebrew letter distribution chips by their Hebrew letter label.

    Available letter chips: א ב ג ד ה ו ז ח ט י כ ך ל מ ם נ ן ס ע פ ף צ ץ ק ר ש ת

    Args:
        chip_labels: List of Hebrew letter strings to select, e.g. ["מ", "ל", "נ"].
    """
    try:
        page = await _ensure_page()
        selected = []
        not_found = []

        for label in chip_labels:
            chips = await page.locator("button.wordBlock").all()
            matched = False
            for chip in chips:
                spans = await chip.locator("span.text-black").all()
                for span in spans:
                    txt = (await span.inner_text()).strip()
                    if txt == label:
                        await chip.click()
                        await page.wait_for_timeout(200)
                        selected.append(label)
                        matched = True
                        break
                if matched:
                    break
            if not matched:
                not_found.append(label)

        msg = f"Selected letter chips: {selected}"
        if not_found:
            msg += f" | Not found: {not_found}"
        return msg
    except Exception as exc:
        return f"ERROR: {exc}"


# ---------------------------------------------------------------------------
# Highlight controls
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_smart_highlight() -> str:
    """Click the Smart Highlight button (applies selected chips to the passage).

    After clicking, selected chips are deselected and their colors are applied
    to matching letters/sounds throughout the passage. The button reverts to
    'Clear Highlight' state.
    """
    try:
        page = await _ensure_page()
        # Smart Highlight button: aria-pressed="false" and not disabled
        btn = page.locator("button[aria-pressed='false']:not([disabled])", has_text="Smart Highlight").first
        await btn.wait_for(timeout=5_000)
        await btn.click()
        await page.wait_for_timeout(800)
        return "Smart Highlight applied."
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def sela_clear_highlight() -> str:
    """Click the Clear Highlight button to remove applied highlight colors."""
    try:
        page = await _ensure_page()
        btn = page.locator("button[aria-pressed='true']", has_text="Clear Highlight").first
        await btn.wait_for(timeout=5_000)
        await btn.click()
        await page.wait_for_timeout(800)
        return "Highlights cleared."
    except Exception as exc:
        return f"ERROR: {exc}"


# ---------------------------------------------------------------------------
# Highlight verification
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_verify_letter_highlights() -> str:
    """Check whether highlighted letter spans are present in the passage.

    After Smart Highlight is applied, letters in the Hebrew passage receive
    inline backgroundColor styles. This tool scans the passage for such spans
    and reports how many colored segments are found.

    Returns a PASS or FAIL judgment with counts.
    """
    try:
        page = await _ensure_page()

        result = await page.evaluate("""() => {
            // Find all <span> elements inside the passage that have a non-white
            // non-transparent backgroundColor (i.e. highlight colors).
            const spans = document.querySelectorAll('span[style*="background-color"]');
            let colored = 0;
            let samples = [];
            spans.forEach(s => {
                const bg = s.style.backgroundColor;
                if (bg && bg !== 'rgb(255, 255, 255)' && bg !== 'transparent' && bg !== '') {
                    colored++;
                    if (samples.length < 5) {
                        samples.push({ text: s.innerText.trim(), bg });
                    }
                }
            });
            return { colored, samples };
        }""")

        colored = result["colored"]
        samples = result["samples"]

        if colored > 0:
            sample_str = ", ".join(f"{s['text']!r}({s['bg']})" for s in samples)
            return (
                f"PASS: {colored} highlighted letter segment(s) found in passage.\n"
                f"Samples: {sample_str}"
            )
        else:
            return "FAIL: No highlighted letter segments found in passage after Smart Highlight."
    except Exception as exc:
        return f"ERROR: {exc}"


# ---------------------------------------------------------------------------
# Full end-to-end test
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_run_test(
    base_url: str,
    user_email: str,
    book: str = "psalms",
    passage: str = "23",
    sound_chips: list[str] | None = None,
) -> str:
    """Run the full Sound Distribution highlight test against a Sela deployment.

    Steps:
    1. Initialise a timestamped run folder for screenshots.
    2. Authenticate via Clerk sign-in token.
    3. Create a new study (default: Psalms 23).
    4. Set language to Parallel / English Gloss + Hebrew OHB.
    5. Open Sounds tab > Hebrew Sound Distribution.
    6. Select 3 sound chips (default: m, l, n).
    7. Click Smart Highlight.
    8. Verify highlighted letters appear in passage.
    9. Open Hebrew Letters Distribution and verify chips are present (not colored —
       sound highlight mode disables letter highlight coloring by design).
    10. Report PASS or FAIL with detail.

    Args:
        base_url: Vercel preview or production URL.
        user_email: Clerk account email for auth.
        book: Book value for study creation (default: 'psalms').
        passage: Passage string (default: '23').
        sound_chips: List of sound chip labels to select (default: ['m', 'l', 'n']).
    """
    from tools.browser import browser_run_init, browser_screenshot

    chips = sound_chips if sound_chips is not None else ["m", "l", "n"]
    results: list[str] = []
    passed = True

    def record(step: str, result: str) -> None:
        nonlocal passed
        status = "FAIL" if result.startswith(("ERROR", "FAIL", "WARNING")) else "ok"
        if status == "FAIL":
            passed = False
        results.append(f"[{status}] {step}: {result[:120]}")

    # 1. Init run folder
    folder_result = await browser_run_init("sounds-highlight-test")
    record("run_init", folder_result)

    # 2. Auth
    auth_result = await sela_auth(base_url, user_email)
    record("auth", auth_result)
    await browser_screenshot("01_dashboard.png")

    if "ERROR" in auth_result:
        results.append("ABORTED: auth failed.")
        return "\n".join(results)

    # 3. Create study (navigate to dashboard first)
    study_result = await sela_create_study(book, passage, base_url=base_url)
    record("create_study", study_result)
    await browser_screenshot("02_study_created.png")

    if "ERROR" in study_result:
        results.append("ABORTED: study creation failed.")
        return "\n".join(results)

    # 4. Set language parallel
    lang_result = await sela_set_language_parallel()
    record("set_language", lang_result)
    await browser_screenshot("03_parallel_mode.png")

    # 5. Open Sounds tab
    record("open_sounds_tab", await sela_open_sounds_tab())
    await browser_screenshot("04_sounds_tab.png")

    # Hebrew Sound Distribution should be open by default; confirm visible
    try:
        page = await _ensure_page()
        await page.wait_for_selector("text=Hebrew Sound Distribution", timeout=8_000)
        record("sound_dist_visible", "Hebrew Sound Distribution visible")
    except Exception as exc:
        record("sound_dist_visible", f"ERROR: {exc}")

    # 6. Select chips
    record("select_chips", await sela_select_sound_chips(chips))
    await browser_screenshot("05_chips_selected.png")

    # 7. Smart highlight
    record("smart_highlight", await sela_smart_highlight())
    await browser_screenshot("06_after_highlight.png")

    # 8. Verify highlights in passage
    verify_result = await sela_verify_letter_highlights()
    record("verify_highlights", verify_result)
    await browser_screenshot("07_verify_highlights.png")

    # 9. Open letter distribution and confirm chips are present
    record("open_letter_dist", await sela_open_letter_distribution())
    await page.wait_for_timeout(600)
    await browser_screenshot("08_letter_distribution.png")

    # Verify letter chips are rendered (sound highlight is active so letter chips
    # are intentionally un-colored; we just confirm the panel loaded correctly).
    letter_chip_count = await page.evaluate(
        "() => document.querySelectorAll('button.wordBlock').length"
    )
    record(
        "letter_chips_visible",
        f"PASS: {letter_chip_count} letter chip(s) visible in Letters Distribution"
        if letter_chip_count > 0
        else "FAIL: No letter chips found — Letters Distribution may not have loaded",
    )
    await browser_screenshot("09_letter_chips.png")

    # Summary
    verdict = "PASS" if passed else "FAIL"
    summary = f"\n{'='*50}\nTEST RESULT: {verdict}\n{'='*50}\n" + "\n".join(results)
    return summary
