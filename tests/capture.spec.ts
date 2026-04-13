import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";
const baseUrl = "https://sela-webapp-25ztgh1ri-sela-webapp.vercel.app";
const studyId = "cs8p4poa9c1akf2sireg";
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzg2NTg2MjgsImlpZCI6Imluc18yYkQ1TGpzZEc1dWNnWDJDbHFpNlIzZ2VQdWgiLCJzaWQiOiJzaXRfM0NJSU91Z2Q3Vm90N0JBbU5aSEFGYmpMdHhNIiwic3QiOiJzaWduX2luX3Rva2VuIn0.J2NZulXECU0ReuJynLtgALCDLVlFV_sKjadJD1jNyqfWCeh5SrPpCy0r0FxJBa6OS1ZClOr8Y_xpYh3mw7pXejXBv2YnHUx1j5puSeBdRrJQ2FGAHOGg7ZwjRgTNUG0GSw087vpbEctTxhDuwiSxu_nrfjiaGMMToEpIgkMtg6ZZ-cCDMdLmPkU6irYjAPygWYronnkeZ0ABTCE8nvioOftecjuEyXGFhQiX0FmOjJL9-RocSksmiG2XLJZxrH3xjJFjisq9ydm_Xrq1no6KHHwfgS4_3JQvh10zyyTtytRwFXt3149kQbXJqQPedau1vhsPhY1ezXMEQEf30m4sVg";
const dir = path.resolve("C:/Users/brian/Repos/Github Copilot CLI Prompt Docs/sela-webapp/Sound Display Transliteration/live");
const snap = async (p: Page, n: string) => { fs.mkdirSync(dir,{recursive:true}); await p.screenshot({path:path.join(dir,n+".png"),fullPage:false}); console.log("📸 "+n); };
const chip = async (p: Page, l: string) => { const b=p.locator("button.wordBlock"); for(let i=0;i<await b.count();i++){if((await b.nth(i).innerText()).replace(/\s+/g,"").startsWith(l)){await b.nth(i).click();await p.waitForTimeout(600);return;}} };

test.use({ viewport: { width: 1600, height: 900 } });

