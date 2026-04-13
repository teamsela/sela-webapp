import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";
const baseUrl = "https://sela-webapp-l3x587v8l-sela-webapp.vercel.app";
const studyId = "cs8p4poa9c1akf2sireg";
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzg2NjM5MDQsImlpZCI6Imluc18yYkQ1TGpzZEc1dWNnWDJDbHFpNlIzZ2VQdWgiLCJzaWQiOiJzaXRfM0NJVDV0Qk0zUjR3SHhhTUJWZjh1bGNMUUJqIiwic3QiOiJzaWduX2luX3Rva2VuIn0.B9I99h5NPMDspxCVia3dkc_vCUce0FuBuxsvgsWlQ1LCD8bB5PtlkFhBGxX8d-v0mXJS35QA6dEDPexSdgxtOWH7viC8JAo4A50OyvbZ9CyjiXgIyM6TRHbLpG_GyFHKXgwqIXeXBOh3a7ZrGalJIozjFtOx_OoG-N4OvZ9b1Q5z9KEyiUrScHy1uPjDVyo7rj24n7WvNvLnxhbbIW3DPIvISaowDjMi-VYBoH8f1xt-Vk29Scmjs_bqyqjW_e_kRz0DOEkYmTeUyzcaUzSh9VM4ybTAs6Dpob2woLZGr9gbHVEGAOZKZpePIzsUvkLsC81FuSpxiUpepwklE2GUCQ";
const dir = path.resolve("C:/Users/brian/Repos/Github Copilot CLI Prompt Docs/sela-webapp/Sound Display Transliteration/live");
const snap = async (p: Page, n: string) => { fs.mkdirSync(dir,{recursive:true}); await p.screenshot({path:path.join(dir,n+".png"),fullPage:false}); console.log("📸 "+n); };
const chip = async (p: Page, l: string) => { const b=p.locator("button.wordBlock"); for(let i=0;i<await b.count();i++){if((await b.nth(i).innerText()).replace(/\s+/g,"").startsWith(l)){await b.nth(i).click();await p.waitForTimeout(600);return;}} };
const openDD = async (p: Page) => { const c=p.locator('label[for="toggleLang"] svg').first(); if(await c.isVisible().catch(()=>false)){await c.click();await p.waitForTimeout(500);} };
const pickMode = async (p: Page, l: string) => { await openDD(p); await p.locator('.shadow-lg button:has-text("'+l+'")').last().click(); await p.waitForTimeout(1200); };
const zoom = async (p: Page, pct: string) => { const t=p.locator('#scaleInput').locator('..'); await t.click(); await p.waitForTimeout(500); const o=p.locator('li:has-text("'+pct+'")'); if(await o.isVisible().catch(()=>false)){await o.click();await p.waitForTimeout(1500);} };

// Use WIDER viewport so 200% zoom fits with sidebar
test.use({ viewport: { width: 1920, height: 1080 } });

test("match PDF at 200%", async ({ page }) => {
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

  // Aא parallel mode for everything
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await page.waitForTimeout(800);

  // PAGE 4: 200% + transliteration + dropdown open
  await zoom(page, "200%");
  await pickMode(page, "Hebrew Transliteration");
  await openDD(page);
  await snap(page, "01-page4-match");
  await page.mouse.click(100, 400); await page.waitForTimeout(300);
  await snap(page, "02-page5-transliteration");

  // PAGES 7-13: Open Sounds panel — stay at 200%
  const sb = page.getByRole("button", { name: "Sounds" });
  await sb.click({ force: true }); await page.waitForTimeout(1500);
  await snap(page, "03-page7-sounds-panel");

  // PAGE 11: s/sh/ts selected, Smart Highlight NOT yet clicked (button blue)
  await chip(page, "s"); await chip(page, "sh"); await chip(page, "ts");
  await snap(page, "04-page11-chips-selected");

  // Click Smart Highlight — highlights appear
  const hlBtn = page.getByRole("button", { name: "Smart Highlight" }).first();
  if (await hlBtn.isVisible().catch(() => false)) { await hlBtn.click({ force: true }); await page.waitForTimeout(1500); }
  await snap(page, "05-page11-highlight-on");

  // PAGE 12: Switch to Hebrew OHB (still parallel)
  await pickMode(page, "Hebrew OHB");
  await page.waitForTimeout(1000);
  await snap(page, "06-page12-hebrew-highlight");

  // Clear for tooltip
  const cl = page.getByRole("button", { name: "Clear Highlight" }).first();
  if (await cl.isVisible().catch(() => false)) { await cl.click(); await page.waitForTimeout(600); }
  await chip(page, "s"); await chip(page, "sh"); await chip(page, "ts");

  // PAGE 13: Tooltip
  await pickMode(page, "Hebrew Transliteration");
  const tip = page.locator("span[title]").filter({ hasText: "i" }).first();
  if (await tip.isVisible().catch(() => false)) { await tip.hover(); await page.waitForTimeout(1000); await snap(page, "07-page13-tooltip"); await page.mouse.move(0, 0); await page.waitForTimeout(300); }

  // PAGES 16-17: Letter Distribution (Hebrew OHB)
  await pickMode(page, "Hebrew OHB");
  const lb = page.getByRole("button", { name: /Hebrew Letter/i });
  if (await lb.isVisible().catch(() => false)) {
    await lb.click(); await page.waitForTimeout(1500);
    await snap(page, "08-page16-letter-panel");
    await chip(page, "ל");
    const h3 = page.getByRole("button", { name: "Smart Highlight" }).first();
    if (await h3.isVisible().catch(() => false)) { await h3.click({ force: true }); await page.waitForTimeout(1500); }
    await snap(page, "09-page17-letter-highlight");
  }

  console.log("🎉 " + fs.readdirSync(dir).filter(f => f.endsWith(".png")).length);
});
