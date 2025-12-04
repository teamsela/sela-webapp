import { test, expect } from "@playwright/test";

// TODO: add data-testid attributes to chips and representative words in the app.
// Example selectors used here assume:
//  - chip: [data-testid="chip-preposition"]
//  - chip count badge text is part of the chip text (e.g., "Preposition 26")
//  - first word of the label: [data-testid="word-preposition-0"]

const CHIP_TEST_ID = "chip-preposition";
const WORD_TEST_ID = "word-preposition-0";
const TARGET_COLOR = "rgb(255, 204, 0)"; // #ffcc00 sample palette

test.describe("Syntax chip mirrors manual recolor", () => {
  test("recoloring a label updates chip and words uniformly", async ({ page }) => {
    const studyId = process.env.STUDY_ID || "replace-with-fixture-id";
    await page.goto(`/study/${studyId}/edit`);

    // Open Syntax pane
    await page.getByRole("button", { name: /syntax/i }).click();

    // Select the chip to select all its words
    const chip = page.getByTestId(CHIP_TEST_ID);
    await chip.click();

    // Open the color picker and choose a swatch.
    // Adjust selectors to match your picker implementation.
    await page.getByLabel(/color picker/i).click();
    await page.getByLabel(/#ffcc00/i).click();

    // Chip should reflect the chosen palette
    await expect(chip).toHaveCSS("background-color", TARGET_COLOR);

    // A representative word for the label should also reflect the palette
    await expect(page.getByTestId(WORD_TEST_ID)).toHaveCSS("background-color", TARGET_COLOR);
  });
});
