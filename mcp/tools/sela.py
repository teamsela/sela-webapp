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
# Sound chip palette — mirrors hebrewHighlights.ts exactly.
# Used by deterministic verification to assert exact colors and letter mappings.
# Key: chip label (same as SOUND_CHIPS id/label).
# rgb: CSS computed value (rgb(R, G, B)) that the browser will report.
# letters: Hebrew base characters (NFC, no combining marks) that carry this sound.
# ---------------------------------------------------------------------------
SOUND_PALETTE: dict[str, dict] = {
    "s":     {"hex": "#FFF176", "rgb": "rgb(255, 241, 118)", "letters": ["\u05E1", "\u05E9"]},          # ס שׂ
    "sh":    {"hex": "#FFD54F", "rgb": "rgb(255, 213, 79)",  "letters": ["\u05E9"]},                    # שׁ (with shin-dot)
    "ts":    {"hex": "#FFB74D", "rgb": "rgb(255, 183, 77)",  "letters": ["\u05E6", "\u05E5"]},          # צ ץ
    "z":     {"hex": "#FF9800", "rgb": "rgb(255, 152, 0)",   "letters": ["\u05D6"]},                    # ז
    "kh-ch": {"hex": "#CE93D8", "rgb": "rgb(206, 147, 216)", "letters": ["\u05D7", "\u05DB", "\u05DA"]}, # ח כ ך
    "k-q":   {"hex": "#BA68C8", "rgb": "rgb(186, 104, 200)", "letters": ["\u05E7", "\u05DB", "\u05DA"]}, # ק כ ך (with dagesh)
    "g":     {"hex": "#AB47BC", "rgb": "rgb(171, 71, 188)",  "letters": ["\u05D2"]},                    # ג
    "h":     {"hex": "#E1BEE7", "rgb": "rgb(225, 190, 231)", "letters": ["\u05D4"]},                    # ה
    "d":     {"hex": "#81C784", "rgb": "rgb(129, 199, 132)", "letters": ["\u05D3"]},                    # ד
    "t":     {"hex": "#388E3C", "rgb": "rgb(56, 142, 60)",   "letters": ["\u05D8", "\u05EA"]},          # ט ת
    "n":     {"hex": "#EF9A9A", "rgb": "rgb(239, 154, 154)", "letters": ["\u05E0", "\u05DF"]},          # נ ן
    "m":     {"hex": "#F44336", "rgb": "rgb(244, 67, 54)",   "letters": ["\u05DE", "\u05DD"]},          # מ ם
    "b":     {"hex": "#795548", "rgb": "rgb(121, 85, 72)",   "letters": ["\u05D1"]},                    # ב (with dagesh)
    "v":     {"hex": "#D7CCC8", "rgb": "rgb(215, 204, 200)", "letters": ["\u05D5", "\u05D1"]},          # ו ב (no dagesh)
    "p":     {"hex": "#616161", "rgb": "rgb(97, 97, 97)",    "letters": ["\u05E4", "\u05E3"]},          # פ ף (with dagesh)
    "f":     {"hex": "#E0E0E0", "rgb": "rgb(224, 224, 224)", "letters": ["\u05E4", "\u05E3"]},          # פ ף (no dagesh)
    "l":     {"hex": "#2196F3", "rgb": "rgb(33, 150, 243)",  "letters": ["\u05DC"]},                    # ל
    "r":     {"hex": "#64B5F6", "rgb": "rgb(100, 181, 246)", "letters": ["\u05E8"]},                    # ר
    "y":     {"hex": "#B3E5FC", "rgb": "rgb(179, 229, 252)", "letters": ["\u05D9"]},                    # י
}

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


# Maps sound chip ID → letter chip group label(s) as they appear in the DOM
# (the label prop of LETTER_CHIP_GROUPS in hebrewHighlights.ts).
SOUND_TO_LETTER_GROUP: dict[str, list[str]] = {
    "s":     ["ס", "שׂ שׁ"],    # samekh + shin-sin-group (sin carries s sound)
    "sh":    ["שׂ שׁ"],          # shin-sin-group (shin carries sh sound)
    "ts":    ["צ ץ"],
    "z":     ["ז"],
    "kh-ch": ["כ ך", "ח"],
    "k-q":   ["ק", "כ ך"],
    "g":     ["ג"],
    "h":     ["ה"],
    "d":     ["ד"],
    "t":     ["ט", "ת"],
    "n":     ["נ ן"],
    "m":     ["מ ם"],
    "b":     ["ב"],
    "v":     ["ו", "ב"],
    "p":     ["פ"],
    "f":     ["פ"],
    "l":     ["ל"],
    "r":     ["ר"],
    "y":     ["י"],
}


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

