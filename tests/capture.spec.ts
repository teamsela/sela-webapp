import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";
const baseUrl = "https://sela-webapp-j7fos0p3h-sela-webapp.vercel.app";
const studyId = "cs8p4poa9c1akf2sireg";
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzg2NjEyNzQsImlpZCI6Imluc18yYkQ1TGpzZEc1dWNnWDJDbHFpNlIzZ2VQdWgiLCJzaWQiOiJzaXRfM0NJTmxSek9xR3dwUkQ1NUdyZWZZbkUyMzA3Iiwic3QiOiJzaWduX2luX3Rva2VuIn0.dLNm6cB_S3QwHh3beMauPGjfuHAPR38Pap4ntu2h7jkfVabbE42XqZSV1S3jq8MdouQ3U6ShAKQBjL8a_SC2nhV3BaQDT6ECkzTL_b-JohJUjNEgp-qCSb3m_hYLd3TKqQ-rnUFv8qgjbHdx6-ScJU8Bxee6a4Sicbx-F5mf3sNXURFP2iIJ9QRuC7nEqi-O309FtHzHwNdmQ1IlSI91VilyNZo6NbOjXr8SheEwyfh4M_A2rTnrpdoUsA_SEOOTwh9kAWKrLvAWlFdLpo_J1NhEJwx2eXyI1lu9LC088tZlquzXlOBm8Rb-Nim_qTd9lBmja-C3ygfOSrYaZcodIQ";
const dir = path.resolve("C:/Users/brian/Repos/Github Copilot CLI Prompt Docs/sela-webapp/Sound Display Transliteration/live");
const snap = async (p: Page, n: string) => { fs.mkdirSync(dir,{recursive:true}); await p.screenshot({path:path.join(dir,n+".png"),fullPage:false}); console.log("📸 "+n); };
const chip = async (p: Page, l: string) => { const b=p.locator("button.wordBlock"); for(let i=0;i<await b.count();i++){if((await b.nth(i).innerText()).replace(/\s+/g,"").startsWith(l)){await b.nth(i).click();await p.waitForTimeout(600);return;}} };

test.use({ viewport: { width: 1440, height: 810 } });

test("match PDF exactly", async ({ page }) => {
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

  // ZOOM: Click the scale dropdown trigger, then click "200%" preset
  const scaleTrigger = page.locator('#scaleInput').locator('..');
  await scaleTrigger.click();
  await page.waitForTimeout(500);
  // Click "200%" in the dropdown list
  const zoom200 = page.locator('li:has-text("200%")');
  if (await zoom200.isVisible().catch(() => false)) {
    await zoom200.click();
    await page.waitForTimeout(2000);
    console.log("✅ Zoomed to 200%");
  } else {
    console.log("⚠️ 200% option not found, trying list items...");
    const lis = page.locator('li');
    const liCount = await lis.count();
    for (let i = 0; i < liCount; i++) {
      const text = await lis.nth(i).innerText();
      console.log("  li[" + i + "]: " + text.trim());
      if (text.trim() === "200%") {
        await lis.nth(i).click();
        await page.waitForTimeout(2000);
        console.log("✅ Clicked 200%");
        break;
      }
    }
  }
  const zoomVal = await page.locator('#scaleInput').inputValue();
  console.log("Zoom now: " + zoomVal);

  // ================================================================
  // PAGE 4
  // ================================================================
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await page.waitForTimeout(800);
  let chev = page.locator('label[for="toggleLang"] svg').first();
  if (await chev.isVisible().catch(() => false)) { await chev.click(); await page.waitForTimeout(500); await page.locator('.shadow-lg button:has-text("Hebrew Transliteration")').last().click(); await page.waitForTimeout(1500); }
  chev = page.locator('label[for="toggleLang"] svg').first();
  if (await chev.isVisible().catch(() => false)) { await chev.click(); await page.waitForTimeout(500); }
  await snap(page, "01-page4-match");
  await page.mouse.click(100, 400); await page.waitForTimeout(300);
  await snap(page, "02-transliteration-clean");

  // PAGE 5
  await page.locator('label[for="toggleLang"] span').filter({ hasText: /^א$/ }).click();
  await page.waitForTimeout(800);
  chev = page.locator('label[for="toggleLang"] svg').first();
  if (await chev.isVisible().catch(() => false)) { await chev.click(); await page.waitForTimeout(500); const t=page.locator('.shadow-lg button:has-text("Transliteration")'); if(await t.isVisible().catch(()=>false)){await t.click();await page.waitForTimeout(1200);} chev=page.locator('label[for="toggleLang"] svg').first(); if(await chev.isVisible().catch(()=>false)){await chev.click();await page.waitForTimeout(500);} }
  await snap(page, "03-page5-match");
  await page.mouse.click(100, 400); await page.waitForTimeout(300);
  await snap(page, "04-page5-transliteration");

  // Sounds
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click(); await page.waitForTimeout(600);
  chev=page.locator('label[for="toggleLang"] svg').first(); if(await chev.isVisible().catch(()=>false)){await chev.click();await page.waitForTimeout(500);await page.locator('.shadow-lg button:has-text("Hebrew Transliteration")').last().click();await page.waitForTimeout(800);}
  const sb=page.getByRole("button",{name:"Sounds"});
  if(await sb.isVisible().catch(()=>false)){
    await sb.click({force:true});await page.waitForTimeout(1500);await snap(page,"05-sounds-panel");
    const tip=page.locator("span[title]").filter({hasText:"i"}).first();
    if(await tip.isVisible().catch(()=>false)){await tip.hover();await page.waitForTimeout(800);await snap(page,"06-tooltip");await page.mouse.move(0,0);await page.waitForTimeout(300);}
    try{await chip(page,"sh");const h=page.getByRole("button",{name:"Smart Highlight"}).first();if(await h.isVisible().catch(()=>false)){await h.click({force:true});await page.waitForTimeout(1200);await snap(page,"07-smart-highlight");const c=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c.isVisible().catch(()=>false)){await c.click();await page.waitForTimeout(600);}}await chip(page,"sh");}catch(e){console.log(e);}
    chev=page.locator('label[for="toggleLang"] svg').first();if(await chev.isVisible().catch(()=>false)){await chev.click();await page.waitForTimeout(500);await page.locator('.shadow-lg button:has-text("Hebrew OHB")').click();await page.waitForTimeout(800);}
    try{await chip(page,"sh");const h2=page.getByRole("button",{name:"Smart Highlight"}).first();if(await h2.isVisible().catch(()=>false)){await h2.click({force:true});await page.waitForTimeout(1200);await snap(page,"08-hebrew-highlight");const c2=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c2.isVisible().catch(()=>false)){await c2.click();await page.waitForTimeout(500);}}}catch{}
    const lb=page.getByRole("button",{name:/Hebrew Letter/i});if(await lb.isVisible().catch(()=>false)){await lb.click();await page.waitForTimeout(1500);await snap(page,"09-letter-panel");try{await chip(page,"ל");const h3=page.getByRole("button",{name:"Smart Highlight"}).first();if(await h3.isVisible().catch(()=>false)){await h3.click({force:true});await page.waitForTimeout(1200);await snap(page,"10-letter-highlight");}}catch{}}
    const acc=page.locator(".accordion").first();if(await acc.isVisible().catch(()=>false)){await acc.evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(500);await snap(page,"11-disclaimer");}
  }
  console.log("🎉 " + fs.readdirSync(dir).filter(f=>f.endsWith(".png")).length);
});

