import { expect, type Page, type Locator } from "@playwright/test";
import path from "path";

/* ------------------------------------------------------------------ */
/*  Configuration                                                     */
/* ------------------------------------------------------------------ */

/**
 * The study path used for E2E tests. Override via TEST_STUDY_PATH env var
 * to test against a different study.
 */
export const STUDY_PATH =
  process.env.TEST_STUDY_PATH ?? "/study/d6ef7cl250emugaodqi0/view";

/**
 * Pause between visual steps (ms). Set to 0 for CI, higher for headed reviews.
 */
export const PAUSE = process.env.CI ? 0 : Number(process.env.TEST_PAUSE ?? 600);

/**
 * Directory for screenshot evidence. Relative to the repo root by default.
 */
export const EVIDENCE_DIR = path.resolve(
  process.env.TEST_EVIDENCE_DIR ?? path.join(__dirname, "..", "test-results", "evidence"),
);

/* ------------------------------------------------------------------ */
/*  Navigation helpers                                                */
/* ------------------------------------------------------------------ */

/** Navigate to the study and wait for the study pane to render. */
export const waitForStudyLoad = async (page: Page) => {
  await page.goto(STUDY_PATH);
  await page.waitForSelector('label[for="toggleLang"]', { timeout: 60_000 });
};

/** Switch the language toggle to Parallel mode (Aא). */
export const switchToParallelMode = async (page: Page) => {
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await page.waitForTimeout(PAUSE);
};

/** Switch the language toggle to Hebrew-only mode (א). */
export const switchToHebrewMode = async (page: Page) => {
  await page.locator('label[for="toggleLang"] span').filter({ hasText: /^א$/ }).click();
  await page.waitForTimeout(PAUSE);
};

/** Select a display mode from the popover dropdown. */
export const selectDisplayMode = async (
  page: Page,
  label: "English Gloss / Hebrew OHB" | "English / Transliteration" | "English Gloss / Hebrew Transliteration" | "Hebrew OHB" | "Transliteration",
) => {
  // Click the chevron on the active toggle button to open the dropdown
  const chevron = page.locator('label[for="toggleLang"] svg').first();
  await chevron.click();
  await page.waitForTimeout(PAUSE);
  // Click the option in the popover
  await page.locator(`.shadow-lg button:has-text("${label}")`).click();
  await page.waitForTimeout(PAUSE);
};

/** Open the Sounds tab in the InfoPane sidebar. */
export const openSoundsTab = async (page: Page) => {
  await page.getByRole("button", { name: "Sounds" }).click();
  await page.waitForTimeout(PAUSE);
};

/** Open a specific distribution section by name. */
export const openDistributionSection = async (
  page: Page,
  name: "Hebrew Sound Distribution" | "Hebrew Letters Distribution",
) => {
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.waitForTimeout(PAUSE);
};

/* ------------------------------------------------------------------ */
/*  Chip interaction helpers                                          */
/* ------------------------------------------------------------------ */

/**
 * Click a distribution chip by its label text.
 * Works for both sound chips ("sh", "kh/ch") and letter chips ("א", "שׁ").
 */
export const clickDistributionChip = async (page: Page, chipLabel: string) => {
  const buttons = page.locator("button.wordBlock");
  const count = await buttons.count();

  for (let i = 0; i < count; i++) {
    const text = (await buttons.nth(i).innerText()).replace(/\s+/g, "");
    if (text.startsWith(chipLabel)) {
      await buttons.nth(i).click();
      await page.waitForTimeout(PAUSE);
      return;
    }
  }
  throw new Error(`Distribution chip "${chipLabel}" not found`);
};

/** Click the "Smart Highlight" or "Clear Highlight" button (first match). */
export const clickSmartHighlight = async (page: Page) => {
  const btn = page.getByRole("button", { name: /Smart Highlight|Clear Highlight/ }).first();
  await btn.click();
  await page.waitForTimeout(PAUSE);
};

/** Get the Smart Highlight button in the currently visible section. */
export const getSmartHighlightButton = (page: Page) =>
  page.getByRole("button", { name: /Smart Highlight|Clear Highlight/ }).first();

/* ------------------------------------------------------------------ */
/*  Highlight inspection helpers                                      */
/* ------------------------------------------------------------------ */

/** Locator for all inline highlight spans in the passage. */
export const inlineHighlights = (page: Page): Locator =>
  page.locator('#selaPassage [style*="background-color"]');

/** Count inline highlights currently visible. */
export const countInlineHighlights = (page: Page) =>
  inlineHighlights(page).count();

/**
 * Collect the set of distinct background colors used by inline highlights.
 * Useful for verifying that only selected chips' colors appear.
 */
export const collectHighlightColors = async (page: Page): Promise<Set<string>> => {
  const highlights = inlineHighlights(page);
  const count = await highlights.count();
  const colors = new Set<string>();

  for (let i = 0; i < Math.min(count, 50); i++) {
    const style = await highlights.nth(i).getAttribute("style");
    const match = style?.match(/background-color:\s*([^;]+)/);
    if (match) colors.add(match[1].trim());
  }
  return colors;
};

/* ------------------------------------------------------------------ */
/*  Screenshot helpers                                                */
/* ------------------------------------------------------------------ */

/**
 * Save a screenshot to the evidence directory.
 * The name should be a short kebab-case descriptor (no extension).
 */
export const screenshot = async (page: Page, name: string) => {
  const fs = await import("fs");
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, `${name}.png`),
    fullPage: true,
  });
};

/* ------------------------------------------------------------------ */
/*  Assertion helpers                                                 */
/* ------------------------------------------------------------------ */

/**
 * Assert that all inline highlights share exactly N distinct colors.
 * Useful for verifying "only selected chips highlighted" behavior.
 */
export const expectHighlightColorCount = async (page: Page, expected: number) => {
  const colors = await collectHighlightColors(page);
  expect(colors.size).toBe(expected);
};

/**
 * Assert that inline highlights exist and are on short text spans
 * (individual letters/sounds, not full words).
 */
export const expectIndividualLetterHighlights = async (page: Page) => {
  const count = await countInlineHighlights(page);
  expect(count).toBeGreaterThan(0);

  const first = inlineHighlights(page).first();
  const text = await first.innerText();
  expect(text.length).toBeLessThanOrEqual(3);
};