async def _create_study_impl(page, book: str, passage: str) -> str:
    """Internal: fill and submit the New Study dialog. Page must be on dashboard."""
    new_study_btn = page.locator("button", has_text="New Study").first
    await new_study_btn.wait_for(timeout=8_000)
    await new_study_btn.click()
    await page.wait_for_timeout(1000)

    book_select = page.locator("select[name='book']")
    await book_select.wait_for(timeout=5_000)
    await book_select.select_option(book)
    await page.wait_for_timeout(400)

    passage_input = page.locator("input[name='passage']")
    await passage_input.wait_for(timeout=5_000)
    await passage_input.click()
    await page.keyboard.type(passage)
    await page.wait_for_timeout(400)

    # Use .last — a hidden collapsed copy of the dialog may also be in the DOM.
    await page.locator("button[type='submit']", has_text="OK").last.click(timeout=8_000)
    await page.wait_for_timeout(4000)

    err_el = await page.query_selector(".text-red-700, .bg-red-100")
    if err_el:
        err_txt = await err_el.inner_text()
        return f"ERROR: Validation failed: {err_txt.strip()}"

    url = page.url
    if "/study/" not in url:
        return f"WARNING: Expected /study/ URL after creation, got: {url}"
    return f"Study created. URL: {url}"


@mcp.tool()
async def sela_create_study(book: str, passage: str, base_url: str = "") -> str:
    """Create a new study via the dashboard New Study dialog.

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
        return await _create_study_impl(page, book, passage)
    except Exception as exc:
        return f"ERROR: {exc}"


@mcp.tool()
async def sela_open_or_create_study(book: str, passage: str, base_url: str = "") -> str:
    """Navigate to an existing study matching book+passage, or create one if none exists.

    Idempotent: if a study for this book/passage already exists in the dashboard
    it is opened directly without creating a duplicate.

    Args:
        book: Book name (lowercase), e.g. 'psalms'.
        passage: Chapter/verse string, e.g. '23'.
        base_url: If provided, navigate to the dashboard first.
    """
    try:
        page = await _ensure_page()

        if base_url:
            await page.goto(f"{base_url.rstrip('/')}/dashboard/home",
                            timeout=30_000, wait_until="networkidle")
            await page.wait_for_timeout(2000)

        # Look for an existing study card whose title contains book + passage,
        # e.g. "Psalms 23". Study cards are typically <a> elements.
        book_label = book.capitalize()
        search_text = f"{book_label} {passage}"
        existing = page.locator(f"text={search_text}").first
        try:
            await existing.wait_for(timeout=4_000)
            await existing.click()
            await page.wait_for_timeout(2000)
            url = page.url
            if "/study/" in url:
                return f"Opened existing study. URL: {url}"
        except Exception:
            pass  # No existing study found — fall through to creation

        return await _create_study_impl(page, book, passage)
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
        # Wait for the button to change to "Clear Highlight" (aria-pressed=true) as
        # confirmation that the React state update propagated to the DOM.
        try:
            await page.locator("button[aria-pressed='true']", has_text="Clear Highlight").first.wait_for(
                timeout=3_000
            )
        except Exception:
            pass  # Fall back gracefully; caller can re-check
        await page.wait_for_timeout(400)
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
# Deterministic verification
# ---------------------------------------------------------------------------

@mcp.tool()
async def sela_verify_deterministic(
    chip_labels: list[str],
    dom_label_map: dict | None = None,
) -> str:
    """Deterministically verify chip colors, outline absence, and passage highlights.

    chip_labels: sound chip IDs to test (e.g. ['m','l','n']).
    dom_label_map: optional mapping from the DOM button label to the sound palette
        config dict {rgb, letters}. Use this when verifying Letter Distribution chips
        whose DOM labels are Hebrew (e.g. {'מ ם': SOUND_PALETTE['m'], ...}).
        When omitted, the DOM label is assumed to be the same as the chip ID.

    Asserts per chip:
      - Button background matches the exact expected RGB color.
      - Yellow selection outline (#FFC300) is NOT present.
    Asserts for the passage:
      - Every highlighted span has a color from the tested chips.
      - Every highlighted Hebrew character matches the correct sound's letters.
    """
    try:
        page = await _ensure_page()

        # Build the DOM-label → palette config mapping.
        # If dom_label_map is provided, use it directly (for letter distribution chips).
        # Otherwise fall back to identity: DOM label == sound chip ID.
        if dom_label_map is not None:
            tested = dom_label_map
        else:
            tested = {
                label: SOUND_PALETTE[label]
                for label in chip_labels
                if label in SOUND_PALETTE
            }
        unknown = [l for l in chip_labels if l not in SOUND_PALETTE and dom_label_map is None]

        # Serialize to pass into JS (JSON-safe)
        config_js = json.dumps(tested)

        result = await page.evaluate(f"""(configJson) => {{
            const SOUND_CONFIG = JSON.parse(configJson);
            const YELLOW_OUTLINE = 'rgb(255, 195, 0)';  // #FFC300

            // ---------- 1. Chip assertions ----------
            const chipResults = {{}};
            document.querySelectorAll('button.wordBlock').forEach(btn => {{
                const labelEl = btn.querySelector('span.text-black');
                if (!labelEl) return;
                const label = labelEl.innerText.trim();
                if (!SOUND_CONFIG[label]) return;

                const bg = btn.style.background || btn.style.backgroundColor;
                const cs = getComputedStyle(btn);
                const outlineStyle = cs.outlineStyle;
                const outlineColor = cs.outlineColor;
                const hasYellowOutline = outlineStyle !== 'none' && outlineColor === YELLOW_OUTLINE;

                chipResults[label] = {{
                    bgActual: bg,
                    bgExpected: SOUND_CONFIG[label].rgb,
                    bgMatch: bg === SOUND_CONFIG[label].rgb,
                    hasYellowOutline,
                    outlineStyle,
                    outlineColor,
                }};
            }});

            // ---------- 2. Passage highlight assertions ----------
            const correct = [];
            const wrong   = [];

            // Build reverse map: rgb string -> {{ label, letters[] }}
            const rgbToSound = {{}};
            for (const [label, cfg] of Object.entries(SOUND_CONFIG)) {{
                rgbToSound[cfg.rgb] = {{ label, letters: cfg.letters }};
            }}

            document.querySelectorAll('span[style*="background-color"]').forEach(span => {{
                const bg = span.style.backgroundColor;
                if (!bg || bg === 'rgb(255, 255, 255)' || bg === 'transparent' || bg === '') return;

                const text = span.innerText;

                // Is this color one we expect?
                const soundEntry = rgbToSound[bg];
                if (!soundEntry) {{
                    wrong.push({{ text, bg, reason: 'unexpected_color' }});
                    return;
                }}

                // Extract base Hebrew letters (strip combining marks)
                const stripped = text.normalize('NFKD').replace(/\\p{{M}}/gu, '');
                const hebrewChars = [...stripped].filter(c => /\\p{{Script=Hebrew}}/u.test(c));

                const badChars = hebrewChars.filter(c => !soundEntry.letters.includes(c));
                if (badChars.length > 0) {{
                    wrong.push({{
                        text,
                        bg,
                        sound: soundEntry.label,
                        expectedLetters: soundEntry.letters,
                        badChars,
                        reason: 'wrong_hebrew_char',
                    }});
                }} else {{
                    correct.push({{ text, bg, sound: soundEntry.label }});
                }}
            }});

            return {{
                chips: chipResults,
                passageCorrect: correct.length,
                passageWrong: wrong,
                passageSamples: correct.slice(0, 6),
            }};
        }}""", config_js)

        lines: list[str] = []
        all_pass = True

        # When dom_label_map is supplied, chipResults is keyed by DOM label (Hebrew).
        # Otherwise it's keyed by sound ID.
        report_labels = list(dom_label_map.keys()) if dom_label_map else chip_labels

        # Report chip results
        for label in report_labels:
            if label in (unknown or []):
                lines.append(f"  [skip] chip '{label}': not in SOUND_PALETTE")
                continue
            cr = result["chips"].get(label)
            if not cr:
                lines.append(f"  [FAIL] chip '{label}': not found in DOM")
                all_pass = False
                continue

            bg_ok = cr["bgMatch"]
            outline_ok = not cr["hasYellowOutline"]
            chip_pass = bg_ok and outline_ok

            bg_status = "ok" if bg_ok else "FAIL"
            ol_status = "ok" if outline_ok else "FAIL"
            lines.append(
                f"  [{bg_status}] chip '{label}' color: {cr['bgActual']!r}"
                f" (expected {cr['bgExpected']!r})"
            )
            lines.append(
                f"  [{ol_status}] chip '{label}' outline: "
                + ("no yellow outline" if outline_ok else f"YELLOW OUTLINE PRESENT ({cr['outlineColor']})")
            )
            if not chip_pass:
                all_pass = False

        # Report passage results
        pc = result["passageCorrect"]
        pw = result["passageWrong"]

        if pc > 0 and not pw:
            samples = ", ".join(
                f"{s['text']!r}={s['sound']}({s['bg']})" for s in result["passageSamples"]
            )
            lines.append(f"  [ok] passage: {pc} correctly highlighted span(s). Samples: {samples}")
        elif pw:
            all_pass = False
            lines.append(f"  [FAIL] passage: {len(pw)} incorrectly highlighted span(s):")
            for w in pw[:5]:
                lines.append(f"    - text={w.get('text')!r} color={w.get('bg')} reason={w.get('reason')} badChars={w.get('badChars', [])}")
            if pc:
                lines.append(f"  [ok] passage: {pc} correct span(s) also present")
        else:
            all_pass = False
            lines.append("  [FAIL] passage: no highlighted spans found")

        verdict = "PASS" if all_pass else "FAIL"
        display_labels = list(dom_label_map.keys()) if dom_label_map else chip_labels
        return f"[{verdict}] Deterministic check for chips {display_labels}:\n" + "\n".join(lines)

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
    3. Open existing study or create one if none exists (idempotent).
    4. Set language to Parallel / English Gloss + Hebrew OHB.
    5. Open Sounds tab.
    6. Switch to Hebrew Letters Distribution — verify 22 chips loaded.
    7. Select the letter chips corresponding to the requested sound chips
       (e.g. m -> מ ם, l -> ל, n -> נ ן) and click Smart Highlight.
    8. Deterministic verify (still on Letter Distribution):
       - Each letter chip's background is the exact expected RGB color.
       - No yellow selection outline present.
       - Every highlighted passage span matches a chip color with correct Hebrew letters.
    9. Browser is left on Letter Distribution for visual inspection.
    10. Report PASS or FAIL with full detail.

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
        # Treat both "[FAIL]" prefix (from verify tools) and bare "FAIL/"ERROR"/"WARNING" as failures
        is_fail = result.startswith(("ERROR", "FAIL", "WARNING")) or result.startswith("[FAIL]")
        if is_fail:
            passed = False
        status = "FAIL" if is_fail else "ok"
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

    # 3. Open existing study or create new one
    study_result = await sela_open_or_create_study(book, passage, base_url=base_url)
    record("open_or_create_study", study_result)
    await browser_screenshot("02_study.png")

    if "ERROR" in study_result:
        results.append("ABORTED: study open/create failed.")
        return "\n".join(results)

    # 4. Set language parallel
    lang_result = await sela_set_language_parallel()
    record("set_language", lang_result)
    await browser_screenshot("03_parallel_mode.png")

    # 5. Open Sounds tab (enters Sound Distribution by default)
    record("open_sounds_tab", await sela_open_sounds_tab())
    await browser_screenshot("04_sounds_tab.png")

    page = await _ensure_page()

    # 6. Switch to Hebrew Letters Distribution — this is where selection happens
    record("open_letter_dist", await sela_open_letter_distribution())
    await page.wait_for_timeout(600)
    await browser_screenshot("05_letter_dist.png")

    letter_chip_count = await page.evaluate(
        "() => document.querySelectorAll('button.wordBlock').length"
    )
    record(
        "letter_chips_visible",
        f"PASS: {letter_chip_count} letter chip(s) visible"
        if letter_chip_count > 0
        else "FAIL: No letter chips found — Letters Distribution may not have loaded",
    )

    # 7. Select the letter chips that correspond to the requested sound chips.
    #    SOUND_TO_LETTER_GROUP maps sound id -> list of letter group DOM labels.
    letter_labels: list[str] = []
    for sound_id in chips:
        letter_labels.extend(SOUND_TO_LETTER_GROUP.get(sound_id, []))
    # De-duplicate while preserving order
    seen: set[str] = set()
    letter_labels = [l for l in letter_labels if not (l in seen or seen.add(l))]  # type: ignore[func-returns-value]

    record("select_letter_chips", await sela_select_letter_chips(letter_labels))
    await browser_screenshot("06_letter_chips_selected.png")

    # 8. Smart highlight (from Letter Distribution panel)
    record("smart_highlight", await sela_smart_highlight())
    await browser_screenshot("07_after_highlight.png")

    # 9. Deterministic verify: chip colors, outline absence, passage character correctness.
    #    Build DOM-label → palette config map (letter group label → sound palette entry).
    dom_label_map = {}
    for sound_id in chips:
        for lbl in SOUND_TO_LETTER_GROUP.get(sound_id, []):
            dom_label_map[lbl] = SOUND_PALETTE[sound_id]

    det_result = await sela_verify_deterministic(chips, dom_label_map=dom_label_map)
    record("verify_deterministic", det_result)
    await browser_screenshot("08_verify_deterministic.png")

    # Browser is left on Letter Distribution for visual inspection.

    # Summary
    verdict = "PASS" if passed else "FAIL"
    summary = f"\n{'='*50}\nTEST RESULT: {verdict}\n{'='*50}\n" + "\n".join(results)
    return summary
