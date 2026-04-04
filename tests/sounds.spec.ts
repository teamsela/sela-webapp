import { expect, test, type Page } from "@playwright/test";

/**
 * Comprehensive E2E tests for the Sound feature.
 *
 * Run headed so a reviewer can watch the interactions:
 *   npx playwright test tests/sounds.spec.ts --headed
 *
 * The tests use deliberate pauses (page.waitForTimeout) between steps so the
 * reviewer can visually follow along. Remove them for CI.
 */

const publicStudyPath = "/study/d6ef7cl250emugaodqi0/view";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const PAUSE = 800; // ms between visual steps

/** Wait for the study pane to fully render after navigation. */
const waitForStudyLoad = async (page: Page) => {
  await page.goto(publicStudyPath);
  await page.waitForSelector('label[for="toggleLang"]', { timeout: 60_000 });
};

const inlineHighlights = (page: Page) =>
  page.locator('#selaPassage [style*="background-color"]');

const countInlineHighlights = (page: Page) => inlineHighlights(page).count();

const clickDistributionChip = async (page: Page, chipLabel: string) => {
  const buttons = page.locator("button");
  const buttonCount = await buttons.count();

  for (let index = 0; index < buttonCount; index += 1) {
    const innerText = (await buttons.nth(index).innerText()).replace(/\s+/g, "");
    if (innerText.startsWith(chipLabel)) {
      await buttons.nth(index).click();
      return;
    }
  }

  throw new Error(`Unable to find chip starting with "${chipLabel}"`);
};

const switchToParallelMode = async (page: Page) => {
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await expect(page.locator("select")).toBeVisible();
};

const selectDisplayMode = async (page: Page, label: "Hebrew OHB" | "Transliteration") => {
  await page.locator("select").selectOption({ label });
  await page.waitForTimeout(PAUSE);
};

const openSoundsTab = async (page: Page) => {
  await page.getByRole("button", { name: "Sounds" }).click();
  await page.waitForTimeout(PAUSE);
};

/* ------------------------------------------------------------------ */
/*  1 · Transliteration Display                                       */
/* ------------------------------------------------------------------ */

test.describe("Transliteration Display", () => {
  test("dropdown appears only in non-English modes and switches display", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);

    // English mode — no display dropdown
    await expect(page.locator("select")).not.toBeVisible();

    // Switch to Parallel (Aא) — dropdown should appear
    await switchToParallelMode(page);
    await page.waitForTimeout(PAUSE);

    // Default option is "Hebrew OHB"
    await expect(page.locator("select")).toHaveValue("0");

    // Select "Transliteration" — passage should show transliteration text
    await selectDisplayMode(page, "Transliteration");
    await expect(page.locator("select")).toHaveValue("1");

    // Verify transliteration text is rendered (dot-separated syllables)
    const passage = page.locator("#selaPassage");
    await expect(passage).toContainText(/\w+\.\w+/); // e.g. "le.da.vid"
    await page.waitForTimeout(PAUSE);

    // Switch back to "Hebrew OHB" — passage shows Hebrew characters
    await selectDisplayMode(page, "Hebrew OHB");
    await expect(page.locator("select")).toHaveValue("0");
    await page.waitForTimeout(PAUSE);
  });

  test("Hebrew-only mode (א) also shows display dropdown", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);

    await page.locator('label[for="toggleLang"] span').filter({ hasText: /^א$/ }).click();
    await page.waitForTimeout(PAUSE);
    await expect(page.locator("select")).toBeVisible();

    await selectDisplayMode(page, "Transliteration");
    const passage = page.locator("#selaPassage");
    await expect(passage).toContainText(/\w+\.\w+/);
    await page.waitForTimeout(PAUSE);
  });
});

/* ------------------------------------------------------------------ */
/*  2 · Hebrew Sound Distribution                                     */
/* ------------------------------------------------------------------ */

