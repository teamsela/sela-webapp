import { test } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";
const baseUrl = "https://sela-webapp-fugqxk5ml-sela-webapp.vercel.app";
const studyId = "cs8p4poa9c1akf2sireg";
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Nzg1NjQ3MDcsImlpZCI6Imluc18yYkQ1TGpzZEc1dWNnWDJDbHFpNlIzZ2VQdWgiLCJzaWQiOiJzaXRfM0NGRTI0VWk1a1J6NFJxTVd4QU5JYW9pUHJQIiwic3QiOiJzaWduX2luX3Rva2VuIn0.VuLXssVmHf_0nQIVr853m2P4kzBF0wRxVOn_ekiFHTcAM-eHamh4E1KiSNAfIzKerplXtO9M4dc8ELceEbzlTPVH-pxPRMHrfDOdMIJM24_tBdnqaxAE8K2MMucg2CSo4h7wVXVkaPMu70QdJeno_M0mOBmKDQIQsNmNNUoOzjeabOPa8peoUepbwlf-A5m35r0bHwtvJtcQQr57RGjh1WsrarKewlPj4fJRNvoRL2_QVW_KTqyttCNwARIBkxOVJflNGMB8hfyWSb5OMDQkJYugYed_TaAQJiIvSgsRmwZEYv-WtGBNDN7Xe1sh1a6-ynIeaWJ2nvYNYp_xrk5imQ";
const dir = path.resolve("C:/Users/brian/Repos/Github Copilot CLI Prompt Docs/sela-webapp/Sound Display Transliteration/live");
const snap = async (p: Page, n: string) => { fs.mkdirSync(dir,{recursive:true}); await p.screenshot({path:path.join(dir,n+".png"),fullPage:false}); console.log("📸 "+n); };
const chip = async (p: Page, l: string) => { const b=p.locator("button.wordBlock"); for(let i=0;i<await b.count();i++){if((await b.nth(i).innerText()).replace(/\s+/g,"").startsWith(l)){await b.nth(i).click();await p.waitForTimeout(600);return;}} };

test.use({ viewport: { width: 1600, height: 900 } });

test("capture Psalm 23", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(baseUrl + "/sign-in?__clerk_ticket=" + token);
  await page.waitForTimeout(8000);
  console.log("Login URL:", page.url());
  
  await page.goto(baseUrl + "/study/" + studyId + "/edit?t=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(6000);
  console.log("Study URL:", page.url());
  await page.evaluate(() => { (document.body.style as any).zoom = "0.85"; });
  await page.waitForTimeout(1000);
  await snap(page, "01-study-loaded");

  const tg = page.locator('label[for="toggleLang"]');
  if (await tg.isVisible().catch(() => false)) {
    await page.locator('label[for="toggleLang"] span').first().click();
    await page.waitForTimeout(600);
    await page.locator('label[for="toggleLang"] span', { hasText: "Aא" }).first().click();
    await page.waitForTimeout(1000);
    await snap(page, "02-parallel-mode");
    const sel = page.locator("select").first();
    if (await sel.isVisible().catch(() => false)) {
      console.log("✅ Dropdown");
      await sel.selectOption({ index: 1 });
      await page.waitForTimeout(1200);
      await snap(page, "03-transliteration");
      await sel.selectOption({ index: 0 });
      await page.waitForTimeout(800);
    }
  }
  const sb = page.getByRole("button", { name: "Sounds" });
  if (await sb.isVisible().catch(() => false)) {
    await sb.click({ force: true }); await page.waitForTimeout(1500); await snap(page, "04-sounds-panel");
    const tip = page.locator("span[title]").filter({ hasText: "i" }).first();
    if (await tip.isVisible().catch(() => false)) { await tip.hover(); await page.waitForTimeout(800); await snap(page, "05-tooltip"); await page.mouse.move(0,0); await page.waitForTimeout(300); }
    try { await chip(page,"sh"); await snap(page,"06-sh-selected");
      const h=page.getByRole("button",{name:"Smart Highlight"}).first();
      if(await h.isVisible().catch(()=>false)){await h.click({force:true});await page.waitForTimeout(1200);await snap(page,"07-smart-highlight");
      const c=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c.isVisible().catch(()=>false)){await c.click();await page.waitForTimeout(600);}}
      await chip(page,"sh");} catch(e){console.log(e);}
    try { await chip(page,"sh"); await chip(page,"m");
      const h2=page.getByRole("button",{name:"Smart Highlight"}).first();
      if(await h2.isVisible().catch(()=>false)){await h2.click({force:true});await page.waitForTimeout(1200);await snap(page,"08-multi-highlight");
      const c2=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c2.isVisible().catch(()=>false)){await c2.click();await page.waitForTimeout(500);}
      }await chip(page,"sh");await chip(page,"m");} catch{}
    const lb=page.getByRole("button",{name:/Hebrew Letter/i});
    if(await lb.isVisible().catch(()=>false)){await lb.click();await page.waitForTimeout(1500);await snap(page,"09-letter-panel");
      try{await chip(page,"ל");const h3=page.getByRole("button",{name:"Smart Highlight"}).first();
      if(await h3.isVisible().catch(()=>false)){await h3.click({force:true});await page.waitForTimeout(1200);await snap(page,"10-letter-highlight");
      const c3=page.getByRole("button",{name:"Clear Highlight"}).first();if(await c3.isVisible().catch(()=>false)){await c3.click();await page.waitForTimeout(500);}}}catch{}}
    const acc=page.locator(".accordion").first();
    if(await acc.isVisible().catch(()=>false)){await acc.evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(500);await snap(page,"11-disclaimer");}
  }
  console.log("🎉 " + fs.readdirSync(dir).filter(f=>f.endsWith(".png")).length);
});