test("capture all dropdown states + features", async ({ page }) => {
  test.setTimeout(180_000);
  
  // Login
  await page.goto(baseUrl + "/sign-in?__clerk_ticket=" + token);
  await page.waitForTimeout(8000);

  // Load Psalm 23
  for (let i = 0; i < 5; i++) {
    await page.goto(baseUrl + "/study/" + studyId + "/edit?t=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    if (!(await page.locator("text=Application error").isVisible().catch(() => false))) {
      const ok = await page.locator('label[for="toggleLang"]').isVisible().catch(() => false);
      if (ok) { console.log("✅ Study loaded"); break; }
    }
    console.log("retry " + (i+1));
    await page.waitForTimeout(3000);
  }
  
  await page.evaluate(() => { (document.body.style as any).zoom = "0.85"; });
  await page.waitForTimeout(1000);

  // === DROPDOWN SCREENSHOTS (matching PDF pages 2-5 exactly) ===
  
  // 1. A mode — click A, show chevron, open dropdown showing "English Gloss" (PDF Page 3)
  await page.locator('label[for="toggleLang"] span').first().click(); // click A
  await page.waitForTimeout(800);
  await snap(page, "01-A-mode-english");
  // Open A dropdown
  const chevA = page.locator('label[for="toggleLang"] svg').first();
  if (await chevA.isVisible().catch(() => false)) {
    await chevA.click();
    await page.waitForTimeout(600);
    await snap(page, "02-A-dropdown-open");  // Shows "English Gloss" 
    // Close
    await page.mouse.click(400, 400);
    await page.waitForTimeout(400);
  }

  // 2. Aא mode — click Aא, open dropdown showing 3 options (PDF Page 4)
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await page.waitForTimeout(1000);
  await snap(page, "03-Ax-mode-parallel");
  // Open Aא dropdown
  const chevAx = page.locator('label[for="toggleLang"] svg').first();
  if (await chevAx.isVisible().catch(() => false)) {
    await chevAx.click();
    await page.waitForTimeout(600);
    await snap(page, "04-Ax-dropdown-3-options");  // Shows 3 options!
    // Select "English Gloss / Hebrew Transliteration"
    await page.locator('.shadow-lg button:has-text("Hebrew Transliteration")').last().click();
    await page.waitForTimeout(1200);
    await snap(page, "05-transliteration-active");
    // Back to Hebrew OHB
    const chevAx2 = page.locator('label[for="toggleLang"] svg').first();
    if (await chevAx2.isVisible().catch(() => false)) {
      await chevAx2.click();
      await page.waitForTimeout(500);
      await page.locator('.shadow-lg button:has-text("Hebrew OHB")').click();
      await page.waitForTimeout(800);
    }
  }

  // 3. א mode — click א, open dropdown showing 2 options (PDF Page 5)
  await page.locator('label[for="toggleLang"] span').filter({ hasText: /^א$/ }).click();
  await page.waitForTimeout(1000);
  await snap(page, "06-x-mode-hebrew");
  const chevX = page.locator('label[for="toggleLang"] svg').first();
  if (await chevX.isVisible().catch(() => false)) {
    await chevX.click();
    await page.waitForTimeout(600);
    await snap(page, "07-x-dropdown-2-options");  // Shows "Hebrew OHB" + "Transliteration"
    // Close
    await page.mouse.click(400, 400);
    await page.waitForTimeout(400);
  }

  // Back to parallel for Sounds features
  await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
  await page.waitForTimeout(800);

  // === SOUND DISTRIBUTION SCREENSHOTS ===
  const sb = page.getByRole("button", { name: "Sounds" });
  if (await sb.isVisible().catch(() => false)) {
    await sb.click({ force: true }); await page.waitForTimeout(1500);
    await snap(page, "08-sounds-panel");
    
    // Tooltip
    const tip = page.locator("span[title]").filter({ hasText: "i" }).first();
    if (await tip.isVisible().catch(() => false)) { await tip.hover(); await page.waitForTimeout(800); await snap(page, "09-tooltip"); await page.mouse.move(0,0); await page.waitForTimeout(300); }
    
    // sh chip + highlight
    try { await chip(page,"sh"); await snap(page,"10-sh-selected");
      const h=page.getByRole("button",{name:"Smart Highlight"}).first();
      if(await h.isVisible().catch(()=>false)){await h.click({force:true});await page.waitForTimeout(1200);await snap(page,"11-smart-highlight");
      const c=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c.isVisible().catch(()=>false)){await c.click();await page.waitForTimeout(600);}}
      await chip(page,"sh");} catch(e){console.log(e);}
    
    // Multi
    try { await chip(page,"sh"); await chip(page,"m");
      const h2=page.getByRole("button",{name:"Smart Highlight"}).first();
      if(await h2.isVisible().catch(()=>false)){await h2.click({force:true});await page.waitForTimeout(1200);await snap(page,"12-multi-highlight");
      const c2=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c2.isVisible().catch(()=>false)){await c2.click();await page.waitForTimeout(500);}
      }await chip(page,"sh");await chip(page,"m");} catch{}
    
    // Letters
    const lb=page.getByRole("button",{name:/Hebrew Letter/i});
    if(await lb.isVisible().catch(()=>false)){await lb.click();await page.waitForTimeout(1500);await snap(page,"13-letter-panel");
      try{await chip(page,"ל");const h3=page.getByRole("button",{name:"Smart Highlight"}).first();
      if(await h3.isVisible().catch(()=>false)){await h3.click({force:true});await page.waitForTimeout(1200);await snap(page,"14-letter-highlight");
      const c3=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c3.isVisible().catch(()=>false)){await c3.click();await page.waitForTimeout(500);}}}catch{}}
    
    // Disclaimer
    const acc=page.locator(".accordion").first();
    if(await acc.isVisible().catch(()=>false)){await acc.evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(500);await snap(page,"15-disclaimer");}
  }
  
  console.log("🎉 " + fs.readdirSync(dir).filter(f=>f.endsWith(".png")).length + " screenshots");
});