test.describe("Hebrew Sound Distribution", () => {
  const ALL_SOUND_LABELS = [
    "s", "sh", "ts", "z", "kh/ch", "k/q", "g", "h",
    "d", "t", "n", "m", "b", "v", "p", "f", "l", "r", "y",
  ];

  test("shows all 19 sound chips with counts", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    // Sound Distribution section should be open by default
    await expect(
      page.locator("span", { hasText: "Hebrew Sound Distribution" }).first(),
    ).toBeVisible();
    await page.waitForTimeout(PAUSE);

    // Verify all 19 sound chips are present with a count badge
    for (const label of ALL_SOUND_LABELS) {
      const chip = page.locator("button.wordBlock", { hasText: label }).first();
      await expect(chip).toBeVisible();

      // Each chip should display a numeric count
      const countBadge = chip.locator("span.rounded-full");
      await expect(countBadge).toBeVisible();
      const countText = await countBadge.innerText();
      expect(Number(countText)).toBeGreaterThanOrEqual(0);
    }
    await page.waitForTimeout(PAUSE);
  });

  test("chip selection toggles visual state", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    // Select "sh" chip — should get gold outline
    await clickDistributionChip(page, "sh");
    await page.waitForTimeout(PAUSE);

    const shChip = page.locator("button.wordBlock", { hasText: "sh" }).first();
    await expect(shChip).toHaveClass(/outline-\[#FFC300\]/);

    // Click again — should deselect
    await clickDistributionChip(page, "sh");
    await page.waitForTimeout(PAUSE);
    await expect(shChip).not.toHaveClass(/outline-\[#FFC300\]/);
  });

  test("Smart Highlight button is disabled when no chips selected", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    const btn = page.getByRole("button", { name: "Smart Highlight" }).first();
    await expect(btn).toBeDisabled();
    await page.waitForTimeout(PAUSE);

    // Select a chip — button should become enabled
    await clickDistributionChip(page, "sh");
    await page.waitForTimeout(PAUSE);
    await expect(btn).toBeEnabled();
  });

  test("Smart Highlight applies inline highlights to transliteration", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    // Select "sh" chip
    await clickDistributionChip(page, "sh");
    await page.waitForTimeout(PAUSE);

    // No highlights yet
    expect(await countInlineHighlights(page)).toBe(0);

    // Click Smart Highlight
    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    // Button text changes to "Clear Highlight"
    await expect(page.getByRole("button", { name: "Clear Highlight" }).first()).toBeVisible();

    // Inline highlights should appear in passage
    const highlightCount = await countInlineHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);
    await page.waitForTimeout(PAUSE);

    // Verify highlights are on individual letter spans, NOT whole word boxes
    const firstHighlight = inlineHighlights(page).first();
    const highlightText = await firstHighlight.innerText();
    // Individual sound segments are short (1-2 chars like "sh", "s", etc.)
    expect(highlightText.length).toBeLessThanOrEqual(3);
    await page.waitForTimeout(PAUSE);
  });

  test("Clear Highlight removes all inline highlights", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    // Click "Clear Highlight"
    await page.getByRole("button", { name: "Clear Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    // Highlights removed
    expect(await countInlineHighlights(page)).toBe(0);
    // Button text reverts
    await expect(page.getByRole("button", { name: "Smart Highlight" }).first()).toBeVisible();
    await page.waitForTimeout(PAUSE);
  });

  test("multiple sound chips can be selected and highlighted together", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    // Select two chips
    await clickDistributionChip(page, "sh");
    await page.waitForTimeout(PAUSE);
    await clickDistributionChip(page, "s");
    await page.waitForTimeout(PAUSE);

    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    const highlightCount = await countInlineHighlights(page);
    expect(highlightCount).toBeGreaterThan(0);

    // Verify there are highlights with different background colors (two sounds = two colors)
    const highlights = inlineHighlights(page);
    const styles = new Set<string>();
    const count = await highlights.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const style = await highlights.nth(i).getAttribute("style");
      if (style) {
        const match = style.match(/background-color:\s*([^;]+)/);
        if (match) styles.add(match[1].trim());
      }
    }
    expect(styles.size).toBeGreaterThanOrEqual(2);
    await page.waitForTimeout(PAUSE);
  });

  test("sound highlights also apply in Hebrew OHB view", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    await page.waitForTimeout(PAUSE);

    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    // Highlights should appear on Hebrew letters
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);
    await page.waitForTimeout(PAUSE);
  });
});

/* ------------------------------------------------------------------ */
/*  3 · Hebrew Letter Distribution                                    */
/* ------------------------------------------------------------------ */

test.describe("Hebrew Letter Distribution", () => {
  const SAMPLE_LETTER_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ל", "מ", "ר", "שׁ", "ת"];

  test("shows Hebrew letter chips with counts", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await openSoundsTab(page);

    // Open Letter Distribution section
    await page.getByRole("button", { name: /Hebrew Letter Distribution/ }).click();
    await page.waitForTimeout(PAUSE);

    // Verify sample letter chips are visible with counts
    for (const label of SAMPLE_LETTER_LABELS) {
      const chip = page.locator("button.wordBlock", { hasText: label }).first();
      await expect(chip).toBeVisible();
    }
    await page.waitForTimeout(PAUSE);
  });

  test("letter highlighting works on Hebrew text", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await openSoundsTab(page);

    await page.getByRole("button", { name: /Hebrew Letter Distribution/ }).click();
    await page.waitForTimeout(PAUSE);

    // Select shin (שׁ)
    await clickDistributionChip(page, "שׁ");
    await page.waitForTimeout(PAUSE);

    expect(await countInlineHighlights(page)).toBe(0);

    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    await expect(page.getByRole("button", { name: "Clear Highlight" }).first()).toBeVisible();
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);
    await page.waitForTimeout(PAUSE);
  });

  test("letter chip selection toggles independently", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await openSoundsTab(page);

    await page.getByRole("button", { name: /Hebrew Letter Distribution/ }).click();
    await page.waitForTimeout(PAUSE);

    // Select two letters
    await clickDistributionChip(page, "ל");
    await page.waitForTimeout(PAUSE);
    await clickDistributionChip(page, "מ");
    await page.waitForTimeout(PAUSE);

    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    // Deselect one — highlights update
    await clickDistributionChip(page, "ל");
    await page.waitForTimeout(PAUSE);

    // Still some highlights for "מ"
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);
    await page.waitForTimeout(PAUSE);
  });
});

