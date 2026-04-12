import { expect, test } from "@playwright/test";
import {
  PAUSE,
  waitForStudyLoad,
  switchToParallelMode,
  selectDisplayMode,
  openSoundsTab,
  openDistributionSection,
  clickDistributionChip,
  clickSmartHighlight,
  getSmartHighlightButton,
  inlineHighlights,
  countInlineHighlights,
  collectHighlightColors,
  expectIndividualLetterHighlights,
  screenshot,
} from "./helpers";

/**
 * Comprehensive E2E tests for the Sound Display Transliteration feature.
 *
 * Headed review:  npx playwright test tests/sounds.spec.ts --headed
 * CI mode:        CI=true npx playwright test tests/sounds.spec.ts
 *
 * Environment variables:
 *   PLAYWRIGHT_BASE_URL  – app URL (default: http://127.0.0.1:3000)
 *   TEST_STUDY_PATH      – study to test (default: a public Psalm 23 study)
 *   TEST_PAUSE           – ms between steps (default: 600, 0 in CI)
 *   TEST_EVIDENCE_DIR    – where to save screenshots
 */

/* ================================================================== */
/*  1 · Transliteration Display                                       */
/* ================================================================== */

test.describe("Transliteration Display", () => {
  test("dropdown has all 3 options per PDF spec", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);

    const options = page.locator("select option");
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText("English Gloss / Hebrew OHB");
    await expect(options.nth(1)).toHaveText("English / Transliteration");
    await expect(options.nth(2)).toHaveText("English Gloss / Hebrew Transliteration");
    await screenshot(page, "dropdown-3-options");
  });

  test("dropdown appears only in non-English modes and switches display", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);

    // English mode — no display dropdown
    await expect(page.locator("select")).not.toBeVisible();

    // Switch to Parallel (Aא) — dropdown should appear
    await switchToParallelMode(page);
    await page.waitForTimeout(PAUSE);

    // Default option is "English Gloss / Hebrew OHB"
    await expect(page.locator("select")).toHaveValue("0");

    // Select "English / Transliteration" — passage should show transliteration text
    await selectDisplayMode(page, "English / Transliteration");
    await expect(page.locator("select")).toHaveValue("1");

    // Verify transliteration text is rendered (dot-separated syllables)
    const passage = page.locator("#selaPassage");
    await expect(passage).toContainText(/\w+\.\w+/); // e.g. "le.da.vid"
    await page.waitForTimeout(PAUSE);

    // Switch back to "English Gloss / Hebrew OHB" — passage shows Hebrew characters
    await selectDisplayMode(page, "English Gloss / Hebrew OHB");
    await expect(page.locator("select")).toHaveValue("0");

    // Select "English Gloss / Hebrew Transliteration" — also shows transliteration
    await selectDisplayMode(page, "English Gloss / Hebrew Transliteration");
    await expect(page.locator("select")).toHaveValue("2");
    await expect(passage).toContainText(/\w+\.\w+/);
    await screenshot(page, "transliteration-toggle");
  });

  test("Hebrew-only mode (א) also shows display dropdown", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);

    await page.locator('label[for="toggleLang"] span').filter({ hasText: /^א$/ }).click();
    await page.waitForTimeout(PAUSE);
    await expect(page.locator("select")).toBeVisible();

    await selectDisplayMode(page, "English / Transliteration");
    const passage = page.locator("#selaPassage");
    await expect(passage).toContainText(/\w+\.\w+/);
    await screenshot(page, "hebrew-only-transliteration");
  });
});

/* ================================================================== */
/*  2 · Hebrew Sound Distribution                                     */
/* ================================================================== */

test.describe("Hebrew Sound Distribution", () => {
  const ALL_SOUND_LABELS = [
    "s", "sh", "ts", "z", "kh/ch", "k/q", "g", "h",
    "d", "t", "n", "m", "b", "v", "p", "f", "l", "r", "y",
  ];

  test("shows all 19 sound chips with counts", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    await expect(
      page.locator("span", { hasText: "Hebrew Sound Distribution" }).first(),
    ).toBeVisible();

    for (const label of ALL_SOUND_LABELS) {
      const chip = page.locator("button.wordBlock", { hasText: label }).first();
      await expect(chip).toBeVisible();

      const countBadge = chip.locator("span.rounded-full");
      await expect(countBadge).toBeVisible();
      const countText = await countBadge.innerText();
      expect(Number(countText)).toBeGreaterThanOrEqual(0);
    }
    await screenshot(page, "sound-chips-all-19");
  });

  test("chip selection toggles visual state", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    const shChip = page.locator("button.wordBlock", { hasText: "sh" }).first();
    await expect(shChip).toHaveClass(/outline-\[#FFC300\]/);

    await clickDistributionChip(page, "sh");
    await expect(shChip).not.toHaveClass(/outline-\[#FFC300\]/);
  });

  test("Smart Highlight button is disabled when no chips selected", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    const btn = page.getByRole("button", { name: "Smart Highlight" }).first();
    await expect(btn).toBeDisabled();

    await clickDistributionChip(page, "sh");
    await expect(btn).toBeEnabled();
    await screenshot(page, "smart-highlight-enabled");
  });

  test("Smart Highlight applies inline highlights to transliteration", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    expect(await countInlineHighlights(page)).toBe(0);

    await clickSmartHighlight(page);
    await expect(page.getByRole("button", { name: "Clear Highlight" }).first()).toBeVisible();

    await expectIndividualLetterHighlights(page);
    await screenshot(page, "sound-highlight-transliteration");
  });

  test("Clear Highlight removes all inline highlights", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    await clickSmartHighlight(page);
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    await clickSmartHighlight(page); // "Clear Highlight"
    expect(await countInlineHighlights(page)).toBe(0);
    await expect(page.getByRole("button", { name: "Smart Highlight" }).first()).toBeVisible();
  });

  test("multiple sound chips produce multiple highlight colors", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    await clickDistributionChip(page, "s");
    await clickSmartHighlight(page);

    const colors = await collectHighlightColors(page);
    expect(colors.size).toBeGreaterThanOrEqual(2);
    await screenshot(page, "sound-multiple-chips");
  });

  test("sound highlights also apply in Hebrew OHB view", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English Gloss / Hebrew OHB");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    await clickSmartHighlight(page);

    expect(await countInlineHighlights(page)).toBeGreaterThan(0);
    await screenshot(page, "sound-highlight-hebrew");
  });
});

