const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function capture() {
  console.log('Connecting to live app on http://localhost:8081...');
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  });

  const outDir = path.resolve("D:/unihub/playstore-assets/screenshots/live");
  fs.mkdirSync(outDir, { recursive: true });

  const routes = [
    { name: 'live_app_1_home.png', path: '/' },
    { name: 'live_app_2_explore.png', path: '/explore' },
    { name: 'live_app_3_community.png', path: '/community' },
    { name: 'live_app_4_profile.png', path: '/profile' },
  ];

  for (const r of routes) {
    const page = await context.newPage();
    const url = `http://localhost:8081${r.path}`;
    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(4000);
      const filePath = path.join(outDir, r.name);
      await page.screenshot({ path: filePath });
      console.log(`Captured: ${filePath}`);
    } catch (e) {
      console.log(`Error on ${r.path}:`, e.message);
    }
    await page.close();
  }

  await browser.close();
  console.log('Done capturing live app screenshots!');
}

capture().catch(console.error);