/* ------------------------------------------------------------------ */
/*  4 · Smart Highlight – Only Selected Chips (NEW LOGIC)             */
/* ------------------------------------------------------------------ */

test.describe("Smart Highlight – Selection Logic", () => {
  test("only selected chips are highlighted, not all", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    // Select only "d" chip
    await clickDistributionChip(page, "d");
    await page.waitForTimeout(PAUSE);

    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    // Only "d" sound should be highlighted — all highlights should share the same color
    const highlights = inlineHighlights(page);
    const count = await highlights.count();
    expect(count).toBeGreaterThan(0);

    const colors = new Set<string>();
    for (let i = 0; i < count; i++) {
      const style = await highlights.nth(i).getAttribute("style");
      if (style) {
        const match = style.match(/background-color:\s*([^;]+)/);
        if (match) colors.add(match[1].trim());
      }
    }
    // Single chip selected → single highlight color
    expect(colors.size).toBe(1);
    await page.waitForTimeout(PAUSE);
  });

  test("sound and letter highlighting are mutually exclusive", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Hebrew OHB");
    await openSoundsTab(page);

    // Activate sound highlighting first
    await clickDistributionChip(page, "sh");
    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);
    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    // Switch to Letter Distribution and activate letter highlighting
    await page.getByRole("button", { name: /Hebrew Letter Distribution/ }).click();
    await page.waitForTimeout(PAUSE);

    await clickDistributionChip(page, "ל");
    await page.waitForTimeout(PAUSE);

    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    // Letter highlighting is active — sound highlighting should be auto-cleared
    await expect(page.getByRole("button", { name: "Clear Highlight" }).first()).toBeVisible();

    // Switch back to Sound Distribution
    await page.getByRole("button", { name: /Hebrew Sound Distribution/ }).click();
    await page.waitForTimeout(PAUSE);

    // Sound highlight button should NOT show "Clear Highlight"
    await expect(page.getByRole("button", { name: "Smart Highlight" }).first()).toBeVisible();
    await page.waitForTimeout(PAUSE);
  });
});

/* ------------------------------------------------------------------ */
/*  5 · Info Tooltip                                                  */
/* ------------------------------------------------------------------ */

test.describe("Info Tooltip", () => {
  test("tooltip with correct description is present", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await openSoundsTab(page);

    const tooltip = page.locator('span[title*="Different Hebrew letters"]');
    await expect(tooltip).toBeVisible();
    await page.waitForTimeout(PAUSE);

    const titleAttr = await tooltip.getAttribute("title");
    expect(titleAttr).toContain("sound patterns");
    expect(titleAttr).toContain("transliteration");
    await page.waitForTimeout(PAUSE);
  });
});

/* ------------------------------------------------------------------ */
/*  6 · No Persistence (browsing-only filter)                         */
/* ------------------------------------------------------------------ */

test.describe("No Persistence", () => {
  test("highlights reset after page reload", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await selectDisplayMode(page, "Transliteration");
    await openSoundsTab(page);

    await clickDistributionChip(page, "sh");
    await page.getByRole("button", { name: "Smart Highlight" }).first().click();
    await page.waitForTimeout(PAUSE);

    expect(await countInlineHighlights(page)).toBeGreaterThan(0);

    // Reload the page
    await page.reload();
    await page.waitForSelector('label[for="toggleLang"]', { timeout: 60_000 });

    // After reload, no highlights should be present (state is not persisted)
    expect(await countInlineHighlights(page)).toBe(0);
    await page.waitForTimeout(PAUSE);
  });

  test("footer disclaimer text is visible", async ({ page }) => {
    test.slow();
    await waitForStudyLoad(page);
    await switchToParallelMode(page);
    await openSoundsTab(page);

    await expect(
      page.locator("text=Individual-letter highlights stay in the browser"),
    ).toBeVisible();
    await page.waitForTimeout(PAUSE);
  });
});
