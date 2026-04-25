import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";
const base = "https://sela-webapp-66k3m7fvk-sela-webapp.vercel.app";
const study = "cs8p4poa9c1akf2sireg";
const tk = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzg3OTgyMjcsImlpZCI6Imluc18yYkQ1TGpzZEc1dWNnWDJDbHFpNlIzZ2VQdWgiLCJzaWQiOiJzaXRfM0NNckx4UGpaUkxsQ0FrZ1FyaDZiTUdHOVJKIiwic3QiOiJzaWduX2luX3Rva2VuIn0.KMauZFucTEeOWsyy7bZPlITsXyqkuAxVvT_4kLMm-3IkS2Z-28G97LBe0PTV-v6Ndb-ZoFkYqQb0ULegR-TUtt-JxQnq7k2CEQrU-QjP3UYoEdVtNnpCt9hOJKe5_uZ8B0NtqFfS4bSVydO-w84JyzaxTy9O2f5IZFAzLHcLwvMeeKUMhIaTjfVT2lZqAnyH6nLjfgZctDUieUb9QodU2PGGbz0zFRW3Od3qT-wJBhEcjyE0RBaEgOSNGHkH5QgrjREfI4hyz3hxGsvUflPX4UbqGSH-gDnzFnl4GntZ4MCFcQmRAcLn7IE_FIf0Mc-AP13eyrz9lFVrJRoMIUM6TA";
const dir = path.resolve("C:/Users/brian/Repos/Github Copilot CLI Prompt Docs/sela-webapp/Sound Display Transliteration/live");
const snap = async (p: Page, n: string) => { fs.mkdirSync(dir,{recursive:true}); await p.screenshot({path:path.join(dir,n+".png"),fullPage:false}); console.log("📸 "+n); };
const chip = async (p: Page, l: string) => { const b=p.locator("button.wordBlock"); for(let i=0;i<await b.count();i++){if((await b.nth(i).innerText()).replace(/\s+/g,"").startsWith(l)){await b.nth(i).click();await p.waitForTimeout(600);return;}} };
const openDD = async (p: Page) => { const c=p.locator('label[for="toggleLang"] svg').first(); if(await c.isVisible().catch(()=>false)){await c.click();await p.waitForTimeout(500);} };
const pickMode = async (p: Page, l: string) => { await openDD(p); await p.locator('.shadow-lg button:has-text("'+l+'")').last().click(); await p.waitForTimeout(1200); };
const zoom = async (p: Page, pct: string) => { const t=p.locator('#scaleInput').locator('..'); await t.click(); await p.waitForTimeout(500); const o=p.locator('li:has-text("'+pct+'")'); if(await o.isVisible().catch(()=>false)){await o.click();await p.waitForTimeout(1500);} };

test.use({ viewport: { width: 1920, height: 1080 } });

test("cap", async ({ page }) => {
  test.setTimeout(300_000);
  // Login
  await page.goto(base + "/sign-in?__clerk_ticket=" + tk);
  await page.waitForTimeout(10000);
  console.log("Login:", page.url());
  // Load study  
  await page.goto(base + "/study/" + study + "/edit?t=" + Date.now());
  await page.waitForTimeout(10000);
  console.log("Study:", page.url());
  const hasToggle = await page.locator('label[for="toggleLang"]').isVisible().catch(() => false);
  const hasError = await page.locator("text=Application error").isVisible().catch(() => false);
  console.log("toggle:", hasToggle, "error:", hasError);
  if (!hasToggle) { console.log("FAILED to load study"); return; }

  // Parallel mode
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await page.waitForTimeout(800);
  await zoom(page, "200%");
  await pickMode(page, "Hebrew Transliteration");
  await openDD(page);
  await snap(page, "01-page4-match");
  await page.mouse.click(100, 400); await page.waitForTimeout(300);
  await snap(page, "02-page5-transliteration");
  await zoom(page, "100%");
  const sb = page.getByRole("button", { name: "Sounds" });
  await sb.click({ force: true }); await page.waitForTimeout(1500);
  await snap(page, "03-page7-sounds-panel");
  await chip(page, "s"); await chip(page, "sh"); await chip(page, "ts");
  await snap(page, "04-page11-chips-selected");
  const hlBtn = page.getByRole("button", { name: "Smart Highlight" }).first();
  if (await hlBtn.isVisible().catch(() => false)) { await hlBtn.click({ force: true }); await page.waitForTimeout(1500); }
  await snap(page, "05-page11-highlight-on");
  await pickMode(page, "Hebrew OHB"); await page.waitForTimeout(1000);
  await snap(page, "06-page12-hebrew-highlight");
  const cl = page.getByRole("button", { name: "Clear Highlight" }).first();
  if (await cl.isVisible().catch(() => false)) { await cl.click(); await page.waitForTimeout(600); }
  await chip(page, "s"); await chip(page, "sh"); await chip(page, "ts");
  await pickMode(page, "Hebrew Transliteration");
  const tip = page.locator("span[title]").filter({ hasText: "i" }).first();
  if (await tip.isVisible().catch(() => false)) { await tip.hover(); await page.waitForTimeout(1000); await snap(page, "07-page13-tooltip"); await page.mouse.move(0, 0); await page.waitForTimeout(300); }
  await pickMode(page, "Hebrew OHB");
  const lb = page.getByRole("button", { name: /Hebrew Letter/i });
  if (await lb.isVisible().catch(() => false)) { await lb.click(); await page.waitForTimeout(1500); await snap(page, "08-page16-letter-panel");
    await chip(page, "ל"); const h3 = page.getByRole("button", { name: "Smart Highlight" }).first();
    if (await h3.isVisible().catch(() => false)) { await h3.click({ force: true }); await page.waitForTimeout(1500); await snap(page, "09-page17-letter-highlight"); } }
  console.log("🎉 " + fs.readdirSync(dir).filter(f => f.endsWith(".png")).length);
});
