import { expect, test } from "@playwright/test";
import {
  waitForStudyLoad,
  switchToHebrewMode,
  selectDisplayMode,
  screenshot,
  PAUSE,
} from "./helpers";

/**
 * Regression tests for Hebrew passage text.
 *
 * Guards against the bug where Hebrew passages showed dictionary headings
 * (bare consonantal roots from stepbible_tbesh) instead of the actual WLC
 * passage text (with vowel points, prefixes, and inflected forms).
 *
 * Run:  npx playwright test hebrew-regression.spec.ts
 */

const HEBREW_CHAR = /[\u0590-\u05FF]/;
const VOWEL_POINT = /[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/;

/** Collect Hebrew word texts from the passage. */
const collectPassageWords = async (page: import("@playwright/test").Page) => {
  const blocks = page.locator('#selaPassage [class*="ClickBlock"]');
  const count = await blocks.count();
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = (await blocks.nth(i).innerText()).trim();
    if (text.length > 0 && HEBREW_CHAR.test(text)) words.push(text);
  }
  return words;
};

test.describe("Hebrew WLC Text Regression", () => {
  test("Hebrew passage contains vowel points (not bare dictionary roots)", async ({
    page,
  }) => {
    await waitForStudyLoad(page);

    // Switch to Hebrew OHB mode
    await switchToHebrewMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await page.waitForTimeout(PAUSE);

    const passageText = await page.locator("#selaPassage").innerText();
    const hebrewWords = (passageText.match(/[\u0590-\u05FF\u05B0-\u05EA]+/g) || [])
      .filter((w) => HEBREW_CHAR.test(w));

    expect(hebrewWords.length).toBeGreaterThan(0);

    // WLC text has vowel points (nikkud) on most words.
    // Dictionary headings typically lack them.
    const withVowels = hebrewWords.filter((w) => VOWEL_POINT.test(w));
    const ratio = withVowels.length / hebrewWords.length;

    expect(ratio).toBeGreaterThan(0.5);

    await screenshot(page, "regression-hebrew-vowels");
  });

  test("Hebrew words are diverse (not repeated dictionary roots)", async ({
    page,
  }) => {
    await waitForStudyLoad(page);
    await switchToHebrewMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await page.waitForTimeout(PAUSE);

    const passageText = await page.locator("#selaPassage").innerText();
    const hebrewWords = (passageText.match(/[\u0590-\u05FF\u05B0-\u05EA]+/g) || [])
      .filter((w) => HEBREW_CHAR.test(w));

    expect(hebrewWords.length).toBeGreaterThan(5);

    // Real passage text has many unique inflected forms.
    // Dictionary headings would show repeated bare roots.
    const unique = new Set(hebrewWords);
    const diversity = unique.size / hebrewWords.length;

    expect(diversity).toBeGreaterThan(0.4);

    await screenshot(page, "regression-hebrew-diversity");
  });

  test("Psalm 23 passage contains expected WLC words", async ({ page }) => {
    await waitForStudyLoad(page);
    await switchToHebrewMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await page.waitForTimeout(PAUSE);

    const text = await page.locator("#selaPassage").innerText();

    // Known Psalm 23 WLC word patterns (allow for cantillation marks between chars)
    const expectedWords = [
      { pattern: /מ[\u0590-\u05FF]*ז[\u0590-\u05FF]*מ/, label: "mizmor" },
      { pattern: /י[\u0590-\u05FF]*ה[\u0590-\u05FF]*ו[\u0590-\u05FF]*ה/, label: "YHWH" },
    ];

    let found = 0;
    for (const { pattern, label } of expectedWords) {
      if (pattern.test(text)) found++;
    }

    expect(found).toBeGreaterThanOrEqual(1);

    await screenshot(page, "regression-psalm23-wlc");
  });
});