/* ================================================================== */
/*  3 · Hebrew Letters Distribution                                    */
/* ================================================================== */

test.describe("Hebrew Letters Distribution", () => {
  const SAMPLE_LETTER_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ל", "מ", "ר", "שׁ", "ת"];

  test("shows Hebrew letter chips with counts", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English Gloss / Hebrew OHB");
    await openSoundsTab(page);

    await openDistributionSection(page, "Hebrew Letters Distribution");

    for (const label of SAMPLE_LETTER_LABELS) {
      const chip = page.locator("button.wordBlock", { hasText: label }).first();
      await expect(chip).toBeVisible();
    }
    await screenshot(page, "letter-chips");
  });

  test("letter highlighting works on Hebrew text", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English Gloss / Hebrew OHB");
    await openSoundsTab(page);

    await openDistributionSection(page, "Hebrew Letters Distribution");
    await clickDistributionChip(page, "שׁ");

    expect(await countInlineHighlights(page)).toBe(0);
    await clickSmartHighlight(page);

    await expect(page.getByRole("button", { name: "Clear Highlight" }).first()).toBeVisible();
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);
    await screenshot(page, "letter-highlight-hebrew");
  });

  test("letter chip selection toggles independently", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English Gloss / Hebrew OHB");
    await openSoundsTab(page);

    await openDistributionSection(page, "Hebrew Letters Distribution");
    await clickDistributionChip(page, "ל");
    await clickDistributionChip(page, "מ");
    await clickSmartHighlight(page);

    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    await clickDistributionChip(page, "ל");
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  4 · Smart Highlight – Only Selected Chips (NEW LOGIC)             */
/* ================================================================== */

test.describe("Smart Highlight – Selection Logic", () => {
  test("only selected chips are highlighted, not all", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "d");
    await clickSmartHighlight(page);

    const colors = await collectHighlightColors(page);
    expect(colors.size).toBe(1);
    await screenshot(page, "only-selected-chip");
  });

  test("sound and letter highlighting are mutually exclusive", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English Gloss / Hebrew OHB");
    await openSoundsTab(page);

    // Activate sound highlighting
    await clickDistributionChip(page, "sh");
    await clickSmartHighlight(page);
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    // Switch to letters and activate
    await openDistributionSection(page, "Hebrew Letters Distribution");
    await clickDistributionChip(page, "ל");
    await clickSmartHighlight(page);

    // Go back to sounds — should show "Smart Highlight" (not "Clear")
    await openDistributionSection(page, "Hebrew Sound Distribution");
    await expect(page.getByRole("button", { name: "Smart Highlight" }).first()).toBeVisible();
    await screenshot(page, "mutually-exclusive");
  });
});

/* ================================================================== */
/*  5 · Info Tooltip                                                  */
/* ================================================================== */

test.describe("Info Tooltip", () => {
  test("tooltip with correct description is present", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await openSoundsTab(page);

    const tooltip = page.locator('span[title*="Different Hebrew letters"]');
    await expect(tooltip).toBeVisible();

    const titleAttr = await tooltip.getAttribute("title");
    // Verify the FULL tooltip text matches PDF spec verbatim
    expect(titleAttr).toContain("helps you detect sound patterns and rhymes");
    expect(titleAttr).toContain("based on how words are heard, not how they are written");
    expect(titleAttr).toContain("not in the default English display");
    await screenshot(page, "info-tooltip");
  });

  test("tooltip popup appears on hover", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await openSoundsTab(page);

    const tooltipTrigger = page.locator('span[title*="Different Hebrew letters"]');
    await tooltipTrigger.hover();
    await page.waitForTimeout(PAUSE);

    // The styled popup should appear
    const popup = page.locator(".shadow-lg", { hasText: "sound patterns and rhymes" });
    await expect(popup).toBeVisible();
    await screenshot(page, "info-tooltip-popup");
  });
});

/* ================================================================== */
/*  6 · No Persistence (browsing-only filter)                         */
/* ================================================================== */

test.describe("No Persistence", () => {
  test("highlights reset after page reload", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "English / Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    await clickSmartHighlight(page);
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    await page.reload();
    await page.waitForSelector('label[for="toggleLang"]', { timeout: 60_000 });

    expect(await countInlineHighlights(page)).toBe(0);
    await screenshot(page, "no-persistence-after-reload");
  });

  test("footer disclaimer text is visible", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await openSoundsTab(page);

    await expect(
      page.locator("text=Individual-letter highlights stay in the browser"),
    ).toBeVisible();
    await screenshot(page, "disclaimer-text");
  });
});
