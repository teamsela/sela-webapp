import { expect, test, type Page } from "@playwright/test";

const publicStudyPath = "/study/d6ef7cl250emugaodqi0/view";

const countInlineHighlights = async (page: Page) =>
  page.locator('#selaPassage [style*="background-color"]').count();

const clickDistributionChip = async (
  page: Page,
  chipLabel: string,
) => {
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

test("public study view supports transliteration sound highlighting", async ({ page }) => {
  await page.goto(publicStudyPath);

  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await expect(page.locator("select")).toBeVisible();
  await page.locator("select").selectOption({ label: "Transliteration" });

  await page.getByRole("button", { name: "Sounds" }).click();
  await clickDistributionChip(page, "sh");

  expect(await countInlineHighlights(page)).toBe(0);

  await page.getByRole("button", { name: "Smart Highlight" }).click();

  await expect(page.getByRole("button", { name: "Clear Highlight" })).toBeVisible();
  expect(await countInlineHighlights(page)).toBeGreaterThan(0);
});

test("public study view supports Hebrew letter highlighting", async ({ page }) => {
  await page.goto(publicStudyPath);

  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await expect(page.locator("select")).toBeVisible();
  await page.locator("select").selectOption({ label: "Hebrew OHB" });

  await page.getByRole("button", { name: "Sounds" }).click();
  await page.getByRole("button", { name: /Hebrew Letter Distribution/ }).click();
  await clickDistributionChip(page, "שׁ");

  expect(await countInlineHighlights(page)).toBe(0);

  await page.getByRole("button", { name: "Smart Highlight" }).click();

  await expect(page.getByRole("button", { name: "Clear Highlight" })).toBeVisible();
  expect(await countInlineHighlights(page)).toBeGreaterThan(0);
});
