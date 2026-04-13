import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";
const baseUrl = "https://sela-webapp-t2j8mnqnr-sela-webapp.vercel.app";
const studyId = "cs8p4poa9c1akf2sireg";
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzg2NjI3NDksImlpZCI6Imluc18yYkQ1TGpzZEc1dWNnWDJDbHFpNlIzZ2VQdWgiLCJzaWQiOiJzaXRfM0NJUWtsTWtiaG9pa2tOaFlja01XT2RFZXdSIiwic3QiOiJzaWduX2luX3Rva2VuIn0.afkF21pwG10eqQKipc2iG7BsWsPyXtWNrfz7B6qP83-lDGwObMyzl2wHNMhXbISaTr-bcEJXvQBDmBztda2kKeH8IoEVUL2Dtk0brRszWTOHjU1crU26c5sWR874-RlIituxYkmqvFtyS1_cWkaGyKPeMtVmk362ALbb5eUl6EIDLAzXlQY6YQDyTMO1HJbwkcIdWTLd_6zkN-cKxK11aDocVyg7jPoD4DS19Mf5U6pOI57qIg2nFg3xaocRstaUaSuIQukuAeG_91H4PQKj7KAEZrp3ItyzqL05xkLR8iafDIUOycfS4MiLpG3xqgLxLNpufZZR6uiJY62fwA5Cdw";
const dir = path.resolve("C:/Users/brian/Repos/Github Copilot CLI Prompt Docs/sela-webapp/Sound Display Transliteration/live");
const snap = async (p: Page, n: string) => { fs.mkdirSync(dir,{recursive:true}); await p.screenshot({path:path.join(dir,n+".png"),fullPage:false}); console.log("📸 "+n); };
const chip = async (p: Page, l: string) => { const b=p.locator("button.wordBlock"); for(let i=0;i<await b.count();i++){if((await b.nth(i).innerText()).replace(/\s+/g,"").startsWith(l)){await b.nth(i).click();await p.waitForTimeout(600);return;}} };
const openDD = async (p: Page) => { const c=p.locator('label[for="toggleLang"] svg').first(); if(await c.isVisible().catch(()=>false)){await c.click();await p.waitForTimeout(500);} };
const pickMode = async (p: Page, l: string) => { await openDD(p); await p.locator('.shadow-lg button:has-text("'+l+'")').last().click(); await p.waitForTimeout(1200); };
const setZoom = async (p: Page, pct: string) => { const t=p.locator('#scaleInput').locator('..'); await t.click(); await p.waitForTimeout(500); const o=p.locator('li:has-text("'+pct+'")'); if(await o.isVisible().catch(()=>false)){await o.click();await page.waitForTimeout(1500);} };

test.use({ viewport: { width: 1440, height: 810 } });

test("final capture", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto(baseUrl + "/sign-in?__clerk_ticket=" + token);
  await page.waitForTimeout(8000);
  for (let i = 0; i < 5; i++) {
    await page.goto(baseUrl + "/study/" + studyId + "/edit?t=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    if (!(await page.locator("text=Application error").isVisible().catch(() => false))) {
      if (await page.locator('label[for="toggleLang"]').isVisible().catch(() => false)) { console.log("✅ Loaded"); break; }
    }
    console.log("retry " + (i+1)); await page.waitForTimeout(3000);
  }

  // Helper to set zoom via dropdown
  const zoom = async (pct: string) => {
    const t = page.locator('#scaleInput').locator('..');
    await t.click(); await page.waitForTimeout(500);
    const o = page.locator('li:has-text("' + pct + '")');
    if (await o.isVisible().catch(() => false)) { await o.click(); await page.waitForTimeout(1500); }
  };

  // ================================================================
  // PAGES 4-5: Dropdown views at 200% (no sidebar, full passage)
  // ================================================================
  await zoom("200%");

  // Page 4: Aא parallel + transliteration
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await page.waitForTimeout(800);
  await pickMode(page, "Hebrew Transliteration");
  await openDD(page);
  await snap(page, "01-page4-match");
  await page.mouse.click(100, 400); await page.waitForTimeout(300);

  // Page 5: א transliteration + dropdown
  await page.locator('label[for="toggleLang"] span').filter({ hasText: /^א$/ }).click();
  await page.waitForTimeout(800);
  await pickMode(page, "Transliteration");
  await openDD(page);
  await snap(page, "02-page5-match");
  await page.mouse.click(100, 400); await page.waitForTimeout(300);

  // ================================================================
  // PAGES 7-13: Sounds features at 100% (sidebar + passage must fit)
  // Stay in א transliteration mode (matching PDF page 11)
  // ================================================================
  await zoom("100%");
  const sb = page.getByRole("button", { name: "Sounds" });
  await sb.click({ force: true }); await page.waitForTimeout(1500);
  await snap(page, "03-page7-sounds-panel");

  // Page 11: s/sh/ts selected, Smart Highlight button visible (not yet clicked)
  await chip(page, "s"); await chip(page, "sh"); await chip(page, "ts");
  await snap(page, "04-page11-chips-selected");

  // Click Smart Highlight
  const hlBtn = page.getByRole("button", { name: "Smart Highlight" }).first();
  if (await hlBtn.isVisible().catch(() => false)) { await hlBtn.click({ force: true }); await page.waitForTimeout(1500); }
  await snap(page, "05-page11-highlight-on");

  // Page 12: Switch to Hebrew OHB
  await pickMode(page, "Hebrew OHB");
  await page.waitForTimeout(1000);
  await snap(page, "06-page12-hebrew-highlight");

  // Clear + deselect
  const cl = page.getByRole("button", { name: "Clear Highlight" }).first();
  if (await cl.isVisible().catch(() => false)) { await cl.click(); await page.waitForTimeout(600); }
  await chip(page, "s"); await chip(page, "sh"); await chip(page, "ts");

  // Page 13: Tooltip
  await pickMode(page, "Transliteration");
  const tip = page.locator("span[title]").filter({ hasText: "i" }).first();
  if (await tip.isVisible().catch(() => false)) { await tip.hover(); await page.waitForTimeout(1000); await snap(page, "07-page13-tooltip"); await page.mouse.move(0, 0); await page.waitForTimeout(300); }

  // Pages 16-17: Letter Distribution in Hebrew OHB
  await pickMode(page, "Hebrew OHB");
  const lb = page.getByRole("button", { name: /Hebrew Letter/i });
  if (await lb.isVisible().catch(() => false)) {
    await lb.click(); await page.waitForTimeout(1500);
    await snap(page, "08-page16-letter-panel");
    await chip(page, "ל");
    const h3 = page.getByRole("button", { name: "Smart Highlight" }).first();
    if (await h3.isVisible().catch(() => false)) { await h3.click({ force: true }); await page.waitForTimeout(1500); await snap(page, "09-page17-letter-highlight"); }
  }

  // Page 14: Disclaimer
  const acc = page.locator(".accordion").first();
  if (await acc.isVisible().catch(() => false)) { await acc.evaluate(el => el.scrollTop = el.scrollHeight); await page.waitForTimeout(500); await snap(page, "10-page14-disclaimer"); }

  console.log("🎉 " + fs.readdirSync(dir).filter(f => f.endsWith(".png")).length);
});


